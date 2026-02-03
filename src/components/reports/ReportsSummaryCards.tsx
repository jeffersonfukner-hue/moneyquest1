import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Target,
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { PeriodSummary } from '@/hooks/useReportsAnalytics';
import { cn } from '@/lib/utils';

type CardVariant = 'success' | 'danger' | 'warning' | 'neutral';
type CardId = 'income' | 'expense' | 'result' | 'average' | 'projection';

interface SummaryCard {
  id: CardId;
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  variant: CardVariant;
}

interface ReportsSummaryCardsProps {
  summary: PeriodSummary;
  onCardClick?: (type: CardId) => void;
}

export const ReportsSummaryCards = ({ summary, onCardClick }: ReportsSummaryCardsProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  const cards: SummaryCard[] = [
    {
      id: 'income',
      title: 'Entradas',
      value: summary.totalIncome,
      icon: ArrowUpRight,
      variant: 'success',
    },
    {
      id: 'expense',
      title: 'Saídas',
      value: summary.totalExpenses,
      icon: ArrowDownRight,
      variant: 'danger',
    },
    {
      id: 'result',
      title: 'Resultado Líquido',
      value: summary.netResult,
      icon: summary.netResult >= 0 ? TrendingUp : TrendingDown,
      variant: summary.netResult >= 0 ? 'success' : 'danger',
    },
    {
      id: 'average',
      title: 'Média diária de gasto',
      value: summary.dailyAvgExpense,
      icon: Calculator,
      variant: 'neutral',
    },
  ];

  // Add projection if available
  if (summary.endOfMonthProjection !== null) {
    cards.push({
      id: 'projection',
      title: 'Projeção fim do mês',
      value: summary.endOfMonthProjection,
      icon: Target,
      variant: summary.endOfMonthProjection >= 0 ? 'success' : 'warning',
    });
  }

  const getVariantStyles = (variant: CardVariant) => {
    switch (variant) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      case 'danger':
        return 'bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'neutral':
        return 'bg-muted/50 border-border/50';
    }
  };

  const getIconStyles = (variant: CardVariant) => {
    switch (variant) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'danger':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'neutral':
        return 'text-muted-foreground';
    }
  };

  const getValueStyles = (variant: CardVariant) => {
    switch (variant) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'danger':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'neutral':
        return 'text-foreground';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <Card
            key={card.id}
            className={cn(
              'cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md',
              getVariantStyles(card.variant)
            )}
            onClick={() => onCardClick?.(card.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn('w-4 h-4', getIconStyles(card.variant))} />
                <span className="text-xs text-muted-foreground font-medium truncate">
                  {card.title}
                </span>
              </div>
              <p className={cn('text-lg font-bold tabular-nums', getValueStyles(card.variant))}>
                {formatCurrency(Math.abs(card.value))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.transactionCount} transações • {summary.daysInPeriod} dias
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
