import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format, isFuture, isToday } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { ArrowRightLeft, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { SupportedCurrency } from '@/types/database';

import { parseDateString } from '@/lib/dateUtils';
import { WalletTransfer } from '@/hooks/useWalletTransfers';
import { Wallet } from '@/types/wallet';
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

interface EditTransferDialogProps {
  transfer: WalletTransfer;
  wallets: Wallet[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<WalletTransfer>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export const EditTransferDialog = ({
  transfer,
  wallets,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: EditTransferDialogProps) => {
  const { t } = useTranslation();
  
  const [fromWalletId, setFromWalletId] = useState(transfer.from_wallet_id);
  const [toWalletId, setToWalletId] = useState(transfer.to_wallet_id);
  const [amount, setAmount] = useState(transfer.amount.toString());
  const [currency, setCurrency] = useState<SupportedCurrency>(transfer.currency as SupportedCurrency);
  const [description, setDescription] = useState(transfer.description || '');
  const [date, setDate] = useState<Date>(parseDateString(transfer.date));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    setFromWalletId(transfer.from_wallet_id);
    setToWalletId(transfer.to_wallet_id);
    setAmount(transfer.amount.toString());
    setCurrency(transfer.currency as SupportedCurrency);
    setDescription(transfer.description || '');
    setDate(parseDateString(transfer.date));
  }, [transfer]);

  const isValid = fromWalletId && toWalletId && fromWalletId !== toWalletId && parseFloat(amount) > 0;

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);

    const success = await onUpdate(transfer.id, {
      from_wallet_id: fromWalletId,
      to_wallet_id: toWalletId,
      amount: parseFloat(amount),
      currency,
      description: description.trim() || null,
      date: format(date, 'yyyy-MM-dd'),
    });

    setIsSubmitting(false);

    if (success) {
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    const success = await onDelete(transfer.id);
    setIsSubmitting(false);
    
    if (success) {
      setShowDeleteDialog(false);
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
              <ArrowRightLeft className="w-5 h-5" />
              {t('wallets.editTransfer', 'Editar Transferência')}
            </DialogTitle>
            <DialogDescription>
              {t('wallets.editTransferDesc', 'Altere os dados da transferência')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* From Wallet */}
            <div className="space-y-2">
              <Label>{t('wallets.fromWallet', 'Carteira de Origem')}</Label>
              <Select value={fromWalletId} onValueChange={setFromWalletId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('wallets.selectWallet', 'Selecione')} />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.icon} {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* To Wallet */}
            <div className="space-y-2">
              <Label>{t('wallets.toWallet', 'Carteira de Destino')}</Label>
              <Select value={toWalletId} onValueChange={setToWalletId}>
                <SelectTrigger className={cn(
                  fromWalletId === toWalletId && fromWalletId && "border-destructive"
                )}>
                  <SelectValue placeholder={t('wallets.selectWallet', 'Selecione')} />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.icon} {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fromWalletId === toWalletId && fromWalletId && (
                <p className="text-xs text-destructive">{t('wallets.sameWalletError', 'Selecione carteiras diferentes')}</p>
              )}
            </div>

            {/* Amount and Currency */}
            <div className="space-y-2">
              <Label>{t('transactions.amount', 'Valor')}</Label>
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
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>{t('transactions.description', 'Descrição')} ({t('common.optional', 'opcional')})</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('wallets.transferDescription', 'Ex: Reserva de emergência')}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>{t('transactions.date', 'Data')}</Label>
              <DatePickerInput
                value={date}
                onChange={(d) => d && setDate(d)}
                disabled={disabledDays}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {t('common.delete', 'Excluir')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? t('common.saving', 'Salvando...') : t('common.save', 'Salvar')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('wallets.deleteTransfer', 'Excluir transferência?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('wallets.deleteTransferDesc', 'Os saldos das carteiras serão revertidos. Esta ação não pode ser desfeita.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancelar')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('common.delete', 'Excluir')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
