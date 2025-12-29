import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CategorySuggestion } from '@/hooks/useSpendingSuggestions';
import { TrendingUp, TrendingDown, Minus, Lightbulb, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetSuggestionProps {
  suggestion: CategorySuggestion | null;
  onSelectAmount: (amount: number) => void;
  selectedAmount?: number;
  loading: boolean;
}

export const BudgetSuggestion = ({
  suggestion,
  onSelectAmount,
  selectedAmount,
  loading,
}: BudgetSuggestionProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  if (loading) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lightbulb className="h-4 w-4" />
          <span className="text-sm">{t('categoryGoals.suggestions.noHistory')}</span>
        </div>
      </div>
    );
  }

  const TrendIcon = suggestion.trend === 'increasing' 
    ? TrendingUp 
    : suggestion.trend === 'decreasing' 
      ? TrendingDown 
      : Minus;

  const trendColor = suggestion.trend === 'increasing'
    ? 'text-expense'
    : suggestion.trend === 'decreasing'
      ? 'text-income'
      : 'text-muted-foreground';

  const options = [
    { key: 'conservative', amount: suggestion.suggestions.conservative },
    { key: 'balanced', amount: suggestion.suggestions.balanced, recommended: true },
    { key: 'flexible', amount: suggestion.suggestions.flexible },
  ];

  return (
    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3 animate-in fade-in-50 duration-300">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{t('categoryGoals.suggestions.title')}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {t('categoryGoals.suggestions.average')}: {formatCurrency(suggestion.averageSpending)}{t('categoryGoals.suggestions.perMonth')}
        </span>
        <div className={cn('flex items-center gap-1', trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span className="text-xs capitalize">
            {t(`categoryGoals.suggestions.${suggestion.trend}`)}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t('categoryGoals.suggestions.monthsAnalyzed', { months: suggestion.monthsAnalyzed })}
      </p>

      <div className="grid grid-cols-3 gap-2">
        {options.map(({ key, amount, recommended }) => {
          const isSelected = selectedAmount === amount;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectAmount(amount)}
              className={cn(
                'relative p-3 rounded-lg border text-center transition-all duration-200',
                'hover:border-primary/50 hover:bg-primary/5',
                isSelected 
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/30' 
                  : 'border-border bg-background',
              )}
            >
              {recommended && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full whitespace-nowrap">
                  {t('categoryGoals.suggestions.recommended')}
                </span>
              )}
              <p className="font-semibold text-sm">
                {formatCurrency(amount)}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                {t(`categoryGoals.suggestions.${key}`)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
