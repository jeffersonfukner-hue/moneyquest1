import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { getMonthStartString } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

interface CategorySpending {
  name: string;
  icon: string;
  amount: number;
  percentage: number;
  color: string;
}

export const TopCategoriesCard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { transactions } = useTransactions();
  const { categories } = useCategories();

  const topCategories = useMemo((): CategorySpending[] => {
    const monthStart = getMonthStartString();
    
    // Get expenses for current month
    const expenses = transactions.filter(
      t => t.type === 'EXPENSE' && t.date >= monthStart
    );
    
    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    if (totalExpenses === 0) return [];

    // Group by category
    const byCategory: Record<string, number> = {};
    expenses.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
    });

    // Create category map for icons/colors
    const categoryMap: Record<string, { icon: string; color: string }> = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = {
        icon: cat.icon || '📦',
        color: cat.color || '#8B5CF6',
      };
    });

    // Sort and take top 5
    return Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({
        name,
        icon: categoryMap[name]?.icon || '📦',
        amount,
        percentage: (amount / totalExpenses) * 100,
        color: categoryMap[name]?.color || '#8B5CF6',
      }));
  }, [transactions, categories]);

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/dashboard?tab=transactions&category=${encodeURIComponent(categoryName)}`);
  };

  if (topCategories.length === 0) {
    return null;
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('dashboard.topCategories', 'Top 5 Categorias de Gasto')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {topCategories.map((category, index) => (
            <div
              key={category.name}
              className="cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
              onClick={() => handleCategoryClick(category.name)}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">{category.icon}</span>
                  <span className="text-sm font-medium truncate">{category.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold tabular-nums">
                    {formatCurrency(category.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {category.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${category.percentage}%`,
                    backgroundColor: category.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
