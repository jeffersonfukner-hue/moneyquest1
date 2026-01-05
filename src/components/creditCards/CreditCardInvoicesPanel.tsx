import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Receipt, 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  CreditCard as CreditCardIcon,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatMoney } from '@/lib/formatters';
import { CreditCard } from '@/hooks/useCreditCards';
import { useCreditCardInvoices, CreditCardInvoice, InvoiceTransaction } from '@/hooks/useCreditCardInvoices';
import { PayInvoiceDialog } from './PayInvoiceDialog';
import { Wallet } from '@/types/wallet';
import { cn } from '@/lib/utils';

interface CreditCardInvoicesPanelProps {
  card: CreditCard;
  wallets: Wallet[];
  onBack: () => void;
}

const InvoiceStatusBadge = ({ status }: { status: CreditCardInvoice['status'] }) => {
  const { t } = useTranslation();
  
  const config = {
    open: {
      label: t('creditCards.invoiceOpen', 'Aberta'),
      variant: 'outline' as const,
      icon: Clock,
      className: 'border-blue-500 text-blue-600 dark:text-blue-400',
    },
    closed: {
      label: t('creditCards.invoiceClosed', 'Fechada'),
      variant: 'outline' as const,
      icon: AlertCircle,
      className: 'border-amber-500 text-amber-600 dark:text-amber-400',
    },
    paid: {
      label: t('creditCards.invoicePaidStatus', 'Paga'),
      variant: 'outline' as const,
      icon: CheckCircle2,
      className: 'border-green-500 text-green-600 dark:text-green-400',
    },
  };

  const { label, variant, icon: Icon, className } = config[status];

  return (
    <Badge variant={variant} className={cn("gap-1", className)}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
};

interface InvoiceCardProps {
  invoice: CreditCardInvoice;
  card: CreditCard;
  linkedWallet: Wallet | null;
  onPayClick: (invoice: CreditCardInvoice) => void;
  fetchTransactions: (invoiceId: string) => Promise<InvoiceTransaction[]>;
}

const InvoiceCard = ({ invoice, card, linkedWallet, onPayClick, fetchTransactions }: InvoiceCardProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [transactions, setTransactions] = useState<InvoiceTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const handleToggle = async () => {
    const newOpen = !isOpen;
    setIsOpen(newOpen);
    
    if (newOpen && transactions.length === 0) {
      setLoadingTransactions(true);
      const txns = await fetchTransactions(invoice.id);
      setTransactions(txns);
      setLoadingTransactions(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatPeriod = () => {
    const start = new Date(invoice.period_start);
    const end = new Date(invoice.period_end);
    const startMonth = start.toLocaleDateString('pt-BR', { month: 'short' });
    const endMonth = end.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth}`;
  };

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={handleToggle}>
        <CollapsibleTrigger className="w-full">
          <div className="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Receipt className="w-5 h-5 text-amber-600" />
            </div>
            
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">{formatPeriod()}</p>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t('creditCards.dueDate', 'Vencimento')}: {formatDate(invoice.due_date)}
              </p>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-amber-600">
                {formatMoney(invoice.total_amount, card.currency as any)}
              </p>
            </div>
            
            {isOpen ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3 border-t bg-muted/30">
            {/* Transactions list */}
            <div className="pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {t('creditCards.invoiceTransactions', 'Transações')}
              </p>
              
              {loadingTransactions ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t('creditCards.noTransactions', 'Nenhuma transação nesta fatura')}
                </p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {transactions.map(txn => (
                    <div 
                      key={txn.id} 
                      className="flex items-center justify-between py-2 px-3 bg-background rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{txn.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(txn.date)} • {txn.category}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-destructive ml-2">
                        -{formatMoney(txn.amount, txn.currency as any)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Pay button - only for closed invoices */}
            {invoice.status === 'closed' && (
              <Button
                variant="gold"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onPayClick(invoice);
                }}
              >
                {t('creditCards.payInvoice', 'Pagar Fatura')}
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export const CreditCardInvoicesPanel = ({ card, wallets, onBack }: CreditCardInvoicesPanelProps) => {
  const { t } = useTranslation();
  const { 
    invoices, 
    loading, 
    payingInvoice, 
    fetchInvoiceTransactions, 
    payInvoice,
    refetch 
  } = useCreditCardInvoices(card.id);
  
  const [selectedInvoice, setSelectedInvoice] = useState<CreditCardInvoice | null>(null);
  const [showPayDialog, setShowPayDialog] = useState(false);

  const linkedWallet = wallets.find(w => w.id === card.linked_wallet_id) || null;

  const handlePayClick = (invoice: CreditCardInvoice) => {
    setSelectedInvoice(invoice);
    setShowPayDialog(true);
  };

  const handlePay = async (invoiceId: string, walletId: string) => {
    const success = await payInvoice(invoiceId, walletId);
    if (success) {
      refetch();
    }
    return success;
  };

  // Group invoices by status
  const openInvoices = invoices.filter(inv => inv.status === 'open');
  const closedInvoices = invoices.filter(inv => inv.status === 'closed');
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <CreditCardIcon className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-semibold">{card.name}</h2>
            <p className="text-xs text-muted-foreground">{card.bank}</p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Receipt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {t('creditCards.noInvoices', 'Nenhuma fatura encontrada')}
            </p>
            <p className="text-sm text-muted-foreground/70">
              {t('creditCards.noInvoicesDesc', 'As faturas aparecerão aqui quando você fizer compras no cartão.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-4 pr-4">
            {/* Open invoices */}
            {openInvoices.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t('creditCards.openInvoices', 'Fatura Aberta')}
                </h3>
                {openInvoices.map(invoice => (
                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    card={card}
                    linkedWallet={linkedWallet}
                    onPayClick={handlePayClick}
                    fetchTransactions={fetchInvoiceTransactions}
                  />
                ))}
              </div>
            )}

            {/* Closed invoices (pending payment) */}
            {closedInvoices.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-amber-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {t('creditCards.pendingPayment', 'Aguardando Pagamento')}
                </h3>
                {closedInvoices.map(invoice => (
                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    card={card}
                    linkedWallet={linkedWallet}
                    onPayClick={handlePayClick}
                    fetchTransactions={fetchInvoiceTransactions}
                  />
                ))}
              </div>
            )}

            {/* Paid invoices */}
            {paidInvoices.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('creditCards.paidInvoices', 'Faturas Pagas')}
                </h3>
                {paidInvoices.map(invoice => (
                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    card={card}
                    linkedWallet={linkedWallet}
                    onPayClick={handlePayClick}
                    fetchTransactions={fetchInvoiceTransactions}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Pay Invoice Dialog */}
      <PayInvoiceDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        invoice={selectedInvoice}
        card={card}
        linkedWallet={linkedWallet}
        onPay={handlePay}
        paying={payingInvoice}
      />
    </div>
  );
};
