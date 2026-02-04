import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isFuture, isToday } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pencil, Plus, CreditCard, Lock, Trash2, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Transaction, SupportedCurrency, TransactionType } from '@/types/database';
import { useCategories } from '@/hooks/useCategories';
import { useSuppliers } from '@/hooks/useSuppliers';

import { useCurrency } from '@/contexts/CurrencyContext';
import { parseDateString, formatDateForDB } from '@/lib/dateUtils';
import { QuickAddCategoryDialog } from '@/components/categories/QuickAddCategoryDialog';
import { getCategoryTranslationKey } from '@/lib/gameLogic';
import { WalletSelector } from '@/components/wallets/WalletSelector';
import { useWallets } from '@/hooks/useWallets';
import { SupplierAutocomplete } from '@/components/suppliers/SupplierAutocomplete';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useClosedMonthProtection } from '@/hooks/useClosedMonthProtection';

interface EditTransactionDialogProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'xp_earned' | 'created_at'>>) => Promise<{ error: Error | null }>;
  onDelete?: (id: string) => Promise<{ error: Error | null }>;
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
  onUpdate,
  onDelete
}: EditTransactionDialogProps) => {
  const { t } = useTranslation();
  const { currency: userCurrency } = useCurrency();
  const { activeWallets, refetch: refetchWallets } = useWallets();
  const { creditCards } = useCreditCards();
  const { upsertSupplier } = useSuppliers();
  const { isDateInClosedMonth } = useClosedMonthProtection();
  
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [supplier, setSupplier] = useState((transaction as any).supplier || '');
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [category, setCategory] = useState(transaction.category);
  const [currency, setCurrency] = useState<SupportedCurrency>(transaction.currency || 'BRL');
  const [walletId, setWalletId] = useState<string | null>(transaction.wallet_id);
  const [date, setDate] = useState<Date>(parseDateString(transaction.date));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { categories } = useCategories();

  // Check if this is a credit card transaction (doesn't need wallet)
  const isCardTransaction = !!transaction.credit_card_id;
  const linkedCard = isCardTransaction 
    ? creditCards.find(c => c.id === transaction.credit_card_id) 
    : null;
  
  // Check if transaction is in a closed month
  const isInClosedMonth = isDateInClosedMonth(transaction.date);

  // Get wallet name for display
  const linkedWallet = transaction.wallet_id 
    ? activeWallets.find(w => w.id === transaction.wallet_id) 
    : null;

  // Check if transaction has any links
  const hasLinks = isCardTransaction || transaction.invoice_id || transaction.wallet_id;

  // Reset form when transaction changes
  useEffect(() => {
    setType(transaction.type);
    setSupplier((transaction as any).supplier || '');
    setDescription(transaction.description.toUpperCase());
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
  const isCategoryValid = category.length > 0 && category !== '__new__';
  const isWalletValid = isCardTransaction || !!walletId;

  const handleRequestSave = () => {
    setAttemptedSubmit(true);

    if (!isDescriptionValid || !isAmountValid || !isCategoryValid || !isWalletValid) {
      return;
    }

    setShowSaveConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowSaveConfirm(false);
    setIsSubmitting(true);

    const updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'xp_earned' | 'created_at'>> & { supplier?: string | null } = {
      type,
      description: description.trim().toUpperCase(),
      amount: parseFloat(amount),
      category,
      currency,
      ...(isCardTransaction ? {} : { wallet_id: walletId }),
      date: formatDateForDB(date),
      supplier: type === 'EXPENSE' && supplier.trim() ? supplier.trim().toUpperCase() : null,
    };

    const { error } = await onUpdate(transaction.id, updates as any);

    if (!error) {
      // Save supplier to table if provided
      if (type === 'EXPENSE' && supplier.trim()) {
        await upsertSupplier(supplier, parseFloat(amount));
      }
    }

    setIsSubmitting(false);

    if (!error) {
      onOpenChange(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    
    setShowDeleteConfirm(false);
    setIsDeleting(true);

    const { error } = await onDelete(transaction.id);

    setIsDeleting(false);

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
            {/* Closed Month Warning */}
            {isInClosedMonth && (
              <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  {t('closing.editBlockedMessage', 'Transações de meses fechados não podem ser editadas.')}
                </AlertDescription>
              </Alert>
            )}

            {/* Credit Card indicator */}
            {isCardTransaction && linkedCard && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {linkedCard.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{linkedCard.bank}</p>
                </div>
              </div>
            )}

            {/* Type Toggle - hide for card transactions */}
            {!isCardTransaction && (
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
            )}

            {/* Supplier - for expenses only */}
            {type === 'EXPENSE' && (
              <SupplierAutocomplete
                value={supplier}
                onChange={setSupplier}
              />
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('transactions.description')}</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('transactions.description')}
                className={cn(
                  "uppercase",
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
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(',', '.');
                    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                      setAmount(val);
                    }
                  }}
                  placeholder="0.00"
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

            {/* Wallet - hide for card transactions */}
            {!isCardTransaction && (
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
            )}

            {/* Date */}
            <div className="space-y-2">
              <Label>{t('transactions.date')}</Label>
              <DatePickerInput
                value={date}
                onChange={(d) => d && setDate(d)}
                disabled={disabledDays}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {onDelete && (
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting || isDeleting || isInClosedMonth}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('transactions.delete', 'Excluir')}
                </Button>
              )}
              <Button
                onClick={handleRequestSave}
                disabled={isSubmitting || isDeleting || isInClosedMonth}
                className="flex-1"
              >
                {isInClosedMonth ? (
                  <><Lock className="w-4 h-4 mr-2" />{t('closing.editBlocked', 'Edição bloqueada')}</>
                ) : (
                  isSubmitting ? t('common.saving') : t('transactions.saveChanges')
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('transactions.confirmSave', 'Confirmar alterações')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('transactions.confirmSaveDesc', 'Tem certeza que deseja salvar as alterações nesta transação?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancelar')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              {t('common.yesSave', 'Sim, salvar')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('transactions.confirmDelete', 'Excluir transação')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('transactions.confirmDeleteDesc', 'Esta ação não pode ser desfeita.')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {hasLinks && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-2">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {t('transactions.hasLinks', 'Esta transação possui vínculos:')}
              </p>
              <div className="space-y-1 text-sm">
                {linkedCard && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span>{t('transactions.linkedCard', 'Cartão')}: {linkedCard.name}</span>
                  </div>
                )}
                {transaction.invoice_id && (
                  <div className="flex items-center gap-2">
                    <span className="text-base">📄</span>
                    <span>{t('transactions.linkedInvoice', 'Fatura vinculada')}</span>
                  </div>
                )}
                {linkedWallet && (
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-amber-600" />
                    <span>{t('transactions.linkedWallet', 'Carteira')}: {linkedWallet.name}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('transactions.deleteWarning', 'Ao excluir, os saldos serão recalculados.')}
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancelar')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('transactions.deleteAnyway', 'Excluir mesmo assim')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
