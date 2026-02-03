import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTransactions } from '@/hooks/useTransactions';
import { getMonthStartString } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export const PeriodResultWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { transactions } = useTransactions();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const previousMonthStart = startOfMonth(subMonths(now, 1));
    const previousMonthEnd = endOfMonth(subMonths(now, 1));

    const currentStartStr = format(currentMonthStart, 'yyyy-MM-dd');
    const currentEndStr = format(currentMonthEnd, 'yyyy-MM-dd');
    const prevStartStr = format(previousMonthStart, 'yyyy-MM-dd');
    const prevEndStr = format(previousMonthEnd, 'yyyy-MM-dd');

    // Current period
    const currentIncome = transactions
      .filter(t => t.type === 'INCOME' && t.date >= currentStartStr && t.date <= currentEndStr)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const currentExpenses = transactions
      .filter(t => t.type === 'EXPENSE' && t.date >= currentStartStr && t.date <= currentEndStr)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const currentNet = currentIncome - currentExpenses;

    // Previous period
    const prevIncome = transactions
      .filter(t => t.type === 'INCOME' && t.date >= prevStartStr && t.date <= prevEndStr)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const prevExpenses = transactions
      .filter(t => t.type === 'EXPENSE' && t.date >= prevStartStr && t.date <= prevEndStr)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate variations
    const incomeVariation = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;
    const expenseVariation = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : 0;

    return {
      income: currentIncome,
      expenses: currentExpenses,
      net: currentNet,
      incomeVariation,
      expenseVariation,
    };
  }, [transactions]);

  const renderVariation = (value: number, invertColor = false) => {
    if (Math.abs(value) < 0.1) {
      return (
        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
          <Minus className="w-3 h-3" />
          0%
        </span>
      );
    }
    
    const isPositive = value > 0;
    // For expenses, positive variation is bad (red), for income it's good (green)
    const isGood = invertColor ? !isPositive : isPositive;
    
    return (
      <span className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        isGood ? "text-success" : "text-destructive"
      )}>
        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('dashboard.periodResult', 'Resultado do Período')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4">
          {/* Income */}
          <div 
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/dashboard?tab=transactions&type=income')}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">
                {t('dashboard.income', 'Entradas')}
              </span>
            </div>
            <p className="text-lg font-bold text-success tabular-nums">
              {formatCurrency(stats.income)}
            </p>
            <div className="mt-1">
              {renderVariation(stats.incomeVariation)}
            </div>
          </div>

          {/* Expenses */}
          <div 
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/dashboard?tab=transactions&type=expense')}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">
                {t('dashboard.expenses', 'Saídas')}
              </span>
            </div>
            <p className="text-lg font-bold text-destructive tabular-nums">
              {formatCurrency(stats.expenses)}
            </p>
            <div className="mt-1">
              {renderVariation(stats.expenseVariation, true)}
            </div>
          </div>

          {/* Net Result */}
          <div 
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/cash-flow')}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-muted-foreground">
                {t('dashboard.netResult', 'Resultado')}
              </span>
            </div>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              stats.net >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(stats.net)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.net >= 0 
                ? t('dashboard.surplus', 'Superávit')
                : t('dashboard.deficit', 'Déficit')
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
