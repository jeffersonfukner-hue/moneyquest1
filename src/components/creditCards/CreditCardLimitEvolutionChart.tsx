import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CreditCard } from '@/hooks/useCreditCards';
import { formatMoney } from '@/lib/formatters';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  amount: number;
  date: string;
  credit_card_id: string;
}

interface CreditCardLimitEvolutionChartProps {
  card: CreditCard;
  transactions: Transaction[];
}

interface MonthData {
  month: string;
  monthLabel: string;
  spent: number;
  limitUsagePercent: number;
}

export const CreditCardLimitEvolutionChart = ({ 
  card, 
  transactions 
}: CreditCardLimitEvolutionChartProps) => {
  const { t } = useTranslation();
  const { dateLocale } = useLanguage();

  const chartData = useMemo(() => {
    const months: MonthData[] = [];
    const now = new Date();

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthLabel = format(monthDate, 'MMM', { locale: dateLocale });

      // Sum transactions for this card in this month
      const monthTransactions = transactions.filter(tx => {
        const txDate = parseISO(tx.date);
        return txDate >= monthStart && txDate <= monthEnd && tx.credit_card_id === card.id;
      });

      const spent = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const limitUsagePercent = card.total_limit > 0 
        ? Math.min((spent / card.total_limit) * 100, 100) 
        : 0;

      months.push({
        month: monthKey,
        monthLabel,
        spent,
        limitUsagePercent: Math.round(limitUsagePercent * 10) / 10,
      });
    }

    return months;
  }, [card, transactions, dateLocale]);

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return { direction: 'stable' as const, change: 0 };
    
    const lastMonth = chartData[chartData.length - 1];
    const previousMonth = chartData[chartData.length - 2];
    
    if (previousMonth.spent === 0 && lastMonth.spent === 0) {
      return { direction: 'stable' as const, change: 0 };
    }
    
    if (previousMonth.spent === 0) {
      return { direction: 'up' as const, change: 100 };
    }
    
    const change = ((lastMonth.spent - previousMonth.spent) / previousMonth.spent) * 100;
    
    if (Math.abs(change) < 5) {
      return { direction: 'stable' as const, change: Math.round(change) };
    }
    
    return {
      direction: change > 0 ? 'up' as const : 'down' as const,
      change: Math.round(Math.abs(change)),
    };
  }, [chartData]);

  // Average usage
  const averageUsage = useMemo(() => {
    const nonZeroMonths = chartData.filter(m => m.spent > 0);
    if (nonZeroMonths.length === 0) return 0;
    return Math.round(
      nonZeroMonths.reduce((sum, m) => sum + m.limitUsagePercent, 0) / nonZeroMonths.length
    );
  }, [chartData]);

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up':
        return 'text-destructive';
      case 'down':
        return 'text-emerald-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium capitalize">{data.monthLabel}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('creditCards.spent', 'Gasto')}: {formatMoney(data.spent, card.currency as any)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('creditCards.limitUsage', 'Uso do limite')}: {data.limitUsagePercent}%
          </p>
        </div>
      );
    }
    return null;
  };

  const hasData = chartData.some(m => m.spent > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {t('creditCards.limitEvolution', 'Evolução do Uso')}
          </CardTitle>
          <Badge 
            variant="outline" 
            className={cn("gap-1", getTrendColor())}
          >
            {getTrendIcon()}
            {trend.direction === 'stable' 
              ? t('creditCards.stable', 'Estável')
              : `${trend.change}%`
            }
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('creditCards.avgUsage', 'Média de uso')}: {averageUsage}% {t('creditCards.ofLimit', 'do limite')}
        </p>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
            {t('creditCards.noSpendingData', 'Sem dados de gastos ainda')}
          </div>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`gradient-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="monthLabel" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="limitUsagePercent"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill={`url(#gradient-${card.id})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
