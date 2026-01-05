import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Wallet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/formatters';
import { CreditCard as CreditCardType } from '@/hooks/useCreditCards';
import { CreditCardInvoice } from '@/hooks/useCreditCardInvoices';
import { Wallet as WalletType } from '@/types/wallet';
import { cn } from '@/lib/utils';

interface PayInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: CreditCardInvoice | null;
  card: CreditCardType | null;
  linkedWallet: WalletType | null;
  onPay: (invoiceId: string, walletId: string) => Promise<boolean>;
  paying: boolean;
}

export const PayInvoiceDialog = ({
  open,
  onOpenChange,
  invoice,
  card,
  linkedWallet,
  onPay,
  paying,
}: PayInvoiceDialogProps) => {
  const { t } = useTranslation();

  if (!invoice || !card) return null;

  const hasLinkedWallet = !!linkedWallet;
  const hasSufficientBalance = linkedWallet 
    ? linkedWallet.current_balance >= invoice.total_amount 
    : false;
  const canPay = hasLinkedWallet && hasSufficientBalance && invoice.status === 'closed';

  const handlePay = async () => {
    if (!linkedWallet) return;
    const success = await onPay(invoice.id, linkedWallet.id);
    if (success) {
      onOpenChange(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-600" />
            {t('creditCards.payInvoice', 'Pagar Fatura')}
          </DialogTitle>
          <DialogDescription>
            {t('creditCards.payInvoiceDesc', 'Confirme o pagamento da fatura do cartão.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Card info */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-1">
            <p className="text-sm font-medium">{card.name}</p>
            <p className="text-xs text-muted-foreground">{card.bank}</p>
          </div>

          {/* Invoice details */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('creditCards.invoicePeriod', 'Período')}</span>
              <span>{formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('creditCards.dueDate', 'Vencimento')}</span>
              <span>{formatDate(invoice.due_date)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">{t('creditCards.invoiceTotal', 'Total da Fatura')}</span>
              <span className="text-lg font-bold text-amber-600">
                {formatMoney(invoice.total_amount, card.currency as any)}
              </span>
            </div>
          </div>

          {/* Payment source */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('creditCards.paymentSource', 'Conta para débito')}</p>
            
            {hasLinkedWallet ? (
              <div className={cn(
                "p-3 border rounded-lg",
                hasSufficientBalance ? "border-green-500/50 bg-green-500/5" : "border-destructive/50 bg-destructive/5"
              )}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{linkedWallet.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{linkedWallet.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('wallets.balance', 'Saldo')}: {formatMoney(linkedWallet.current_balance, linkedWallet.currency as any)}
                    </p>
                  </div>
                  {hasSufficientBalance ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  )}
                </div>
                
                {!hasSufficientBalance && (
                  <p className="text-xs text-destructive mt-2">
                    {t('creditCards.insufficientBalanceWarning', 'Saldo insuficiente para pagar esta fatura.')}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 border border-amber-500/50 bg-amber-500/5 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="text-sm">
                    {t('creditCards.noLinkedWallet', 'Nenhuma conta vinculada a este cartão. Edite o cartão para vincular uma conta.')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status warning */}
          {invoice.status === 'open' && (
            <div className="p-3 border border-amber-500/50 bg-amber-500/5 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <p className="text-sm">
                  {t('creditCards.invoiceStillOpen', 'Esta fatura ainda está aberta. Aguarde o fechamento para poder pagar.')}
                </p>
              </div>
            </div>
          )}

          {invoice.status === 'paid' && (
            <div className="p-3 border border-green-500/50 bg-green-500/5 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <p className="text-sm">
                  {t('creditCards.invoiceAlreadyPaid', 'Esta fatura já foi paga em')} {formatDate(invoice.paid_at!)}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button
            variant="gold"
            onClick={handlePay}
            disabled={!canPay || paying}
          >
            {paying ? t('common.loading', 'Carregando...') : t('creditCards.confirmPayment', 'Confirmar Pagamento')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
