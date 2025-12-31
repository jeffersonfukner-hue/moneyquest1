import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subWeeks, subMonths, subQuarters, subYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, differenceInDays } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus, BarChart3, LineChart, Filter, Scroll } from 'lucide-react';
import { BarChart, Bar, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WalletFilter } from '@/components/wallets/WalletFilter';
import { CategoryFilter } from './CategoryFilter';
import { TransactionTable } from './TransactionTable';
import { useWallets } from '@/hooks/useWallets';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatMoney } from '@/lib/formatters';
import { parseDateString } from '@/lib/dateUtils';
import { Transaction } from '@/types/database';
import { generateCashFlowNarrative, getImpactBgColor, getImpactColor, getImpactIcon } from '@/lib/cashFlowNarratives';
import { cn } from '@/lib/utils';

interface PremiumCashFlowReportProps {
  transactions: Transaction[];
}

type PeriodType = 'week' | 'month' | 'quarter' | 'year';
type ChartType = 'bar' | 'line';
type TransactionTypeFilter = 'all' | 'income' | 'expense';

export const PremiumCashFlowReport = ({ transactions }: PremiumCashFlowReportProps) => {
  const { t, i18n } = useTranslation();
  const { currency: displayCurrency } = useCurrency();
  const { wallets } = useWallets();

  const [period, setPeriod] = useState<PeriodType>('month');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [walletFilter, setWalletFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const dateLocale = i18n.language === 'pt-BR' ? ptBR : i18n.language === 'es-ES' ? es : enUS;

  // Calculate period dates
  const periodDates = useMemo(() => {
    const now = new Date();
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

    switch (period) {
      case 'week':
        currentStart = startOfWeek(now, { weekStartsOn: 1 });
        currentEnd = endOfWeek(now, { weekStartsOn: 1 });
        previousStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        previousEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        break;
      case 'quarter':
        currentStart = startOfQuarter(now);
        currentEnd = endOfQuarter(now);
        previousStart = startOfQuarter(subQuarters(now, 1));
        previousEnd = endOfQuarter(subQuarters(now, 1));
        break;
      case 'year':
        currentStart = startOfYear(now);
        currentEnd = endOfYear(now);
        previousStart = startOfYear(subYears(now, 1));
        previousEnd = endOfYear(subYears(now, 1));
        break;
      default: // month
        currentStart = startOfMonth(now);
        currentEnd = endOfMonth(now);
        previousStart = startOfMonth(subMonths(now, 1));
        previousEnd = endOfMonth(subMonths(now, 1));
    }

    return { currentStart, currentEnd, previousStart, previousEnd };
  }, [period]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = parseDateString(tx.date);
      const inCurrentPeriod = txDate >= periodDates.currentStart && txDate <= periodDates.currentEnd;
      
      if (!inCurrentPeriod) return false;
      if (walletFilter && tx.wallet_id !== walletFilter) return false;
      if (categoryFilter.length > 0 && !categoryFilter.includes(tx.category)) return false;
      if (typeFilter === 'income' && tx.type !== 'INCOME') return false;
      if (typeFilter === 'expense' && tx.type !== 'EXPENSE') return false;
      
      return true;
    });
  }, [transactions, periodDates, walletFilter, categoryFilter, typeFilter]);

  // Previous period transactions (for comparison)
  const previousTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = parseDateString(tx.date);
      const inPreviousPeriod = txDate >= periodDates.previousStart && txDate <= periodDates.previousEnd;
      
      if (!inPreviousPeriod) return false;
      if (walletFilter && tx.wallet_id !== walletFilter) return false;
      if (categoryFilter.length > 0 && !categoryFilter.includes(tx.category)) return false;
      if (typeFilter === 'income' && tx.type !== 'INCOME') return false;
      if (typeFilter === 'expense' && tx.type !== 'EXPENSE') return false;
      
      return true;
    });
  }, [transactions, periodDates, walletFilter, categoryFilter, typeFilter]);

  // Calculate summaries
  const currentSummary = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    const netFlow = income - expenses;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    // Find top categories
    const expenseByCategory: Record<string, number> = {};
    const incomeByCategory: Record<string, number> = {};
    filteredTransactions.forEach(tx => {
      if (tx.type === 'EXPENSE') {
        expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
      } else {
        incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + tx.amount;
      }
    });

    const topExpenseCategory = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topIncomeCategory = Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1])[0]?.[0];

    return { income, expenses, netFlow, savingsRate, topExpenseCategory, topIncomeCategory };
  }, [filteredTransactions]);

  const previousSummary = useMemo(() => {
    const income = previousTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const expenses = previousTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, netFlow: income - expenses };
  }, [previousTransactions]);

  // Calculate comparison percentages
  const comparison = useMemo(() => {
    const incomeChange = previousSummary.income > 0 
      ? ((currentSummary.income - previousSummary.income) / previousSummary.income) * 100 
      : 0;
    const expenseChange = previousSummary.expenses > 0 
      ? ((currentSummary.expenses - previousSummary.expenses) / previousSummary.expenses) * 100 
      : 0;
    const netFlowChange = previousSummary.netFlow !== 0 
      ? ((currentSummary.netFlow - previousSummary.netFlow) / Math.abs(previousSummary.netFlow)) * 100 
      : 0;
    
    return { incomeChange, expenseChange, netFlowChange };
  }, [currentSummary, previousSummary]);

  // Generate chart data
  const chartData = useMemo(() => {
    const data = [
      {
        name: t('premiumCashFlow.comparison.previous'),
        income: previousSummary.income,
        expenses: previousSummary.expenses,
        netFlow: previousSummary.netFlow,
      },
      {
        name: t('premiumCashFlow.comparison.current'),
        income: currentSummary.income,
        expenses: currentSummary.expenses,
        netFlow: currentSummary.netFlow,
      },
    ];
    return data;
  }, [currentSummary, previousSummary, t]);

  // Generate narrative
  const narrative = useMemo(() => {
    return generateCashFlowNarrative(
      {
        totalIncome: currentSummary.income,
        totalExpenses: currentSummary.expenses,
        netFlow: currentSummary.netFlow,
        savingsRate: currentSummary.savingsRate,
        topExpenseCategory: currentSummary.topExpenseCategory,
        topIncomeCategory: currentSummary.topIncomeCategory,
        comparisonChange: comparison.netFlowChange,
        periodLabel: t(`premiumCashFlow.period.${period}`),
      },
      i18n.language,
      displayCurrency
    );
  }, [currentSummary, comparison, period, i18n.language, displayCurrency, t]);

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 2) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (value < -2) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const formatChange = (value: number) => {
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="week" className="min-h-[40px]">
              {t('premiumCashFlow.period.week')}
            </TabsTrigger>
            <TabsTrigger value="month" className="min-h-[40px]">
              {t('premiumCashFlow.period.month')}
            </TabsTrigger>
            <TabsTrigger value="quarter" className="min-h-[40px]">
              {t('premiumCashFlow.period.quarter')}
            </TabsTrigger>
            <TabsTrigger value="year" className="min-h-[40px]">
              {t('premiumCashFlow.period.year')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setChartType('bar')}
            className="min-h-[40px] min-w-[40px]"
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setChartType('line')}
            className="min-h-[40px] min-w-[40px]"
          >
            <LineChart className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Collapsible Filters */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between min-h-[44px]">
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {t('premiumCashFlow.filters.title')}
            </span>
            {(walletFilter || categoryFilter.length > 0 || typeFilter !== 'all') && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                {t('common.active')}
              </span>
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <Card>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('premiumCashFlow.filters.wallets')}
                </label>
                <WalletFilter
                  wallets={wallets.filter(w => w.is_active)}
                  selectedWalletId={walletFilter}
                  onSelect={setWalletFilter}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('premiumCashFlow.filters.categories')}
                </label>
                <CategoryFilter
                  selectedCategories={categoryFilter}
                  onSelect={setCategoryFilter}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('premiumCashFlow.filters.transactionType')}
                </label>
                <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as TransactionTypeFilter)}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="all">{t('premiumCashFlow.filters.allTypes')}</TabsTrigger>
                    <TabsTrigger value="income">{t('transactions.income')}</TabsTrigger>
                    <TabsTrigger value="expense">{t('transactions.expense')}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{t('premiumCashFlow.summary.totalIncome')}</p>
            <p className="text-lg font-bold text-green-500">{formatMoney(currentSummary.income, displayCurrency)}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendIcon value={comparison.incomeChange} />
              <span className={cn('text-xs', comparison.incomeChange >= 0 ? 'text-green-500' : 'text-red-500')}>
                {formatChange(comparison.incomeChange)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{t('premiumCashFlow.summary.totalExpenses')}</p>
            <p className="text-lg font-bold text-red-500">{formatMoney(currentSummary.expenses, displayCurrency)}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendIcon value={-comparison.expenseChange} />
              <span className={cn('text-xs', comparison.expenseChange <= 0 ? 'text-green-500' : 'text-red-500')}>
                {formatChange(comparison.expenseChange)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{t('premiumCashFlow.summary.netFlow')}</p>
            <p className={cn('text-lg font-bold', currentSummary.netFlow >= 0 ? 'text-green-500' : 'text-red-500')}>
              {formatMoney(currentSummary.netFlow, displayCurrency)}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendIcon value={comparison.netFlowChange} />
              <span className={cn('text-xs', comparison.netFlowChange >= 0 ? 'text-green-500' : 'text-red-500')}>
                {formatChange(comparison.netFlowChange)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{t('premiumCashFlow.summary.savingsRate')}</p>
            <p className={cn('text-lg font-bold', currentSummary.savingsRate >= 0 ? 'text-green-500' : 'text-red-500')}>
              {currentSummary.savingsRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {currentSummary.savingsRate >= 20 ? '🏆' : currentSummary.savingsRate >= 0 ? '✓' : '⚠️'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('premiumCashFlow.comparison.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => formatMoney(value, displayCurrency)}
                  />
                  <Legend />
                  <Bar dataKey="income" name={t('transactions.income')} fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name={t('transactions.expense')} fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <RechartsLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => formatMoney(value, displayCurrency)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="income" name={t('transactions.income')} stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="expenses" name={t('transactions.expense')} stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="netFlow" name={t('premiumCashFlow.summary.netFlow')} stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 4 }} />
                </RechartsLineChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quest-Style Narrative */}
      <Card className={cn('border', getImpactBgColor(narrative.impact))}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{getImpactIcon(narrative.impact)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Scroll className={cn('w-4 h-4', getImpactColor(narrative.impact))} />
                <h4 className={cn('font-bold', getImpactColor(narrative.impact))}>
                  {narrative.title}
                </h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {narrative.message}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <TransactionTable transactions={filteredTransactions} />
    </div>
  );
};
