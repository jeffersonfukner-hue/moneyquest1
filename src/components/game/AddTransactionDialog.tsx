import { useState, useEffect, useMemo } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, CalendarIcon, Coins, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TransactionType, SupportedCurrency } from '@/types/database';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCategories } from '@/hooks/useCategories';
import { useCategoryGoals } from '@/hooks/useCategoryGoals';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { QuickAddCategoryDialog } from '@/components/categories/QuickAddCategoryDialog';
import { QuickAddGoalPrompt } from '@/components/goals/QuickAddGoalPrompt';
import { SUPPORTED_CURRENCIES } from '@/i18n';
import { getCategoryTranslationKey } from '@/lib/gameLogic';
import { WalletSelector } from '@/components/wallets/WalletSelector';
import { useWallets } from '@/hooks/useWallets';

export interface SessionSummary {
  transactionCount: number;
  totalExpense: number;
  totalIncome: number;
  xpGained: number;
}

interface AddTransactionDialogProps {
  onAdd: (transaction: {
    description: string;
    amount: number;
    category: string;
    type: TransactionType;
    date: string;
    currency: string;
    wallet_id: string;
  }) => Promise<{ error: Error | null; xpEarned?: number }>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSessionComplete?: (summary: SessionSummary) => void;
}

export const AddTransactionDialog = ({ onAdd, open: controlledOpen, onOpenChange, onSessionComplete }: AddTransactionDialogProps) => {
  const { t } = useTranslation();
  const { dateLocale } = useLanguage();
  const { currencySymbol, currency } = useCurrency();
  const { getCategoriesByType, addCategory } = useCategories();
  const { goals, refetch: refetchGoals } = useCategoryGoals();
  const { canAccessCategoryGoals } = useSubscription();
  const { activeWallets, refetch: refetchWallets } = useWallets();
  
  const [internalOpen, setInternalOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(currency);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [showGoalPrompt, setShowGoalPrompt] = useState(false);
  
  // Session tracking
  const [sessionData, setSessionData] = useState<SessionSummary>({
    transactionCount: 0,
    totalExpense: 0,
    totalIncome: 0,
    xpGained: 0,
  });
  
  // Validation state
  const [touched, setTouched] = useState<{
    description: boolean;
    amount: boolean;
    category: boolean;
    wallet: boolean;
  }>({ description: false, amount: false, category: false, wallet: false });
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Validation helpers
  const errors = {
    description: !description.trim(),
    amount: !amount || parseFloat(amount) <= 0,
    category: !category,
    wallet: !walletId,
  };
  const hasErrors = errors.description || errors.amount || errors.category || errors.wallet;

  // Check if selected category has a goal
  const categoryHasGoal = useMemo(() => {
    if (!category || type !== 'EXPENSE') return true;
    return goals.some(g => g.category === category);
  }, [category, goals, type]);

  // Show goal prompt when selecting expense category without goal (premium only)
  useEffect(() => {
    if (type === 'EXPENSE' && category && !categoryHasGoal && canAccessCategoryGoals) {
      setShowGoalPrompt(true);
    } else {
      setShowGoalPrompt(false);
    }
  }, [category, categoryHasGoal, type, canAccessCategoryGoals]);

  // Update selected currency when user's default currency changes
  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  // Use controlled or internal state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  
  // Handle dialog close and session complete
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && sessionData.transactionCount > 0) {
      // Dialog is closing and we have transactions in session
      onSessionComplete?.(sessionData);
      // Reset session data
      setSessionData({
        transactionCount: 0,
        totalExpense: 0,
        totalIncome: 0,
        xpGained: 0,
      });
    }
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    
    if (hasErrors) {
      setTouched({ description: true, amount: true, category: true, wallet: true });
      return;
    }

    setLoading(true);
    const parsedAmount = parseFloat(amount);
    const result = await onAdd({
      description,
      amount: parsedAmount,
      category,
      type,
      date: format(date, 'yyyy-MM-dd'),
      currency: selectedCurrency,
      wallet_id: walletId!,
    });

    if (!result.error) {
      // Update session data
      setSessionData(prev => ({
        transactionCount: prev.transactionCount + 1,
        totalExpense: prev.totalExpense + (type === 'EXPENSE' ? parsedAmount : 0),
        totalIncome: prev.totalIncome + (type === 'INCOME' ? parsedAmount : 0),
        xpGained: prev.xpGained + (result.xpEarned || 10),
      }));
      
      // Reset form for next transaction (keep date and wallet for convenience)
      setDescription('');
      setAmount('');
      setCategory('');
      setSelectedCurrency(currency);
      // Wallet and date are intentionally kept for multiple transactions
      setTouched({ description: false, amount: false, category: false, wallet: false });
      setAttemptedSubmit(false);
    }
    setLoading(false);
  };

  // Validation message component
  const ValidationMessage = ({ show, message }: { show: boolean; message: string }) => {
    if (!show) return null;
    return (
      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="w-3 h-3" />
        {message}
      </p>
    );
  };

  const categories = getCategoriesByType(type);

  const handleQuickAddCategory = async (name: string, icon: string, color: string) => {
    const newCat = await addCategory(name, type, icon, color);
    if (newCat) {
      setCategory(newCat.name);
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === '__new__') {
      setQuickAddOpen(true);
    } else {
      setCategory(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button 
            variant="gold"
            size="lg" 
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md mx-4 border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">{t('transactions.addTransaction')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'INCOME' ? 'default' : 'outline'}
              className={cn(
                "flex-1 min-h-[48px]",
                type === 'INCOME' && 'bg-success hover:bg-success/90 text-white'
              )}
              onClick={() => {
                setType('INCOME');
                setCategory('');
              }}
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              {t('transactions.income')}
            </Button>
            <Button
              type="button"
              variant={type === 'EXPENSE' ? 'default' : 'outline'}
              className={cn(
                "flex-1 min-h-[48px]",
                type === 'EXPENSE' && 'bg-destructive hover:bg-destructive/90 text-white'
              )}
              onClick={() => {
                setType('EXPENSE');
                setCategory('');
              }}
            >
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              {t('transactions.expense')}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-1">
              {t('transactions.description')}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="description"
              placeholder={t('transactions.description')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
              className={cn(
                "min-h-[48px]",
                (touched.description || attemptedSubmit) && errors.description && 
                  "border-destructive focus-visible:ring-destructive"
              )}
              aria-invalid={(touched.description || attemptedSubmit) && errors.description}
            />
            <ValidationMessage 
              show={(touched.description || attemptedSubmit) && errors.description}
              message={t('validation.descriptionRequired')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-1">
              {t('transactions.amount')}
              <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Select value={selectedCurrency} onValueChange={(v) => setSelectedCurrency(v as SupportedCurrency)}>
                <SelectTrigger className="w-24 min-h-[48px] flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {Object.entries(SUPPORTED_CURRENCIES).map(([code, config]) => (
                    <SelectItem key={code} value={code} className="min-h-[44px]">
                      <span className="flex items-center gap-2">
                        <Coins className="w-4 h-4" />
                        <span>{config.symbol}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, amount: true }))}
                className={cn(
                  "min-h-[48px] flex-1",
                  (touched.amount || attemptedSubmit) && errors.amount && 
                    "border-destructive focus-visible:ring-destructive"
                )}
                aria-invalid={(touched.amount || attemptedSubmit) && errors.amount}
              />
            </div>
            <ValidationMessage 
              show={(touched.amount || attemptedSubmit) && errors.amount}
              message={t('validation.amountRequired')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center gap-1">
              {t('transactions.category')}
              <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={category} 
              onValueChange={(v) => {
                handleCategoryChange(v);
                setTouched(prev => ({ ...prev, category: true }));
              }}
            >
              <SelectTrigger className={cn(
                "min-h-[48px]",
                (touched.category || attemptedSubmit) && errors.category && 
                  "border-destructive focus-visible:ring-destructive"
              )}>
                <SelectValue placeholder={t('transactions.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => {
                  const translationKey = cat.is_default ? getCategoryTranslationKey(cat.name, type) : null;
                  const displayName = translationKey ? t(`transactions.categories.${translationKey}`) : cat.name;
                  return (
                    <SelectItem key={cat.id} value={cat.name} className="min-h-[44px]">
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{displayName}</span>
                      </span>
                    </SelectItem>
                  );
                })}
                <SelectItem value="__new__" className="min-h-[44px] text-primary">
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>{t('categories.newCategory')}</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <ValidationMessage 
              show={(touched.category || attemptedSubmit) && errors.category}
              message={t('validation.categoryRequired')}
            />
            
            {showGoalPrompt && (
              <QuickAddGoalPrompt
                category={category}
                onSuccess={() => {
                  setShowGoalPrompt(false);
                  refetchGoals();
                }}
                onDismiss={() => setShowGoalPrompt(false)}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              {t('wallets.wallet')}
              <span className="text-destructive">*</span>
            </Label>
            <WalletSelector
              wallets={activeWallets}
              selectedWalletId={walletId}
              onSelect={(id) => {
                setWalletId(id);
                setTouched(prev => ({ ...prev, wallet: true }));
              }}
              onWalletCreated={(wallet) => {
                refetchWallets();
                setWalletId(wallet.id);
              }}
              required
            />
            <ValidationMessage 
              show={(touched.wallet || attemptedSubmit) && errors.wallet}
              message={t('validation.walletRequired')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('transactions.date')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal min-h-[48px]",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: dateLocale }) : <span>{t('transactions.selectDate')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            type="submit" 
            variant="gold"
            className="w-full min-h-[48px]"
            disabled={loading}
          >
            {loading ? t('common.loading') : `${t('common.add')} 🎮`}
          </Button>
        </form>

        <QuickAddCategoryDialog
          open={quickAddOpen}
          onOpenChange={setQuickAddOpen}
          onAdd={handleQuickAddCategory}
          type={type}
        />
      </DialogContent>
    </Dialog>
  );
};
