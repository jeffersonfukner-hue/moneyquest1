import { useState, useEffect, useMemo } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, CalendarIcon, Coins, CheckCircle2, AlertCircle } from 'lucide-react';
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

interface AddTransactionDialogProps {
  onAdd: (transaction: {
    description: string;
    amount: number;
    category: string;
    type: TransactionType;
    date: string;
    currency: string;
  }) => Promise<{ error: Error | null }>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AddTransactionDialog = ({ onAdd, open: controlledOpen, onOpenChange }: AddTransactionDialogProps) => {
  const { t } = useTranslation();
  const { dateLocale } = useLanguage();
  const { currencySymbol, currency } = useCurrency();
  const { getCategoriesByType, addCategory } = useCategories();
  const { goals, refetch: refetchGoals } = useCategoryGoals();
  const { canAccessCategoryGoals } = useSubscription();
  
  const [internalOpen, setInternalOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(currency);
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [showGoalPrompt, setShowGoalPrompt] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Validation state
  const [touched, setTouched] = useState<{
    description: boolean;
    amount: boolean;
    category: boolean;
  }>({ description: false, amount: false, category: false });
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Validation helpers
  const errors = {
    description: !description.trim(),
    amount: !amount || parseFloat(amount) <= 0,
    category: !category,
  };
  const hasErrors = errors.description || errors.amount || errors.category;

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
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    
    if (hasErrors) {
      setTouched({ description: true, amount: true, category: true });
      return;
    }

    setLoading(true);
    const { error } = await onAdd({
      description,
      amount: parseFloat(amount),
      category,
      type,
      date: format(date, 'yyyy-MM-dd'),
      currency: selectedCurrency,
    });

    if (!error) {
      // Show confirmation instead of closing immediately
      setShowConfirmation(true);
    }
    setLoading(false);
  };

  const handleAddAnother = () => {
    // Reset form but keep dialog open
    setShowConfirmation(false);
    setDescription('');
    setAmount('');
    setCategory('');
    setSelectedCurrency(currency);
    setDate(new Date());
    setTouched({ description: false, amount: false, category: false });
    setAttemptedSubmit(false);
  };

  const handleDone = () => {
    // Reset and close
    setShowConfirmation(false);
    setDescription('');
    setAmount('');
    setCategory('');
    setSelectedCurrency(currency);
    setDate(new Date());
    setTouched({ description: false, amount: false, category: false });
    setAttemptedSubmit(false);
    setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button 
            size="lg" 
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-hero hover:opacity-90 transition-all hover:scale-105"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t('transactions.addTransaction')}</DialogTitle>
        </DialogHeader>
        
        {showConfirmation ? (
          // Confirmation state after successful save
          <div className="py-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-income/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-income" />
              </div>
              <h3 className="text-lg font-semibold">{t('feedback.transactionSaved')}</h3>
              <p className="text-muted-foreground">{t('feedback.addAnotherQuestion')}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 min-h-[48px]"
                onClick={handleDone}
              >
                {t('feedback.done')}
              </Button>
              <Button
                className="flex-1 min-h-[48px] bg-gradient-hero hover:opacity-90"
                onClick={handleAddAnother}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('feedback.addAnother')}
              </Button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'INCOME' ? 'default' : 'outline'}
              className={cn(
                "flex-1 min-h-[48px]",
                type === 'INCOME' && 'bg-income hover:bg-income/90'
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
                type === 'EXPENSE' && 'bg-expense hover:bg-expense/90'
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
            className="w-full min-h-[48px] bg-gradient-hero hover:opacity-90"
            disabled={loading}
          >
            {loading ? t('common.loading') : `${t('common.add')} 🎮`}
          </Button>
        </form>
        )}

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
