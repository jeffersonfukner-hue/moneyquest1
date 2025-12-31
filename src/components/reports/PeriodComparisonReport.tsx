import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, Calendar, ArrowRight } from 'lucide-react';
import { Transaction, SupportedCurrency } from '@/types/database';
import { useCurrency } from '@/contexts/CurrencyContext';
import { parseDateString } from '@/lib/dateUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface PeriodComparisonReportProps {
  transactions: Transaction[];
}

type ComparisonType = 'month-vs-last-year' | 'month-vs-previous' | 'custom';

export const PeriodComparisonReport = ({ transactions }: PeriodComparisonReportProps) => {
  const { t } = useTranslation();
  const { formatCurrency, convertToUserCurrency } = useCurrency();
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const [comparisonType, setComparisonType] = useState<ComparisonType>('month-vs-last-year');
  const [selectedMonth1, setSelectedMonth1] = useState(currentMonth);
  const [selectedYear1, setSelectedYear1] = useState(currentYear);
  const [selectedMonth2, setSelectedMonth2] = useState(currentMonth);
  const [selectedYear2, setSelectedYear2] = useState(currentYear - 1);

  const monthNames = [
    t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'),
    t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'),
    t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec')
  ];

  const fullMonthNames = useMemo(() => [
    t('periodComparison.monthNames.january', 'Janeiro'),
    t('periodComparison.monthNames.february', 'Fevereiro'),
    t('periodComparison.monthNames.march', 'Março'),
    t('periodComparison.monthNames.april', 'Abril'),
    t('periodComparison.monthNames.may', 'Maio'),
    t('periodComparison.monthNames.june', 'Junho'),
    t('periodComparison.monthNames.july', 'Julho'),
    t('periodComparison.monthNames.august', 'Agosto'),
    t('periodComparison.monthNames.september', 'Setembro'),
    t('periodComparison.monthNames.october', 'Outubro'),
    t('periodComparison.monthNames.november', 'Novembro'),
    t('periodComparison.monthNames.december', 'Dezembro')
  ], [t]);

  // Get available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach(tx => {
      const txDate = parseDateString(tx.date);
      years.add(txDate.getFullYear());
    });
    years.add(currentYear);
    years.add(currentYear - 1);
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  // Calculate periods based on comparison type
  const { period1, period2 } = useMemo(() => {
    let p1Month = selectedMonth1;
    let p1Year = selectedYear1;
    let p2Month = selectedMonth2;
    let p2Year = selectedYear2;

    if (comparisonType === 'month-vs-last-year') {
      p1Month = currentMonth;
      p1Year = currentYear;
      p2Month = currentMonth;
      p2Year = currentYear - 1;
    } else if (comparisonType === 'month-vs-previous') {
      p1Month = currentMonth;
      p1Year = currentYear;
      p2Month = currentMonth === 0 ? 11 : currentMonth - 1;
      p2Year = currentMonth === 0 ? currentYear - 1 : currentYear;
    }

    return {
      period1: { month: p1Month, year: p1Year },
      period2: { month: p2Month, year: p2Year }
    };
  }, [comparisonType, selectedMonth1, selectedYear1, selectedMonth2, selectedYear2, currentMonth, currentYear]);

  // Filter and aggregate transactions by period
  const getExpensesByCategory = (month: number, year: number) => {
    const categoryMap = new Map<string, number>();
    
    transactions
      .filter((tx) => {
        const txDate = parseDateString(tx.date);
        return (
          tx.type === 'EXPENSE' &&
          txDate.getMonth() === month &&
          txDate.getFullYear() === year
        );
      })
      .forEach(tx => {
        const amount = convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency);
        categoryMap.set(tx.category, (categoryMap.get(tx.category) || 0) + amount);
      });

    return categoryMap;
  };

  const getTotalExpenses = (month: number, year: number) => {
    return transactions
      .filter((tx) => {
        const txDate = parseDateString(tx.date);
        return (
          tx.type === 'EXPENSE' &&
          txDate.getMonth() === month &&
          txDate.getFullYear() === year
        );
      })
      .reduce((sum, tx) => sum + convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency), 0);
  };

  const getTotalIncome = (month: number, year: number) => {
    return transactions
      .filter((tx) => {
        const txDate = parseDateString(tx.date);
        return (
          tx.type === 'INCOME' &&
          txDate.getMonth() === month &&
          txDate.getFullYear() === year
        );
      })
      .reduce((sum, tx) => sum + convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency), 0);
  };

  const period1Expenses = getTotalExpenses(period1.month, period1.year);
  const period2Expenses = getTotalExpenses(period2.month, period2.year);
  const period1Income = getTotalIncome(period1.month, period1.year);
  const period2Income = getTotalIncome(period2.month, period2.year);

  const period1Categories = getExpensesByCategory(period1.month, period1.year);
  const period2Categories = getExpensesByCategory(period2.month, period2.year);

  // Build comparison chart data by category
  const chartData = useMemo(() => {
    const allCategories = new Set([...period1Categories.keys(), ...period2Categories.keys()]);
    return Array.from(allCategories).map(category => ({
      category: t(`transactions.categories.${category}`, category),
      period1: period1Categories.get(category) || 0,
      period2: period2Categories.get(category) || 0,
    })).sort((a, b) => (b.period1 + b.period2) - (a.period1 + a.period2)).slice(0, 8);
  }, [period1Categories, period2Categories, t]);

  // Calculate percentage change
  const expenseChange = period2Expenses > 0 
    ? ((period1Expenses - period2Expenses) / period2Expenses) * 100 
    : period1Expenses > 0 ? 100 : 0;
  
  const incomeChange = period2Income > 0 
    ? ((period1Income - period2Income) / period2Income) * 100 
    : period1Income > 0 ? 100 : 0;

  const isExpenseIncrease = expenseChange > 0;
  const isExpenseDecrease = expenseChange < 0;
  const isIncomeIncrease = incomeChange > 0;
  const isIncomeDecrease = incomeChange < 0;

  const period1Label = `${monthNames[period1.month]} ${period1.year}`;
  const period2Label = `${monthNames[period2.month]} ${period2.year}`;

  return (
    <div className="space-y-4">
      {/* Period Selection */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {t('periodComparison.selectPeriods', 'Selecionar Períodos')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick comparison buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={comparisonType === 'month-vs-last-year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonType('month-vs-last-year')}
              className="text-xs"
            >
              {t('periodComparison.vsLastYear', 'vs Ano Passado')}
            </Button>
            <Button
              variant={comparisonType === 'month-vs-previous' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonType('month-vs-previous')}
              className="text-xs"
            >
              {t('periodComparison.vsPreviousMonth', 'vs Mês Anterior')}
            </Button>
            <Button
              variant={comparisonType === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonType('custom')}
              className="text-xs"
            >
              {t('periodComparison.custom', 'Personalizado')}
            </Button>
          </div>

          {/* Custom period selectors */}
          {comparisonType === 'custom' && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex gap-2 flex-1">
                <Select value={String(selectedMonth1)} onValueChange={(v) => setSelectedMonth1(Number(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fullMonthNames.map((name, idx) => (
                      <SelectItem key={idx} value={String(idx)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(selectedYear1)} onValueChange={(v) => setSelectedYear1(Number(v))}>
                  <SelectTrigger className="w-[90px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
              <span className="text-muted-foreground text-sm sm:hidden">vs</span>

              <div className="flex gap-2 flex-1">
                <Select value={String(selectedMonth2)} onValueChange={(v) => setSelectedMonth2(Number(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fullMonthNames.map((name, idx) => (
                      <SelectItem key={idx} value={String(idx)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(selectedYear2)} onValueChange={(v) => setSelectedYear2(Number(v))}>
                  <SelectTrigger className="w-[90px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Expenses Comparison */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-4 space-y-3">
            <div className="text-sm text-muted-foreground font-medium">
              {t('periodComparison.expenses', 'Despesas')}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isExpenseIncrease && <TrendingUp className="w-5 h-5 text-red-500" />}
                {isExpenseDecrease && <TrendingDown className="w-5 h-5 text-green-500" />}
                {!isExpenseIncrease && !isExpenseDecrease && <Minus className="w-5 h-5 text-muted-foreground" />}
                <span className={`text-2xl font-bold ${
                  isExpenseIncrease ? 'text-red-500' : isExpenseDecrease ? 'text-green-500' : 'text-muted-foreground'
                }`}>
                  {isExpenseIncrease ? '+' : ''}{expenseChange.toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">{period1Label}</span>
                <span className="font-medium">{formatCurrency(period1Expenses)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{period2Label}</span>
                <span className="text-muted-foreground">{formatCurrency(period2Expenses)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income Comparison */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-4 space-y-3">
            <div className="text-sm text-muted-foreground font-medium">
              {t('periodComparison.income', 'Receitas')}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isIncomeIncrease && <TrendingUp className="w-5 h-5 text-green-500" />}
                {isIncomeDecrease && <TrendingDown className="w-5 h-5 text-red-500" />}
                {!isIncomeIncrease && !isIncomeDecrease && <Minus className="w-5 h-5 text-muted-foreground" />}
                <span className={`text-2xl font-bold ${
                  isIncomeIncrease ? 'text-green-500' : isIncomeDecrease ? 'text-red-500' : 'text-muted-foreground'
                }`}>
                  {isIncomeIncrease ? '+' : ''}{incomeChange.toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">{period1Label}</span>
                <span className="font-medium">{formatCurrency(period1Income)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{period2Label}</span>
                <span className="text-muted-foreground">{formatCurrency(period2Income)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Comparison Chart */}
      {chartData.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('periodComparison.byCategory', 'Comparação por Categoria')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis type="category" dataKey="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => label}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(value) => value === 'period1' ? period1Label : period2Label}
                  />
                  <Bar dataKey="period1" name="period1" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="period2" name="period2" fill="hsl(var(--muted-foreground))" opacity={0.5} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('periodComparison.insights', 'Insights')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {isExpenseDecrease && (
              <p className="text-green-600 dark:text-green-400">
                ✨ {t('periodComparison.insightSaved', 'Você economizou {{amount}} em despesas comparado a {{period}}!', {
                  amount: formatCurrency(Math.abs(period1Expenses - period2Expenses)),
                  period: period2Label
                })}
              </p>
            )}
            {isExpenseIncrease && (
              <p className="text-amber-600 dark:text-amber-400">
                ⚠️ {t('periodComparison.insightSpentMore', 'Você gastou {{amount}} a mais que em {{period}}.', {
                  amount: formatCurrency(Math.abs(period1Expenses - period2Expenses)),
                  period: period2Label
                })}
              </p>
            )}
            {isIncomeIncrease && (
              <p className="text-green-600 dark:text-green-400">
                💰 {t('periodComparison.insightEarnedMore', 'Sua receita aumentou {{amount}} comparado a {{period}}!', {
                  amount: formatCurrency(Math.abs(period1Income - period2Income)),
                  period: period2Label
                })}
              </p>
            )}
            {period1Expenses === 0 && period2Expenses === 0 && (
              <p className="text-muted-foreground">
                {t('periodComparison.noData', 'Não há dados suficientes para comparação nesses períodos.')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
