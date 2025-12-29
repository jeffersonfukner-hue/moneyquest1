import { useTranslation } from 'react-i18next';
import { useMonthlyGoalsReport, CategoryPerformance } from '@/hooks/useMonthlyGoalsReport';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Trophy, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface GoalsMonthlyReportProps {
  onClose?: () => void;
}

export const GoalsMonthlyReport = ({ onClose }: GoalsMonthlyReportProps) => {
  const { t } = useTranslation();
  const { report, loading } = useMonthlyGoalsReport();
  const { formatCurrency } = useCurrency();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        {t('categoryGoals.report.noData')}
      </div>
    );
  }

  const getStatusColor = (status: CategoryPerformance['status']) => {
    switch (status) {
      case 'excellent': return 'bg-emerald-500';
      case 'good': return 'bg-blue-500';
      case 'warning': return 'bg-amber-500';
      case 'over': return 'bg-destructive';
    }
  };

  const getStatusBadge = (status: CategoryPerformance['status']) => {
    switch (status) {
      case 'excellent': return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{t('categoryGoals.report.excellent')}</Badge>;
      case 'good': return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">{t('categoryGoals.report.good')}</Badge>;
      case 'warning': return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">{t('categoryGoals.report.warning')}</Badge>;
      case 'over': return <Badge variant="destructive">{t('categoryGoals.report.over')}</Badge>;
    }
  };

  const chartData = report.categories.map(c => ({
    name: c.category,
    budget: c.budgetLimit,
    spent: c.spent,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t('categoryGoals.report.title')}</h2>
        <p className="text-muted-foreground">{report.month} {report.year}</p>
      </div>

      {/* Overall Score */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('categoryGoals.report.adherenceRate')}</p>
              <p className="text-4xl font-bold text-primary">{report.adherenceRate}%</p>
            </div>
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Target className="h-8 w-8 text-primary" />
            </div>
          </div>
          <Progress value={report.adherenceRate} className="mt-4 h-2" />
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{report.categoriesWithinBudget}</p>
                <p className="text-xs text-muted-foreground">{t('categoryGoals.report.withinBudget')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{report.categoriesOverBudget}</p>
                <p className="text-xs text-muted-foreground">{t('categoryGoals.report.overBudget')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best & Worst Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report.bestCategory && (
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4 text-emerald-500" />
                {t('categoryGoals.report.bestCategory')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{report.bestCategory.category}</p>
              <p className="text-sm text-muted-foreground">
                {Math.round(report.bestCategory.percentage)}% {t('categoryGoals.report.ofBudget')}
              </p>
            </CardContent>
          </Card>
        )}
        {report.worstCategory && report.worstCategory.category !== report.bestCategory?.category && (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                {t('categoryGoals.report.worstCategory')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{report.worstCategory.category}</p>
              <p className="text-sm text-muted-foreground">
                {Math.round(report.worstCategory.percentage)}% {t('categoryGoals.report.ofBudget')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('categoryGoals.report.comparison')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="budget" name={t('categoryGoals.report.budget')} fill="hsl(var(--primary))" opacity={0.3} />
                  <Bar dataKey="spent" name={t('categoryGoals.report.spent')} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('categoryGoals.report.breakdown')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.categories.map((category) => (
            <div key={category.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{category.category}</span>
                  {getStatusBadge(category.status)}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {category.changeFromLastMonth !== undefined && category.changeFromLastMonth !== 0 && (
                    <span className={`flex items-center gap-1 ${category.changeFromLastMonth > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                      {category.changeFromLastMonth > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(Math.round(category.changeFromLastMonth))}%
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {formatCurrency(category.spent)} / {formatCurrency(category.budgetLimit)}
                  </span>
                </div>
              </div>
              <Progress 
                value={Math.min(100, category.percentage)} 
                className={`h-2 ${category.percentage > 100 ? '[&>div]:bg-destructive' : ''}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">{t('categoryGoals.report.total')}</span>
            <span className="text-lg">
            <span className={report.totalSpent > report.totalBudget ? 'text-destructive' : 'text-foreground'}>
                {formatCurrency(report.totalSpent)}
              </span>
              <span className="text-muted-foreground"> / {formatCurrency(report.totalBudget)}</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
