import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useGoalHistory, CategoryTrend } from '@/hooks/useGoalHistory';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, TrendingDown, Minus, History, Award, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalHistoryPanelProps {
  category?: string; // If provided, show history for specific category
}

export const GoalHistoryPanel = ({ category }: GoalHistoryPanelProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { history, loading, getCategoryHistory, getCategoryTrends, getSummaryStats } = useGoalHistory();
  const { getCategoriesByType } = useCategories();

  const expenseCategories = getCategoriesByType('EXPENSE');
  
  const getCategoryIcon = (categoryName: string): string => {
    const cat = expenseCategories.find(c => c.name === categoryName);
    return cat?.icon || '📦';
  };

  const getMonthName = (month: number): string => {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return t(`months.${months[month - 1]}`);
  };

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving': return TrendingDown;
      case 'declining': return TrendingUp;
      default: return Minus;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return Award;
      case 'within_budget': return CheckCircle2;
      default: return AlertTriangle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-income';
      case 'within_budget': return 'text-primary';
      default: return 'text-expense';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Show specific category history
  if (category) {
    const categoryHistory = getCategoryHistory(category);
    
    if (categoryHistory.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground text-sm">
          {t('categoryGoals.history.noHistory')}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <History className="h-4 w-4" />
          <span>{t('categoryGoals.history.title')}</span>
        </div>
        {categoryHistory.slice(0, 6).map((record) => {
          const StatusIcon = getStatusIcon(record.status);
          return (
            <div 
              key={record.id}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <StatusIcon className={cn('h-4 w-4', getStatusColor(record.status))} />
                <div>
                  <p className="text-sm font-medium">
                    {getMonthName(record.period_month)} {record.period_year}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(record.spent)} / {formatCurrency(record.budget_limit)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn('text-sm font-semibold', getStatusColor(record.status))}>
                  {record.percentage_used}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Show overview with trends
  const trends = getCategoryTrends();
  const stats = getSummaryStats();

  if (trends.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">{t('categoryGoals.history.noHistory')}</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          {t('categoryGoals.history.noHistoryDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-income/10 border-income/20">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-income">{stats.successRate}%</p>
              <p className="text-xs text-muted-foreground">{t('categoryGoals.history.successRate')}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.totalRecords}</p>
              <p className="text-xs text-muted-foreground">{t('categoryGoals.history.monthsTracked')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Trends */}
      <div>
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t('categoryGoals.history.categoryTrends')}
        </h3>
        <div className="space-y-3">
          {trends.map((trend) => {
            const TrendIcon = getTrendIcon(trend.trend);
            const trendColor = trend.trend === 'improving' 
              ? 'text-income' 
              : trend.trend === 'declining' 
                ? 'text-expense' 
                : 'text-muted-foreground';
            
            return (
              <div 
                key={trend.category}
                className="p-3 bg-background border border-border/50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(trend.category)}</span>
                    <span className="font-medium text-sm">{trend.category}</span>
                  </div>
                  <div className={cn('flex items-center gap-1', trendColor)}>
                    <TrendIcon className="h-3.5 w-3.5" />
                    <span className="text-xs capitalize">
                      {t(`categoryGoals.history.${trend.trend}`)}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={Math.min(trend.averagePercentage, 100)} 
                  className="h-2"
                />
                <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                  <span>{t('categoryGoals.history.avgUsage')}: {trend.averagePercentage}%</span>
                  <span>{trend.monthsTracked} {t('categoryGoals.history.months')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
