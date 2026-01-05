import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Calendar, Loader2 } from 'lucide-react';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loan } from '@/hooks/useLoans';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Format currency with specific currency code
const formatLoanCurrency = (amount: number, currencyCode: string): string => {
  const localeMap: Record<string, string> = {
    BRL: 'pt-BR',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
  };
  return new Intl.NumberFormat(localeMap[currencyCode] || 'pt-BR', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

interface LoanInstallmentsPanelProps {
  loan: Loan;
  onPayInstallment: (loanId: string, installmentNumber: number) => Promise<boolean>;
  onClose: () => void;
}

interface Installment {
  number: number;
  date: string;
  amount: number;
  isPaid: boolean;
  transactionId?: string;
}

export function LoanInstallmentsPanel({ loan, onPayInstallment, onClose }: LoanInstallmentsPanelProps) {
  const { user } = useAuth();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingIndex, setPayingIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchInstallments = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('transactions')
        .select('id, date, amount, transaction_subtype')
        .eq('user_id', user.id)
        .like('transaction_subtype', `loan:${loan.id}:%`)
        .order('date', { ascending: true });

      if (data) {
        const mapped = data.map((tx) => {
          const parts = tx.transaction_subtype?.split(':') || [];
          const num = parseInt(parts[2] || '1', 10);
          return {
            number: num,
            date: tx.date,
            amount: tx.amount,
            isPaid: num <= loan.parcelas_pagas,
            transactionId: tx.id,
          };
        });
        setInstallments(mapped);
      }
      setLoading(false);
    };

    fetchInstallments();
  }, [loan, user]);

  const handlePay = async (installment: Installment) => {
    if (installment.isPaid) return;
    
    // Only allow paying the next unpaid installment
    const nextUnpaid = loan.parcelas_pagas + 1;
    if (installment.number !== nextUnpaid) return;

    setPayingIndex(installment.number);
    const success = await onPayInstallment(loan.id, installment.number);
    if (success) {
      setInstallments(prev =>
        prev.map(i => i.number === installment.number ? { ...i, isPaid: true } : i)
      );
    }
    setPayingIndex(null);
  };

  const getStatusBadge = (installment: Installment) => {
    if (installment.isPaid) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Paga</Badge>;
    }
    const dueDate = parseISO(installment.date);
    if (isPast(dueDate) && !isToday(dueDate)) {
      return <Badge variant="destructive">Atrasada</Badge>;
    }
    if (isToday(dueDate)) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Vence hoje</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  const progress = (loan.parcelas_pagas / loan.quantidade_parcelas) * 100;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Parcelas - {loan.instituicao_pessoa}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>{loan.parcelas_pagas} de {loan.quantidade_parcelas} pagas</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : installments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhuma parcela encontrada.
          </p>
        ) : (
          installments.map((installment) => {
            const canPay = !installment.isPaid && installment.number === loan.parcelas_pagas + 1;
            const isOverdue = !installment.isPaid && isPast(parseISO(installment.date)) && !isToday(parseISO(installment.date));
            
            return (
              <div
                key={installment.number}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  installment.isPaid 
                    ? 'bg-green-500/5 border-green-500/20' 
                    : isOverdue
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-card border-border hover:bg-accent/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {installment.isPaid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      Parcela {installment.number}/{loan.quantidade_parcelas}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(installment.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold">{formatLoanCurrency(installment.amount, loan.currency)}</p>
                    {getStatusBadge(installment)}
                  </div>
                  
                  {canPay && (
                    <Button
                      size="sm"
                      onClick={() => handlePay(installment)}
                      disabled={payingIndex !== null}
                      className="ml-2"
                    >
                      {payingIndex === installment.number ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Pagar'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}