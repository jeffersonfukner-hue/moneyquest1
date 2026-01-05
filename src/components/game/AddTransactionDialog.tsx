import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, CalendarIcon, Coins, AlertCircle, List, Scan, Crown, ChevronDown, ChevronUp, Wallet, CreditCard } from 'lucide-react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TransactionType, SupportedCurrency } from '@/types/database';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCategories } from '@/hooks/useCategories';
import { useCategoryGoals } from '@/hooks/useCategoryGoals';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/hooks/useAuth';
import { QuickAddCategoryDialog } from '@/components/categories/QuickAddCategoryDialog';
import { QuickAddGoalPrompt } from '@/components/goals/QuickAddGoalPrompt';
import { SUPPORTED_CURRENCIES } from '@/i18n';
import { getCategoryTranslationKey } from '@/lib/gameLogic';
import { WalletSelector } from '@/components/wallets/WalletSelector';
import { useWallets } from '@/hooks/useWallets';
import { useCreditCards } from '@/hooks/useCreditCards';
import { ItemBreakdownEditor, TransactionItem } from '@/components/premium/ItemBreakdownEditor';
import { ReceiptOCRButton } from '@/components/premium/ReceiptOCRButton';
import { PremiumUpsellModal } from '@/components/premium/PremiumFeatureGate';
import { AddCreditCardDialog } from '@/components/creditCards/AddCreditCardDialog';
import { supabase } from '@/integrations/supabase/client';

export interface SessionSummary {
  transactionCount: number;
  totalExpense: number;
  totalIncome: number;
  xpGained: number;
}

export interface PrefillData {
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  currency: string;
  wallet_id: string | null;
}

// Source type for transaction destination
type SourceType = 'account' | 'card';

interface AddTransactionDialogProps {
  onAdd: (transaction: {
    description: string;
    amount: number;
    category: string;
    type: TransactionType;
    date: string;
    currency: string;
    wallet_id: string;
    source_type?: string;
    transaction_subtype?: string;
    credit_card_id?: string;
    items?: Array<{ name: string; amount: number }>;
  }) => Promise<{ error: Error | null; xpEarned?: number }>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSessionComplete?: (summary: SessionSummary) => void;
  prefillData?: PrefillData | null;
}

