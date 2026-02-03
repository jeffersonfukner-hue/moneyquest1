import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, TrendingDown, CreditCard, Calendar, X } from 'lucide-react';
import { useWallets } from '@/hooks/useWallets';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useLoans } from '@/hooks/useLoans';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';
import { addDays, format, differenceInDays } from 'date-fns';
import { getMonthStartString } from '@/lib/dateUtils';

interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'info';
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: () => void;
}

export const FinancialAlertsWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { activeWallets } = useWallets();
  const { activeCards } = useCreditCards();
  const { activeLoans } = useLoans();
  const { transactions } = useTransactions();

  const alerts = useMemo((): Alert[] => {
    const result: Alert[] = [];
    const today = new Date();

    // 1. Check for negative balance (cash risk)
    const totalBalance = activeWallets.reduce((sum, w) => sum + w.current_balance, 0);
    if (totalBalance < 0) {
      result.push({
        id: 'negative-balance',
        type: 'danger',
        icon: <AlertTriangle className="w-4 h-4" />,
        title: t('alerts.negativeBalance', 'Saldo Negativo'),
        description: t('alerts.negativeBalanceDesc', 'Seu saldo total está negativo. Revise suas finanças.'),
        action: () => navigate('/wallets'),
      });
    }

    // 2. Check credit cards near limit (< 20% available)
    activeCards.forEach(card => {
      const usedPercentage = ((card.total_limit - card.available_limit) / card.total_limit) * 100;
      if (usedPercentage >= 80) {
        result.push({
          id: `card-limit-${card.id}`,
          type: 'warning',
          icon: <CreditCard className="w-4 h-4" />,
          title: t('alerts.cardNearLimit', 'Cartão Perto do Limite'),
          description: `${card.name}: ${usedPercentage.toFixed(0)}% utilizado`,
          action: () => navigate('/wallets?tab=cards'),
        });
      }
    });

    // 3. Check for upcoming loan installments (next 7 days)
    activeLoans.forEach(loan => {
      const firstDue = new Date(loan.primeiro_vencimento + 'T00:00:00');
      // Calculate next installment date
      const paidInstallments = loan.parcelas_pagas;
      const nextDueDate = addDays(firstDue, paidInstallments * 30); // Simplified
      const daysUntilDue = differenceInDays(nextDueDate, today);

      if (daysUntilDue >= 0 && daysUntilDue <= 7) {
        result.push({
          id: `loan-due-${loan.id}`,
          type: 'info',
          icon: <Calendar className="w-4 h-4" />,
          title: t('alerts.upcomingInstallment', 'Parcela Próxima'),
          description: `${loan.instituicao_pessoa}: ${formatCurrency(loan.valor_parcela)} em ${daysUntilDue === 0 ? 'hoje' : `${daysUntilDue} dias`}`,
          action: () => navigate('/wallets?tab=loans'),
        });
      }
    });

    // 4. Check for unusual spending (current month > 50% higher than previous month average)
    const monthStart = getMonthStartString();
    const currentMonthExpenses = transactions
      .filter(t => t.type === 'EXPENSE' && t.date >= monthStart)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Get average of last 3 months (simplified calculation)
    const threeMonthsAgo = format(addDays(today, -90), 'yyyy-MM-dd');
    const historicalExpenses = transactions
      .filter(t => t.type === 'EXPENSE' && t.date >= threeMonthsAgo && t.date < monthStart);
    
    const avgMonthlyExpense = historicalExpenses.length > 0
      ? historicalExpenses.reduce((sum, t) => sum + Number(t.amount), 0) / 3
      : 0;

    if (avgMonthlyExpense > 0 && currentMonthExpenses > avgMonthlyExpense * 1.5) {
      result.push({
        id: 'high-spending',
        type: 'warning',
        icon: <TrendingDown className="w-4 h-4" />,
        title: t('alerts.unusualSpending', 'Gastos Acima da Média'),
        description: t('alerts.unusualSpendingDesc', 'Seus gastos este mês estão 50% acima da média.'),
        action: () => navigate('/cash-flow'),
      });
    }

    return result.slice(0, 3); // Limit to 3 alerts
  }, [activeWallets, activeCards, activeLoans, transactions, navigate, formatCurrency, t]);

  if (alerts.length === 0) {
    return null;
  }

  const typeStyles = {
    danger: 'bg-destructive/10 border-destructive/30 text-destructive',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    info: 'bg-primary/10 border-primary/30 text-primary',
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Card
          key={alert.id}
          className={cn(
            "cursor-pointer transition-all hover:shadow-sm",
            typeStyles[alert.type]
          )}
          onClick={alert.action}
        >
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{alert.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-xs opacity-80 truncate">{alert.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
