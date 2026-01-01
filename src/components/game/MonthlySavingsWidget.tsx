import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction, SupportedCurrency } from '@/types/database';
import { useCurrency } from '@/contexts/CurrencyContext';
import { parseDateString } from '@/lib/dateUtils';

interface MonthlySavingsWidgetProps {
  transactions: Transaction[];
}

export const MonthlySavingsWidget = ({ transactions }: MonthlySavingsWidgetProps) => {
  const { t } = useTranslation();
  const { formatCurrency, convertToUserCurrency } = useCurrency();

  // Filter transactions from current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactions.filter((tx) => {
    const txDate = parseDateString(tx.date);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter((tx) => tx.type === 'INCOME')
    .reduce((sum, tx) => sum + convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency), 0);

  const monthlyExpenses = monthlyTransactions
    .filter((tx) => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency), 0);

  const savings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;
  
  // Target: Save at least 20% of income
  const targetRate = 20;
  const progressValue = Math.min(Math.max(savingsRate, 0), 100);
  const isPositive = savings >= 0;

  if (monthlyTransactions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Wallet className="w-4 h-4" />
          {t('dashboard.monthlySavings')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
            <span className={`text-xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{formatCurrency(savings)}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {savingsRate.toFixed(0)}%
          </span>
        </div>

        <div className="space-y-1">
          <Progress 
            value={progressValue} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('dashboard.saved')}</span>
            <span>{t('dashboard.target')}: {targetRate}%</span>
          </div>
        </div>

        <div className="flex justify-between text-xs pt-1 border-t border-border/30">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">{t('transactions.income')}:</span>
            <span className="text-foreground font-medium">{formatCurrency(monthlyIncome)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">{t('transactions.expense')}:</span>
            <span className="text-foreground font-medium">{formatCurrency(monthlyExpenses)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
