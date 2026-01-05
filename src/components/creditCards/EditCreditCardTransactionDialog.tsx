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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Pencil, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SupportedCurrency, Transaction } from '@/types/database';
import { useCategories } from '@/hooks/useCategories';
import { useLanguage } from '@/contexts/LanguageContext';
import { parseDateString, formatDateForDB } from '@/lib/dateUtils';
import { QuickAddCategoryDialog } from '@/components/categories/QuickAddCategoryDialog';
import { getCategoryTranslationKey } from '@/lib/gameLogic';
import { InvoiceTransaction } from '@/hooks/useCreditCardInvoices';
import { CreditCard } from '@/hooks/useCreditCards';

interface EditCreditCardTransactionDialogProps {
  transaction: InvoiceTransaction;
  card: CreditCard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => Promise<{ error: Error | null }>;
}

const ValidationMessage = ({ message }: { message: string }) => (
  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
    {message}
  </p>
);

export const EditCreditCardTransactionDialog = ({
  transaction,
  card,
  open,
  onOpenChange,
  onUpdate
}: EditCreditCardTransactionDialogProps) => {
  const { t } = useTranslation();
  const { dateLocale } = useLanguage();
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [category, setCategory] = useState(transaction.category);
  const [currency, setCurrency] = useState<SupportedCurrency>(transaction.currency as SupportedCurrency || 'BRL');
  const [date, setDate] = useState<Date>(parseDateString(transaction.date));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);

  const { categories } = useCategories();

  // Reset form when transaction changes
  useEffect(() => {
    setDescription(transaction.description.toUpperCase());
    setAmount(transaction.amount.toString());
    setCategory(transaction.category);
    setCurrency(transaction.currency as SupportedCurrency || 'BRL');
    setDate(parseDateString(transaction.date));
    setAttemptedSubmit(false);
  }, [transaction]);

  // Filter categories for EXPENSE type only (credit card transactions are always expenses)
  const filteredCategories = categories.filter(c => c.type === 'EXPENSE');

  const isDescriptionValid = description.trim().length > 0;
  const isAmountValid = parseFloat(amount) > 0;
  const isCategoryValid = category.length > 0 && category !== '__new__';

  const handleSubmit = async () => {
    setAttemptedSubmit(true);

    if (!isDescriptionValid || !isAmountValid || !isCategoryValid) {
      return;
    }

    setIsSubmitting(true);

    const updates: Partial<Transaction> = {
      description: description.trim().toUpperCase(),
      amount: parseFloat(amount),
      category,
      currency,
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
              {t('transactions.editTitle', 'Editar Transação')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('transactions.description', 'Descrição')}</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value.toUpperCase())}
                placeholder={t('transactions.description', 'Descrição')}
                style={{ textTransform: 'uppercase' }}
                className={cn(
                  attemptedSubmit && !isDescriptionValid && "border-destructive ring-1 ring-destructive"
                )}
              />
              {attemptedSubmit && !isDescriptionValid && (
                <ValidationMessage message={t('validation.descriptionRequired', 'Descrição é obrigatória')} />
              )}
            </div>

            {/* Amount and Currency */}
            <div className="space-y-2">
              <Label htmlFor="amount">{t('transactions.amount', 'Valor')}</Label>
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
                <ValidationMessage message={t('validation.amountRequired', 'Valor é obrigatório')} />
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>{t('transactions.category', 'Categoria')}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className={cn(
                  attemptedSubmit && !isCategoryValid && "border-destructive ring-1 ring-destructive"
                )}>
                  <SelectValue placeholder={t('transactions.selectCategory', 'Selecione a categoria')} />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => {
                    const translationKey = getCategoryTranslationKey(cat.name, 'EXPENSE');
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
                      {t('categories.addCategory', 'Adicionar Categoria')}
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
                  {t('categories.addCategory', 'Adicionar Categoria')}
                </Button>
              )}
              {attemptedSubmit && !isCategoryValid && (
                <ValidationMessage message={t('validation.categoryRequired', 'Categoria é obrigatória')} />
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>{t('transactions.date', 'Data')}</Label>
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
                    defaultMonth={date}
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
              {isSubmitting ? t('common.saving', 'Salvando...') : t('transactions.saveChanges', 'Salvar Alterações')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showQuickAddCategory && (
        <QuickAddCategoryDialog
          open={showQuickAddCategory}
          onOpenChange={setShowQuickAddCategory}
          type="EXPENSE"
          onAdd={async (name, icon, color) => {
            setCategory(name);
          }}
        />
      )}
    </>
  );
};
