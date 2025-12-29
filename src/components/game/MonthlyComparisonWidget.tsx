import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { Transaction, SupportedCurrency } from '@/types/database';
import { useCurrency } from '@/contexts/CurrencyContext';
import { parseDateString } from '@/lib/dateUtils';

interface MonthlyComparisonWidgetProps {
  transactions: Transaction[];
}

export const MonthlyComparisonWidget = ({ transactions }: MonthlyComparisonWidgetProps) => {
  const { t } = useTranslation();
  const { formatCurrency, convertToUserCurrency } = useCurrency();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Previous month calculation
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Filter transactions by month with currency conversion
  const currentMonthExpenses = transactions
    .filter((tx) => {
      const txDate = parseDateString(tx.date);
      return (
        tx.type === 'EXPENSE' &&
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, tx) => sum + convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency), 0);

  const prevMonthExpenses = transactions
    .filter((tx) => {
      const txDate = parseDateString(tx.date);
      return (
        tx.type === 'EXPENSE' &&
        txDate.getMonth() === prevMonth &&
        txDate.getFullYear() === prevYear
      );
    })
    .reduce((sum, tx) => sum + convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency), 0);

  // Calculate percentage change
  const percentChange = prevMonthExpenses > 0 
    ? ((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100 
    : 0;

  const isIncrease = percentChange > 0;
  const isDecrease = percentChange < 0;
  const isStable = percentChange === 0;

  // Get month names
  const monthNames = [
    t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'),
    t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'),
    t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec')
  ];

  const currentMonthName = monthNames[currentMonth] || new Date(currentYear, currentMonth).toLocaleString('default', { month: 'short' });
  const prevMonthName = monthNames[prevMonth] || new Date(prevYear, prevMonth).toLocaleString('default', { month: 'short' });

  // Calculate bar widths for visual comparison
  const maxExpense = Math.max(currentMonthExpenses, prevMonthExpenses, 1);
  const currentBarWidth = (currentMonthExpenses / maxExpense) * 100;
  const prevBarWidth = (prevMonthExpenses / maxExpense) * 100;

  if (currentMonthExpenses === 0 && prevMonthExpenses === 0) {
    return null;
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <BarChart3 className="w-4 h-4" />
          {t('dashboard.monthlyComparison')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Change indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isIncrease && <TrendingUp className="w-5 h-5 text-red-500" />}
            {isDecrease && <TrendingDown className="w-5 h-5 text-green-500" />}
            {isStable && <Minus className="w-5 h-5 text-muted-foreground" />}
            <span className={`text-lg font-bold ${
              isIncrease ? 'text-red-500' : isDecrease ? 'text-green-500' : 'text-muted-foreground'
            }`}>
              {isIncrease ? '+' : ''}{percentChange.toFixed(0)}%
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {isIncrease ? t('dashboard.spentMore') : isDecrease ? t('dashboard.spentLess') : t('dashboard.spentSame')}
          </span>
        </div>

        {/* Bar comparison */}
        <div className="space-y-3">
          {/* Current month */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-foreground font-medium">{currentMonthName}</span>
              <span className="text-foreground">{formatCurrency(currentMonthExpenses)}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isIncrease ? 'bg-red-500' : 'bg-primary'
                }`}
                style={{ width: `${currentBarWidth}%` }}
              />
            </div>
          </div>

          {/* Previous month */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{prevMonthName}</span>
              <span className="text-muted-foreground">{formatCurrency(prevMonthExpenses)}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-muted-foreground/40 rounded-full transition-all duration-500"
                style={{ width: `${prevBarWidth}%` }}
              />
            </div>
          </div>
        </div>

        {/* Difference */}
        <div className="pt-2 border-t border-border/30 flex justify-between items-center text-xs">
          <span className="text-muted-foreground">{t('dashboard.difference')}</span>
          <span className={`font-medium ${
            isIncrease ? 'text-red-500' : isDecrease ? 'text-green-500' : 'text-muted-foreground'
          }`}>
            {isIncrease ? '+' : ''}{formatCurrency(currentMonthExpenses - prevMonthExpenses)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
