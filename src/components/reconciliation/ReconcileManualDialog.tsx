import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Link2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrency } from '@/contexts/CurrencyContext';
import { BankLineWithMatch } from '@/hooks/useReconciliation';
import { cn } from '@/lib/utils';

interface ReconcileManualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankLine: BankLineWithMatch;
  walletId: string;
  onReconcile: (transactionId: string) => Promise<void>;
}

const EXCLUDED_SUBTYPES = ['transfer_out', 'transfer_in', 'card_payment', 'cash_adjustment'];

export const ReconcileManualDialog = ({
  open,
  onOpenChange,
  bankLine,
  walletId,
  onReconcile,
}: ReconcileManualDialogProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { transactions } = useTransactions();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const bankType = bankLine.amount >= 0 ? 'INCOME' : 'EXPENSE';

  // Filter transactions for the wallet, matching type, not already reconciled
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(tx => 
      tx.wallet_id === walletId &&
      tx.type === bankType &&
      !EXCLUDED_SUBTYPES.includes(tx.transaction_subtype || '')
    );

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.description.toLowerCase().includes(searchLower) ||
        tx.category.toLowerCase().includes(searchLower) ||
        (tx.supplier && tx.supplier.toLowerCase().includes(searchLower))
      );
    }

    return filtered.slice(0, 50);
  }, [transactions, walletId, bankType, search]);

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const handleReconcile = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    await onReconcile(selectedId);
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            {t('reconciliation.manualMatch', 'Vincular Manualmente')}
          </DialogTitle>
          <DialogDescription>
            Selecione uma transação existente para vincular ao lançamento do banco.
          </DialogDescription>
        </DialogHeader>

        {/* Bank line info */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Lançamento do banco:</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{bankLine.description}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(bankLine.transaction_date)}
                {bankLine.counterparty && ` • ${bankLine.counterparty}`}
              </p>
            </div>
            <p className={cn(
              "font-bold tabular-nums",
              bankLine.amount >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {bankLine.amount >= 0 ? '+' : ''}{formatCurrency(bankLine.amount)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('reconciliation.searchTransactions', 'Buscar transações...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Transaction list */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 pb-4">
            {filteredTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma transação encontrada
              </p>
            ) : (
              filteredTransactions.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => setSelectedId(tx.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    selectedId === tx.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(tx.date)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {tx.category}
                        </Badge>
                        {tx.supplier && (
                          <span className="truncate">{tx.supplier}</span>
                        )}
                      </div>
                    </div>
                    <p className={cn(
                      "font-semibold tabular-nums ml-4",
                      tx.type === 'INCOME' ? "text-green-600" : "text-red-600"
                    )}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleReconcile} 
            disabled={!selectedId || submitting}
          >
            <Link2 className="w-4 h-4 mr-2" />
            {submitting ? t('common.loading') : t('reconciliation.reconcile', 'Conciliar')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
