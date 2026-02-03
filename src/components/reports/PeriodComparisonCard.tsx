import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  GitCompareArrows,
  ArrowRight,
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ComparisonData } from '@/hooks/useReportsAnalytics';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PeriodComparisonCardProps {
  data: ComparisonData | null;
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  onMetricClick?: (metric: 'income' | 'expense' | 'result') => void;
}

export const PeriodComparisonCard = ({ 
  data, 
  currentPeriodLabel,
  previousPeriodLabel,
  onMetricClick 
}: PeriodComparisonCardProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  if (!data) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <GitCompareArrows className="w-4 h-4" />
            Comparativo de Períodos
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Dados insuficientes para comparação.
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      id: 'income' as const,
      label: 'Receitas',
      current: data.period1.totalIncome,
      previous: data.period2.totalIncome,
      change: data.incomeChange,
      isPositiveGood: true,
    },
    {
      id: 'expense' as const,
      label: 'Despesas',
      current: data.period1.totalExpenses,
      previous: data.period2.totalExpenses,
      change: data.expenseChange,
      isPositiveGood: false,
    },
    {
      id: 'result' as const,
      label: 'Resultado',
      current: data.period1.netResult,
      previous: data.period2.netResult,
      change: data.resultChange,
      isPositiveGood: true,
    },
  ];

  const getChangeColor = (change: number, isPositiveGood: boolean) => {
    if (change === 0) return 'text-muted-foreground';
    const isGood = isPositiveGood ? change > 0 : change < 0;
    return isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-3 h-3" />;
    if (change < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <GitCompareArrows className="w-4 h-4" />
            Comparativo de Períodos
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{currentPeriodLabel}</span>
            <ArrowRight className="w-3 h-3" />
            <span>{previousPeriodLabel}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main metrics comparison */}
        <div className="grid grid-cols-3 gap-3">
          {metrics.map(metric => (
            <div
              key={metric.id}
              className="p-3 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onMetricClick?.(metric.id)}
            >
              <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
              <p className="text-sm font-bold tabular-nums">{formatCurrency(metric.current)}</p>
              <div className={cn('flex items-center gap-1 text-xs mt-1', getChangeColor(metric.change, metric.isPositiveGood))}>
                {getChangeIcon(metric.change)}
                <span>{metric.change > 0 ? '+' : ''}{metric.change.toFixed(0)}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ant: {formatCurrency(metric.previous)}
              </p>
            </div>
          ))}
        </div>

        {/* Top categories comparison */}
        {data.topCategoriesComparison.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Variação nas principais categorias:</p>
            <div className="flex flex-wrap gap-2">
              {data.topCategoriesComparison.slice(0, 5).map(cat => (
                <Badge
                  key={cat.category}
                  variant="outline"
                  className={cn(
                    'text-xs',
                    cat.change > 0 ? 'border-red-500/30 text-red-600 dark:text-red-400' : 
                    cat.change < 0 ? 'border-green-500/30 text-green-600 dark:text-green-400' : ''
                  )}
                >
                  {t(`transactions.categories.${cat.category}`, cat.category)}
                  <span className="ml-1 font-medium">
                    {cat.change > 0 ? '+' : ''}{cat.change.toFixed(0)}%
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
