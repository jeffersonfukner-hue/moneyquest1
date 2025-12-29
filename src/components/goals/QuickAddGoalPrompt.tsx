import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCategoryGoals } from '@/hooks/useCategoryGoals';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Target, X, Loader2 } from 'lucide-react';

interface QuickAddGoalPromptProps {
  category: string;
  onSuccess?: () => void;
  onDismiss?: () => void;
}

export const QuickAddGoalPrompt = ({ category, onSuccess, onDismiss }: QuickAddGoalPromptProps) => {
  const { t } = useTranslation();
  const { addGoal } = useCategoryGoals();
  const { currency } = useCurrency();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetBudget = async () => {
    const budgetAmount = parseFloat(amount);
    if (isNaN(budgetAmount) || budgetAmount <= 0) return;

    setLoading(true);
    const { error } = await addGoal(category, budgetAmount);
    setLoading(false);

    if (!error) {
      onSuccess?.();
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2">
      <Target className="h-4 w-4 text-primary shrink-0" />
      <span className="text-sm text-muted-foreground shrink-0">
        {t('categoryGoals.quickAdd.prompt')}
      </span>
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <span className="text-sm text-muted-foreground">{currency}</span>
        <Input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-7 w-24 text-sm"
          min="0"
          step="0.01"
        />
      </div>
      <Button
        size="sm"
        variant="default"
        onClick={handleSetBudget}
        disabled={loading || !amount || parseFloat(amount) <= 0}
        className="h-7 text-xs"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : t('categoryGoals.quickAdd.setBudget')}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDismiss}
        className="h-7 w-7 p-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};