export const AddTransactionDialog = ({ onAdd, open: controlledOpen, onOpenChange, onSessionComplete, prefillData }: AddTransactionDialogProps) => {
  const { t } = useTranslation();
  const { dateLocale } = useLanguage();
  const { currencySymbol, currency } = useCurrency();
  const { getCategoriesByType, addCategory } = useCategories();
  const { goals, refetch: refetchGoals } = useCategoryGoals();
  const { canAccessCategoryGoals, isPremium } = useSubscription();
  const { activeWallets, refetch: refetchWallets } = useWallets();
  const { activeCards, refetch: refetchCards, addCreditCard } = useCreditCards();
  const { user } = useAuth();
  
  const [internalOpen, setInternalOpen] = useState(false);
  // First choice: account or credit card
  const [sourceType, setSourceType] = useState<SourceType | null>(null);
  // Credit card selection step
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showCardSelection, setShowCardSelection] = useState(false);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(currency);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const [showGoalPrompt, setShowGoalPrompt] = useState(false);
  
  // Premium features state
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdownItems, setBreakdownItems] = useState<TransactionItem[]>([]);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [upsellFeature, setUpsellFeature] = useState<'item_breakdown' | 'receipt_ocr'>('item_breakdown');
  
  // Session tracking
  const [sessionData, setSessionData] = useState<SessionSummary>({
    transactionCount: 0,
    totalExpense: 0,
    totalIncome: 0,
    xpGained: 0,
  });
  
  // Get selected card details
  const selectedCard = useMemo(() => {
    return activeCards.find(c => c.id === selectedCardId) || null;
  }, [activeCards, selectedCardId]);
  
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
    category: !category || category === '__new__',
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

  // Handle prefill data (for duplicating transactions)
  useEffect(() => {
    if (prefillData) {
      setType(prefillData.type);
      setDescription(prefillData.description.toUpperCase());
      setAmount(prefillData.amount.toString());
      setCategory(prefillData.category);
      setSelectedCurrency(prefillData.currency as SupportedCurrency);
      if (prefillData.wallet_id) {
        setWalletId(prefillData.wallet_id);
      }
      // Date is always set to today for duplicates
      setDate(new Date());
    }
  }, [prefillData]);

  // Use controlled or internal state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  
  // Handle dialog close and session complete
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset source selection when dialog closes
      setSourceType(null);
      setSelectedCardId(null);
      setShowCardSelection(false);
      setType('EXPENSE');
      setCategory('');
      
      if (sessionData.transactionCount > 0) {
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
    }
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  // Handle source type selection
  const handleSourceTypeSelect = (source: SourceType) => {
    setSourceType(source);
    if (source === 'card') {
      // For credit card, show card selection step
      setType('EXPENSE');
      setShowCardSelection(true);
    }
    setCategory('');
  };

  // Handle card selection
  const handleCardSelect = (cardId: string) => {
    setSelectedCardId(cardId);
    setShowCardSelection(false);
  };

  // Handle add card success
  const handleAddCardSuccess = async (cardData: any) => {
    const newCard = await addCreditCard(cardData);
    if (newCard) {
      setSelectedCardId(newCard.id);
      setShowCardSelection(false);
      setShowAddCardDialog(false);
    }
  };

  // Go back to card selection
  const handleBackToCardSelection = () => {
    setShowCardSelection(true);
    setSelectedCardId(null);
    setDescription('');
    setAmount('');
    setCategory('');
    setTouched({ description: false, amount: false, category: false, wallet: false });
    setAttemptedSubmit(false);
  };

  // Go back to source selection
  const handleBackToSourceSelection = () => {
    setSourceType(null);
    setSelectedCardId(null);
    setShowCardSelection(false);
    setType('EXPENSE');
    setCategory('');
    setDescription('');
    setAmount('');
    setTouched({ description: false, amount: false, category: false, wallet: false });
    setAttemptedSubmit(false);
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
    
    // Validate breakdown items sum if breakdown is enabled
    if (showBreakdown && breakdownItems.length > 0) {
      const itemsTotal = breakdownItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const difference = Math.abs(parsedAmount - itemsTotal);
      if (difference > 0.01) {
        setLoading(false);
        return;
      }
    }
    
    // Determine source_type and transaction_subtype based on selection
    const isCardExpense = sourceType === 'card';
    
    const result = await onAdd({
      description,
      amount: parsedAmount,
      category,
      type,
      date: format(date, 'yyyy-MM-dd'),
      currency: selectedCurrency,
      wallet_id: walletId!,
      // Set source_type and transaction_subtype for card expenses
      ...(isCardExpense && {
        source_type: 'card',
        transaction_subtype: 'card_expense',
        credit_card_id: selectedCardId || undefined,
      }),
      // Include breakdown items if enabled (Premium only) - only for card expenses
      ...(showBreakdown && breakdownItems.length > 0 && isCardExpense && {
        items: breakdownItems.filter(item => item.name && item.amount > 0).map(item => ({
          name: item.name,
          amount: item.amount,
        })),
      }),
    });

    if (!result.error) {
      // Refetch wallets to update balances in the selector
      refetchWallets();
      
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
      setShowBreakdown(false);
      setBreakdownItems([]);
      // Wallet and date are intentionally kept for multiple transactions
      setTouched({ description: false, amount: false, category: false, wallet: false });
      setAttemptedSubmit(false);
      
      // Focus on description field for next transaction
      setTimeout(() => {
        descriptionInputRef.current?.focus();
      }, 100);
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

  // Premium feature handlers
  const handleBreakdownToggle = async () => {
    if (!isPremium) {
      // Track attempt
      if (user) {
        await supabase.from('ab_test_events').insert({
          user_id: user.id,
          test_name: 'premium_features',
          variant: 'item_breakdown',
          event_type: 'premium_feature_attempt',
          metadata: { feature: 'item_breakdown', blocked: true }
        });
      }
      setUpsellFeature('item_breakdown');
      setShowUpsellModal(true);
      return;
    }
    setShowBreakdown(!showBreakdown);
    if (!showBreakdown && breakdownItems.length === 0) {
      // Add first item when opening
      setBreakdownItems([{ id: crypto.randomUUID(), name: '', amount: parseFloat(amount) || 0 }]);
    }
  };

  const handleOCRClick = async () => {
    if (!isPremium) {
      if (user) {
        await supabase.from('ab_test_events').insert({
          user_id: user.id,
          test_name: 'premium_features',
          variant: 'receipt_ocr',
          event_type: 'premium_feature_attempt',
          metadata: { feature: 'receipt_ocr', blocked: true }
        });
      }
      setUpsellFeature('receipt_ocr');
      setShowUpsellModal(true);
    }
  };

  const handleOCRResult = (data: { storeName?: string; date?: string; total?: number; items: { name: string; amount: number }[]; suggestedCategory?: string }) => {
    // Fill form with OCR results
    if (data.storeName) {
      setDescription(data.storeName.toUpperCase());
    }
    if (data.total) {
      setAmount(data.total.toString());
    }
    if (data.date) {
      const parsedDate = new Date(data.date);
      if (!isNaN(parsedDate.getTime())) {
        setDate(parsedDate);
      }
    }
    if (data.suggestedCategory) {
      // Try to match with existing categories
      const matchedCat = categories.find(c => 
        c.name.toLowerCase().includes(data.suggestedCategory!.toLowerCase()) ||
        data.suggestedCategory!.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matchedCat) {
        setCategory(matchedCat.name);
      }
    }
    if (data.items && data.items.length > 0) {
      setShowBreakdown(true);
      setBreakdownItems(data.items.map(item => ({
        id: crypto.randomUUID(),
        name: item.name,
        amount: item.amount
      })));
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
      <DialogContent 
        className="sm:max-w-md w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] sm:w-full border-border max-h-[85vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          // On mobile, prevent auto-focus to avoid immediate keyboard
          if (window.innerWidth < 640) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary">
            {sourceType === null 
              ? t('transactions.addTransaction')
              : sourceType === 'card' 
                ? t('transactions.cardExpense', 'Gasto no Cartão')
                : t('transactions.addTransaction')
            }
          </DialogTitle>
        </DialogHeader>
        
        {/* Step 1: Source Selection */}
        {sourceType === null ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('transactions.selectSource', 'Escolha onde registrar esta transação:')}
            </p>
            <div className="grid grid-cols-1 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
                onClick={() => handleSourceTypeSelect('account')}
              >
                <Wallet className="w-8 h-8 text-primary" />
                <div className="text-center">
                  <p className="font-medium">{t('transactions.bankAccount', 'Conta Bancária')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('transactions.bankAccountDesc', 'Receitas e despesas da conta')}
                  </p>
                </div>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-amber-500 hover:bg-amber-500/5"
                onClick={() => handleSourceTypeSelect('card')}
              >
                <CreditCard className="w-8 h-8 text-amber-600" />
                <div className="text-center">
                  <p className="font-medium">{t('transactions.creditCard', 'Cartão de Crédito')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('transactions.creditCardDesc', 'Compras no cartão de crédito')}
                  </p>
                </div>
              </Button>
            </div>
          </div>
        ) : sourceType === 'card' && showCardSelection ? (
          /* Step 2 (Card): Select Credit Card */
          <div className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground -ml-2"
              onClick={handleBackToSourceSelection}
            >
              <ChevronUp className="w-4 h-4 mr-1 rotate-[-90deg]" />
              {t('common.back', 'Voltar')}
            </Button>
            
            <p className="text-sm text-muted-foreground">
              {t('transactions.selectCard', 'Selecione o cartão:')}
            </p>
            
            {activeCards.length === 0 ? (
              <div className="text-center py-6 space-y-4">
                <CreditCard className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <div>
                  <p className="font-medium text-muted-foreground">
                    {t('transactions.noCards', 'Nenhum cartão cadastrado')}
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    {t('transactions.addFirstCard', 'Adicione seu primeiro cartão para começar')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowAddCardDialog(true)}
                >
                  <Plus className="w-4 h-4" />
                  {t('creditCards.addCard', 'Adicionar Cartão')}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {activeCards.map(card => (
                  <Button
                    key={card.id}
                    type="button"
                    variant="outline"
                    className="w-full h-auto py-3 px-4 flex items-center gap-3 justify-start hover:border-amber-500 hover:bg-amber-500/5"
                    onClick={() => handleCardSelect(card.id)}
                  >
                    <CreditCard className="w-6 h-6 text-amber-600 flex-shrink-0" />
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-medium truncate">{card.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('creditCards.bank', 'Banco')}: {card.bank}
                      </p>
                    </div>
                  </Button>
                ))}
                
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full gap-2 text-primary"
                  onClick={() => setShowAddCardDialog(true)}
                >
                  <Plus className="w-4 h-4" />
                  {t('creditCards.addCard', 'Adicionar Cartão')}
                </Button>
              </div>
            )}
            
            {/* Add Card Dialog */}
            <AddCreditCardDialog
              open={showAddCardDialog}
              onOpenChange={setShowAddCardDialog}
              onAdd={handleAddCardSuccess}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Back button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground -ml-2"
              onClick={sourceType === 'card' ? handleBackToCardSelection : handleBackToSourceSelection}
            >
              <ChevronUp className="w-4 h-4 mr-1 rotate-[-90deg]" />
              {t('common.back', 'Voltar')}
            </Button>

            {/* Account flow: show income/expense toggle */}
            {sourceType === 'account' && (
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
            )}

            {/* Credit Card flow: show selected card with bank */}
            {sourceType === 'card' && selectedCard && (
              <button
                type="button"
                className="w-full flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/15 transition-colors text-left"
                onClick={handleBackToCardSelection}
              >
                <CreditCard className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 truncate">
                    {selectedCard.name}
                  </p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-500/70">
                    {selectedCard.bank}
                  </p>
                </div>
                <span className="text-xs text-amber-600/70 dark:text-amber-500/70">
                  {t('transactions.changeCard', 'Alterar')}
                </span>
              </button>
            )}

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-1">
              {t('transactions.description')}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              ref={descriptionInputRef}
              id="description"
              placeholder={t('transactions.description')}
              value={description}
              onChange={(e) => setDescription(e.target.value.toUpperCase())}
              style={{ textTransform: 'uppercase' }}
              onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
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

            {/* Premium Features: OCR button for all expenses, Breakdown only for card */}
            {type === 'EXPENSE' && (
              <div className="flex gap-2 pt-1">
                {/* OCR Button - available for all expense types */}
                {isPremium ? (
                  <ReceiptOCRButton 
                    onResult={handleOCRResult}
                    className="flex-1"
                  />
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOCRClick}
                    className="flex-1 gap-2 relative"
                  >
                    <Scan className="w-4 h-4" />
                    {t('ocr.scanReceipt', 'Ler nota fiscal')}
                    <Crown className="w-3 h-3 text-amber-500 absolute -top-1 -right-1" />
                  </Button>
                )}

                {/* Breakdown Toggle - only for credit card expenses */}
                {sourceType === 'card' && (
                  <Button
                    type="button"
                    variant={showBreakdown ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleBreakdownToggle}
                    className={cn(
                      "flex-1 gap-2 relative",
                      showBreakdown && "bg-primary"
                    )}
                  >
                    <List className="w-4 h-4" />
                    {t('breakdown.toggle', 'Detalhar')}
                    {!isPremium && (
                      <Crown className="w-3 h-3 text-amber-500 absolute -top-1 -right-1" />
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Item Breakdown Editor (Premium only, card expenses only) */}
            {showBreakdown && isPremium && sourceType === 'card' && (
              <ItemBreakdownEditor
                items={breakdownItems}
                onItemsChange={setBreakdownItems}
                totalAmount={parseFloat(amount) || 0}
                currency={selectedCurrency}
              />
            )}
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
                  defaultMonth={date}
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
        )}

        <QuickAddCategoryDialog
          open={quickAddOpen}
          onOpenChange={setQuickAddOpen}
          onAdd={handleQuickAddCategory}
          type={type}
        />

        {/* Premium Upsell Modal */}
        <PremiumUpsellModal
          open={showUpsellModal}
          onOpenChange={setShowUpsellModal}
          feature={upsellFeature}
        />
      </DialogContent>
    </Dialog>
  );
};
