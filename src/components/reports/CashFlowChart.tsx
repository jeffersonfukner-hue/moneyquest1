import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Transaction, SupportedCurrency } from '@/types/database';
import { useCurrency } from '@/contexts/CurrencyContext';
import { parseDateString } from '@/lib/dateUtils';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  eachMonthOfInterval,
  subMonths,
  addMonths,
  isWithinInterval,
  isSameWeek,
  isSameMonth,
} from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

interface CashFlowChartProps {
  transactions: Transaction[];
  walletFilter?: string | null;
}

type PeriodType = 'week' | 'month';
type ViewMode = 'history' | 'projection';

interface DataPoint {
  period: string;
  periodDate: Date;
  income: number;
  expenses: number;
  balance: number;
  netFlow: number;
  isProjection?: boolean;
}

export const CashFlowChart = ({ transactions, walletFilter }: CashFlowChartProps) => {
  const { t, i18n } = useTranslation();
  const { formatCurrency, convertToUserCurrency } = useCurrency();
  const { language } = useLanguage();
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [viewMode, setViewMode] = useState<ViewMode>('history');

  const dateLocale = useMemo(() => {
    switch (language) {
      case 'pt-BR': return ptBR;
      case 'es-ES': return es;
      default: return enUS;
    }
  }, [language]);

  // Filter transactions by wallet if specified
  const filteredTransactions = useMemo(() => {
    if (!walletFilter) return transactions;
    return transactions.filter(tx => tx.wallet_id === walletFilter);
  }, [transactions, walletFilter]);

  // Calculate historical data points
  const historicalData = useMemo(() => {
    const now = new Date();
    const monthsBack = periodType === 'week' ? 3 : 6;
    const startDate = subMonths(startOfMonth(now), monthsBack);
    const endDate = endOfMonth(now);

    let periods: Date[];
    if (periodType === 'week') {
      periods = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
    } else {
      periods = eachMonthOfInterval({ start: startDate, end: endDate });
    }

    return periods.map(periodStart => {
      const periodEnd = periodType === 'week' 
        ? endOfWeek(periodStart, { weekStartsOn: 1 })
        : endOfMonth(periodStart);

      const periodTxs = filteredTransactions.filter(tx => {
        const txDate = parseDateString(tx.date);
        return isWithinInterval(txDate, { start: periodStart, end: periodEnd });
      });

      const income = periodTxs
        .filter(tx => tx.type === 'INCOME')
        .reduce((sum, tx) => sum + convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency), 0);

      const expenses = periodTxs
        .filter(tx => tx.type === 'EXPENSE')
        .reduce((sum, tx) => sum + convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency), 0);

      const netFlow = income - expenses;

      return {
        period: periodType === 'week'
          ? format(periodStart, 'dd/MM', { locale: dateLocale })
          : format(periodStart, 'MMM yy', { locale: dateLocale }),
        periodDate: periodStart,
        income,
        expenses,
        balance: 0, // Will be calculated cumulatively
        netFlow,
        isProjection: false,
      };
    });
  }, [filteredTransactions, periodType, dateLocale, convertToUserCurrency]);

  // Calculate projections based on historical patterns
  const projectionData = useMemo(() => {
    if (historicalData.length < 3) return [];

    // Calculate average income and expenses from last 3 periods
    const recentPeriods = historicalData.slice(-3);
    const avgIncome = recentPeriods.reduce((sum, d) => sum + d.income, 0) / recentPeriods.length;
    const avgExpenses = recentPeriods.reduce((sum, d) => sum + d.expenses, 0) / recentPeriods.length;

    // Calculate trend (simple linear regression on net flow)
    const netFlows = historicalData.slice(-6).map(d => d.netFlow);
    const trend = netFlows.length > 1
      ? (netFlows[netFlows.length - 1] - netFlows[0]) / netFlows.length
      : 0;

    const now = new Date();
    const projectionMonths = 3;
    const projections: DataPoint[] = [];

    for (let i = 1; i <= projectionMonths; i++) {
      const periodStart = periodType === 'week'
        ? startOfWeek(addMonths(now, i * 0.25), { weekStartsOn: 1 })
        : startOfMonth(addMonths(now, i));

      // Apply trend adjustment
      const trendAdjustment = trend * i * 0.5; // Dampened trend
      const projectedIncome = Math.max(0, avgIncome + trendAdjustment * 0.3);
      const projectedExpenses = Math.max(0, avgExpenses - trendAdjustment * 0.2);

      projections.push({
        period: periodType === 'week'
          ? format(periodStart, 'dd/MM', { locale: dateLocale })
          : format(periodStart, 'MMM yy', { locale: dateLocale }),
        periodDate: periodStart,
        income: projectedIncome,
        expenses: projectedExpenses,
        balance: 0,
        netFlow: projectedIncome - projectedExpenses,
        isProjection: true,
      });
    }

    return projections;
  }, [historicalData, periodType, dateLocale]);

  // Combine data and calculate cumulative balance
  const chartData = useMemo(() => {
    const combined = viewMode === 'projection' 
      ? [...historicalData, ...projectionData]
      : historicalData;

    let cumulativeBalance = 0;
    return combined.map(point => {
      cumulativeBalance += point.netFlow;
      return { ...point, balance: cumulativeBalance };
    });
  }, [historicalData, projectionData, viewMode]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const recentData = historicalData.slice(-3);
    const totalIncome = recentData.reduce((sum, d) => sum + d.income, 0);
    const totalExpenses = recentData.reduce((sum, d) => sum + d.expenses, 0);
    const avgNetFlow = recentData.length > 0 
      ? recentData.reduce((sum, d) => sum + d.netFlow, 0) / recentData.length
      : 0;
    
    const projectedBalance = projectionData.length > 0
      ? chartData[chartData.length - 1]?.balance || 0
      : 0;

    return {
      totalIncome,
      totalExpenses,
      avgNetFlow,
      projectedBalance,
      trend: avgNetFlow >= 0 ? 'positive' : 'negative',
    };
  }, [historicalData, projectionData, chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload as DataPoint;
    const isProjected = data?.isProjection;

    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-foreground">{label}</span>
          {isProjected && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              {t('cashFlow.projected')}
            </Badge>
          )}
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-green-500">{t('transactions.income')}:</span>
            <span className="font-medium">{formatCurrency(data?.income || 0)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-red-500">{t('transactions.expense')}:</span>
            <span className="font-medium">{formatCurrency(data?.expenses || 0)}</span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t border-border/50">
            <span className="text-muted-foreground">{t('cashFlow.netFlow')}:</span>
            <span className={`font-bold ${(data?.netFlow || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(data?.netFlow || 0) >= 0 ? '+' : ''}{formatCurrency(data?.netFlow || 0)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{t('cashFlow.balance')}:</span>
            <span className="font-medium text-primary">{formatCurrency(data?.balance || 0)}</span>
          </div>
        </div>
      </div>
    );
  };

  if (transactions.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-12 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t('cashFlow.noData')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {t('cashFlow.title')}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Tabs value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
              <TabsList className="h-8">
                <TabsTrigger value="week" className="text-xs px-3">
                  {t('cashFlow.weekly')}
                </TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-3">
                  {t('cashFlow.monthly')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="h-8">
                <TabsTrigger value="history" className="text-xs px-3">
                  {t('cashFlow.history')}
                </TabsTrigger>
                <TabsTrigger value="projection" className="text-xs px-3">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {t('cashFlow.projection')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-green-500/10 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">{t('cashFlow.avgIncome')}</p>
            <p className="text-lg font-bold text-green-500">
              {formatCurrency(summaryStats.totalIncome / 3)}
            </p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">{t('cashFlow.avgExpenses')}</p>
            <p className="text-lg font-bold text-red-500">
              {formatCurrency(summaryStats.totalExpenses / 3)}
            </p>
          </div>
          <div className={`rounded-lg p-3 ${summaryStats.avgNetFlow >= 0 ? 'bg-primary/10' : 'bg-orange-500/10'}`}>
            <p className="text-xs text-muted-foreground">{t('cashFlow.avgNetFlow')}</p>
            <p className={`text-lg font-bold ${summaryStats.avgNetFlow >= 0 ? 'text-primary' : 'text-orange-500'}`}>
              {summaryStats.avgNetFlow >= 0 ? '+' : ''}{formatCurrency(summaryStats.avgNetFlow)}
            </p>
          </div>
          {viewMode === 'projection' && (
            <div className="bg-purple-500/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {t('cashFlow.projectedBalance')}
              </p>
              <p className="text-lg font-bold text-purple-500">
                {formatCurrency(summaryStats.projectedBalance)}
              </p>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => {
                  if (Math.abs(value) >= 1000) {
                    return `${(value / 1000).toFixed(0)}k`;
                  }
                  return value.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="income"
                name={t('transactions.income')}
                stroke="hsl(var(--chart-2))"
                fill="url(#incomeGradient)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: 'hsl(var(--chart-2))', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name={t('transactions.expense')}
                stroke="hsl(var(--destructive))"
                fill="url(#expenseGradient)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: 'hsl(var(--destructive))', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                name={t('cashFlow.cumulativeBalance')}
                stroke="hsl(var(--primary))"
                fill="url(#balanceGradient)"
                strokeWidth={2}
                strokeDasharray={viewMode === 'projection' ? "5 5" : undefined}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload?.isProjection) {
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={3}
                        fill="hsl(var(--primary))"
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    );
                  }
                  return null;
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Trend indicator */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="flex items-center gap-2 text-sm">
            {summaryStats.trend === 'positive' ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-medium">{t('cashFlow.positiveTrend')}</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-orange-500" />
                <span className="text-orange-500 font-medium">{t('cashFlow.negativeTrend')}</span>
              </>
            )}
          </div>
          {viewMode === 'projection' && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {t('cashFlow.projectionNote')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
