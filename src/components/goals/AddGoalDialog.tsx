import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CategoryGoal } from '@/hooks/useCategoryGoals';
import { useCategories } from '@/hooks/useCategories';
import { useSpendingSuggestions } from '@/hooks/useSpendingSuggestions';
import { BudgetSuggestion } from './BudgetSuggestion';
import { Category } from '@/types/database';

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (category: string, budgetLimit: number) => Promise<{ error: Error | null }>;
  onUpdate?: (id: string, budgetLimit: number) => Promise<{ error: Error | null }>;
  existingCategories: string[];
  editingGoal?: CategoryGoal | null;
}

export const AddGoalDialog = ({ 
  open, 
  onOpenChange, 
  onAdd, 
  onUpdate,
  existingCategories,
  editingGoal 
}: AddGoalDialogProps) => {
  const { t } = useTranslation();
  const { currencySymbol } = useCurrency();
  const { getCategoriesByType, loading: categoriesLoading } = useCategories();
  const { getSuggestionForCategory, loading: suggestionsLoading } = useSpendingSuggestions();
  const [category, setCategory] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!editingGoal;
  const currentSuggestion = category ? getSuggestionForCategory(category) : null;

  // Get expense categories from user's dynamic categories
  const expenseCategories = getCategoriesByType('EXPENSE');

  useEffect(() => {
    if (editingGoal) {
      setCategory(editingGoal.category);
      setBudgetLimit(editingGoal.budget_limit.toString());
    } else {
      setCategory('');
      setBudgetLimit('');
    }
  }, [editingGoal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetLimit || (!isEditing && !category)) return;

    setLoading(true);
    
    let result;
    if (isEditing && onUpdate && editingGoal) {
      result = await onUpdate(editingGoal.id, parseFloat(budgetLimit));
    } else {
      result = await onAdd(category, parseFloat(budgetLimit));
    }

    if (!result.error) {
      setCategory('');
      setBudgetLimit('');
      onOpenChange(false);
    }
    setLoading(false);
  };

  // Filter out categories that already have goals (except when editing)
  const availableCategories = expenseCategories.filter(
    cat => !existingCategories.includes(cat.name) || (isEditing && editingGoal?.category === cat.name)
  );

  // Map category to translation key
  const getCategoryTranslationKey = (cat: string): string => {
    const keyMap: Record<string, string> = {
      'Food': 'food',
      'Transport': 'transport',
      'Entertainment': 'entertainment',
      'Shopping': 'shopping',
      'Bills': 'bills',
      'Health': 'health',
      'Education': 'education',
      'Other': 'other_expense',
    };
    return keyMap[cat] || cat.toLowerCase().replace(/\s+/g, '_');
  };

  // Get display name for category (use icon + translated name or custom name)
  const getCategoryDisplayName = (cat: Category): string => {
    const translationKey = getCategoryTranslationKey(cat.name);
    const translated = t(`transactions.categories.${translationKey}`, cat.name);
    return `${cat.icon || '📦'} ${translated}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEditing ? t('categoryGoals.editGoal') : t('categoryGoals.addGoal')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">{t('transactions.category')}</Label>
            <Select 
              value={category} 
              onValueChange={setCategory} 
              disabled={isEditing}
              required={!isEditing}
            >
              <SelectTrigger className="min-h-[48px]">
                <SelectValue placeholder={t('transactions.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.name} className="min-h-[44px]">
                    {getCategoryDisplayName(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget Suggestions */}
          {!isEditing && category && (
            <BudgetSuggestion
              suggestion={currentSuggestion}
              onSelectAmount={(amount) => setBudgetLimit(amount.toString())}
              selectedAmount={budgetLimit ? parseFloat(budgetLimit) : undefined}
              loading={suggestionsLoading}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="budgetLimit">
              {t('categoryGoals.monthlyLimit')} ({currencySymbol})
            </Label>
            <Input
              id="budgetLimit"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(e.target.value)}
              required
              className="min-h-[48px]"
            />
          </div>

          <Button
            type="submit"
            className="w-full min-h-[48px] bg-gradient-hero hover:opacity-90"
            disabled={loading || !budgetLimit || (!isEditing && !category)}
          >
            {loading ? t('common.loading') : isEditing ? t('common.save') : t('common.add')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
