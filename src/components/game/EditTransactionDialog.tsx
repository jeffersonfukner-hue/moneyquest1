import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format, isFuture, isToday } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Pencil, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Transaction, SupportedCurrency, TransactionType } from '@/types/database';
import { useCategories } from '@/hooks/useCategories';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { parseDateString, formatDateForDB } from '@/lib/dateUtils';
import { QuickAddCategoryDialog } from '@/components/categories/QuickAddCategoryDialog';
import { getCategoryTranslationKey } from '@/lib/gameLogic';
import { WalletSelector } from '@/components/wallets/WalletSelector';
import { useWallets } from '@/hooks/useWallets';

interface EditTransactionDialogProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'xp_earned' | 'created_at'>>) => Promise<{ error: Error | null }>;
}

const ValidationMessage = ({ message }: { message: string }) => (
  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
    {message}
  </p>
);

export const EditTransactionDialog = ({
  transaction,
  open,
  onOpenChange,
  onUpdate
}: EditTransactionDialogProps) => {
  const { t } = useTranslation();
  const { dateLocale } = useLanguage();
  const { currency: userCurrency } = useCurrency();
  const { activeWallets, refetch: refetchWallets } = useWallets();
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [category, setCategory] = useState(transaction.category);
  const [currency, setCurrency] = useState<SupportedCurrency>(transaction.currency || 'BRL');
  const [walletId, setWalletId] = useState<string | null>(transaction.wallet_id);
  const [date, setDate] = useState<Date>(parseDateString(transaction.date));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);

  const { categories } = useCategories();

  // Reset form when transaction changes
  useEffect(() => {
    setType(transaction.type);
    setDescription(transaction.description);
    setAmount(transaction.amount.toString());
    setCategory(transaction.category);
    setCurrency(transaction.currency || 'BRL');
    setWalletId(transaction.wallet_id);
    setDate(parseDateString(transaction.date));
    setAttemptedSubmit(false);
  }, [transaction]);

  // Reset category when type changes (if current category doesn't match new type)
  useEffect(() => {
    const typeCategories = categories.filter(c => c.type === type);
    const categoryExists = typeCategories.some(c => c.name === category);
    if (!categoryExists && typeCategories.length > 0) {
      setCategory('');
    }
  }, [type, categories, category]);

  const filteredCategories = categories.filter(c => c.type === type);

  const isDescriptionValid = description.trim().length > 0;
  const isAmountValid = parseFloat(amount) > 0;
  const isCategoryValid = category.length > 0;
  const isWalletValid = !!walletId;

  const handleSubmit = async () => {
    setAttemptedSubmit(true);

    if (!isDescriptionValid || !isAmountValid || !isCategoryValid || !isWalletValid) {
      return;
    }

    setIsSubmitting(true);

    const updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'xp_earned' | 'created_at'>> = {
      type,
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      currency,
      wallet_id: walletId,
      date: formatDateForDB(date),
    };

    const { error } = await onUpdate(transaction.id, updates);

    setIsSubmitting(false);

    if (!error) {
      onOpenChange(false);
    }
  };

  const disabledDays = (day: Date) => {
    return isFuture(day) && !isToday(day);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              {t('transactions.editTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Type Toggle */}
            <div className="space-y-2">
              <Label>{t('transactions.type')}</Label>
              <ToggleGroup
                type="single"
                value={type}
                onValueChange={(v) => v && setType(v as TransactionType)}
                className="grid grid-cols-2 gap-2"
              >
                <ToggleGroupItem
                  value="EXPENSE"
                  className={cn(
                    "flex-1 py-3 rounded-xl border-2 transition-all",
                    type === 'EXPENSE'
                      ? "border-expense bg-expense/10 text-expense"
                      : "border-border"
                  )}
                >
                  {t('transactions.expense')}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="INCOME"
                  className={cn(
                    "flex-1 py-3 rounded-xl border-2 transition-all",
                    type === 'INCOME'
                      ? "border-income bg-income/10 text-income"
                      : "border-border"
                  )}
                >
                  {t('transactions.income')}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('transactions.description')}</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('transactions.description')}
                className={cn(
                  attemptedSubmit && !isDescriptionValid && "border-destructive ring-1 ring-destructive"
                )}
              />
              {attemptedSubmit && !isDescriptionValid && (
                <ValidationMessage message={t('validation.descriptionRequired')} />
              )}
            </div>

            {/* Amount and Currency */}
            <div className="space-y-2">
              <Label htmlFor="amount">{t('transactions.amount')}</Label>
              <div className="flex gap-2">
                <Select value={currency} onValueChange={(v) => setCurrency(v as SupportedCurrency)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">R$</SelectItem>
                    <SelectItem value="USD">$</SelectItem>
                    <SelectItem value="EUR">€</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={cn(
                    "flex-1",
                    attemptedSubmit && !isAmountValid && "border-destructive ring-1 ring-destructive"
                  )}
                />
              </div>
              {attemptedSubmit && !isAmountValid && (
                <ValidationMessage message={t('validation.amountRequired')} />
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>{t('transactions.category')}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className={cn(
                  attemptedSubmit && !isCategoryValid && "border-destructive ring-1 ring-destructive"
                )}>
                  <SelectValue placeholder={t('transactions.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => {
                    const translationKey = getCategoryTranslationKey(cat.name, type);
                    const displayName = translationKey 
                      ? t(`transactions.categories.${translationKey}`) 
                      : cat.name;
                    return (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.icon} {displayName}
                      </SelectItem>
                    );
                  })}
                  <SelectItem value="__new__" className="text-primary">
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      {t('categories.addCategory')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {category === '__new__' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => {
                    setCategory('');
                    setShowQuickAddCategory(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('categories.addCategory')}
                </Button>
              )}
              {attemptedSubmit && !isCategoryValid && (
                <ValidationMessage message={t('validation.categoryRequired')} />
              )}
            </div>

            {/* Wallet */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                {t('wallets.wallet')}
                <span className="text-destructive">*</span>
              </Label>
              <WalletSelector
                wallets={activeWallets}
                selectedWalletId={walletId}
                onSelect={setWalletId}
                onWalletCreated={(wallet) => {
                  refetchWallets();
                  setWalletId(wallet.id);
                }}
                required
              />
              {attemptedSubmit && !isWalletValid && (
                <ValidationMessage message={t('validation.walletRequired')} />
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>{t('transactions.date')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "PPP", { locale: dateLocale })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    disabled={disabledDays}
                    locale={dateLocale}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? t('common.saving') : t('transactions.saveChanges')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showQuickAddCategory && (
        <QuickAddCategoryDialog
          open={showQuickAddCategory}
          onOpenChange={setShowQuickAddCategory}
          type={type}
          onAdd={async (name, icon, color) => {
            setCategory(name);
          }}
        />
      )}
    </>
  );
};
