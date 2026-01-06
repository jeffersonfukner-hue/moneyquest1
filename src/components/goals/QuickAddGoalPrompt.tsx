import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCategoryGoals } from '@/hooks/useCategoryGoals';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSpendingSuggestions } from '@/hooks/useSpendingSuggestions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Target, X, Loader2, Lightbulb, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAddGoalPromptProps {
  category: string;
  onSuccess?: () => void;
  onDismiss?: () => void;
}

export const QuickAddGoalPrompt = ({ category, onSuccess, onDismiss }: QuickAddGoalPromptProps) => {
  const { t } = useTranslation();
  const { addGoal } = useCategoryGoals();
  const { currency, formatCurrency } = useCurrency();
  const { getSuggestionForCategory, loading: suggestionsLoading } = useSpendingSuggestions();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const suggestion = getSuggestionForCategory(category);

  const handleSetBudget = async () => {
    const budgetAmount = parseFloat(amount);
    if (isNaN(budgetAmount) || budgetAmount <= 0) return;

    setLoading(true);
    const { error } = await addGoal(category, budgetAmount);
    setLoading(false);

    if (!error) {
      setDrawerOpen(false);
      onSuccess?.();
    }
  };

  const handleSelectSuggestion = (suggestedAmount: number) => {
    setAmount(suggestedAmount.toString());
  };

  const TrendIcon = suggestion?.trend === 'increasing' 
    ? TrendingUp 
    : suggestion?.trend === 'decreasing' 
      ? TrendingDown 
      : Minus;

  const trendColor = suggestion?.trend === 'increasing'
    ? 'text-expense'
    : suggestion?.trend === 'decreasing'
      ? 'text-income'
      : 'text-muted-foreground';

  const options = suggestion ? [
    { key: 'conservative', amount: suggestion.suggestions.conservative },
    { key: 'balanced', amount: suggestion.suggestions.balanced, recommended: true },
    { key: 'flexible', amount: suggestion.suggestions.flexible },
  ] : [];

  return (
    <>
      {/* Compact trigger below category */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2">
        <Target className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm text-muted-foreground flex-1">
          {t('categoryGoals.quickAdd.prompt')}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDrawerOpen(true)}
          className="min-h-[36px] min-w-[80px] text-xs"
        >
          {t('categoryGoals.quickAdd.setBudget')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          className="min-h-[36px] min-w-[36px] p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Bottom sheet for budget input */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>
              {t('categoryGoals.quickAdd.drawerTitle', { category })}
            </DrawerTitle>
            <DrawerDescription>
              {t('categoryGoals.quickAdd.drawerDescription')}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-4">
            {/* Smart Suggestions */}
            {suggestionsLoading ? (
              <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{t('common.loading')}</span>
                </div>
              </div>
            ) : suggestion ? (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
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
                  {options.map(({ key, amount: suggAmount, recommended }) => {
                    const isSelected = parseFloat(amount) === suggAmount;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggAmount)}
                        className={cn(
                          'relative p-3 rounded-lg border text-center transition-all duration-200 min-h-[60px]',
                          'hover:border-primary/50 hover:bg-primary/5 active:scale-95',
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
                          {formatCurrency(suggAmount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                          {t(`categoryGoals.suggestions.${key}`)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lightbulb className="h-4 w-4" />
                  <span className="text-sm">{t('categoryGoals.suggestions.noHistory')}</span>
                </div>
              </div>
            )}

            {/* Manual Input */}
            <div className="space-y-2">
              <Label>{t('categoryGoals.monthlyLimit')}</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">{currency}</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(',', '.');
                    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                      setAmount(val);
                    }
                  }}
                  className="min-h-[48px] text-lg"
                  autoFocus
                />
              </div>
            </div>
          </div>

          <DrawerFooter className="pt-2">
            <Button 
              onClick={handleSetBudget} 
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="min-h-[48px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('categoryGoals.quickAdd.setBudget')}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="min-h-[48px]">
                {t('common.cancel')}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};
