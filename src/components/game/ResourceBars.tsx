import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction, CategoryGoal, SupportedCurrency, Category } from '@/types/database';
import { cn } from '@/lib/utils';
import { getMonthStartString } from '@/lib/dateUtils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getCategoryRpgKey } from '@/lib/gameLogic';

interface ResourceBarsProps {
  transactions: Transaction[];
  categoryGoals?: CategoryGoal[];
  categories?: Category[];
}

// Generate a gradient class based on hex color
const getGradientFromColor = (color: string): string => {
  // Default gradient if no color
  if (!color) return 'from-purple-500 to-violet-500';
  
  // Map common colors to gradient classes
  const colorMap: Record<string, string> = {
    '#F97316': 'from-orange-500 to-amber-500',
    '#EF4444': 'from-red-500 to-rose-500',
    '#10B981': 'from-emerald-500 to-green-500',
    '#3B82F6': 'from-blue-500 to-cyan-500',
    '#8B5CF6': 'from-purple-500 to-violet-500',
    '#EC4899': 'from-pink-500 to-rose-500',
    '#6366F1': 'from-indigo-500 to-blue-500',
    '#14B8A6': 'from-teal-500 to-emerald-500',
    '#F59E0B': 'from-amber-500 to-yellow-500',
    '#64748B': 'from-slate-500 to-gray-500',
  };
  
  return colorMap[color.toUpperCase()] || 'from-purple-500 to-violet-500';
};

export const ResourceBars = ({ transactions, categoryGoals = [], categories = [] }: ResourceBarsProps) => {
  const { t } = useTranslation();
  const { convertToUserCurrency } = useCurrency();
  
  // Create a map of category details for quick lookup
  const categoryMap = useMemo(() => {
    const map: Record<string, Category> = {};
    categories.filter(c => c.type === 'EXPENSE').forEach(cat => {
      map[cat.name] = cat;
    });
    return map;
  }, [categories]);
  
  // Get current month's expenses by category with currency conversion
  const monthlySpending = useMemo(() => {
    const monthStart = getMonthStartString();
    
    const spending: Record<string, number> = {};
    
    transactions
      .filter(t => t.type === 'EXPENSE' && t.date >= monthStart)
      .forEach(t => {
        const txCurrency = (t.currency || 'BRL') as SupportedCurrency;
        const convertedAmount = convertToUserCurrency(Number(t.amount), txCurrency);
        spending[t.category] = (spending[t.category] || 0) + convertedAmount;
      });
    
    return spending;
  }, [transactions, convertToUserCurrency]);

  // Get max values from category goals or use defaults
  const getMaxValue = (category: string): number => {
    const goal = categoryGoals.find(g => g.category === category);
    if (goal) return Number(goal.budget_limit);
    // Default based on spending history or fallback
    return 500;
  };

  // Get color based on percentage
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  // Get categories that have spending or goals
  const activeCategories = useMemo(() => {
    const categoriesWithSpending = Object.keys(monthlySpending);
    const categoriesWithGoals = categoryGoals.map(g => g.category);
    const all = new Set([...categoriesWithSpending, ...categoriesWithGoals]);
    
    return Array.from(all)
      .filter(cat => {
        // Include if it's in the user's categories OR has spending
        return categoryMap[cat] || monthlySpending[cat] > 0;
      })
      .sort((a, b) => (monthlySpending[b] || 0) - (monthlySpending[a] || 0))
      .slice(0, 5); // Show top 5
  }, [monthlySpending, categoryGoals, categoryMap]);

  // Get display name for category (translated RPG name for defaults, original for custom)
  const getCategoryDisplayName = (categoryName: string): string => {
    const rpgKey = getCategoryRpgKey(categoryName);
    if (rpgKey) {
      const translated = t(`resourceBars.${rpgKey}`);
      // If translation exists and is different from key, use it
      if (translated && translated !== `resourceBars.${rpgKey}`) {
        return translated;
      }
    }
    // Return original name for custom categories
    return categoryName;
  };

  // Get icon for category
  const getCategoryIcon = (categoryName: string): string => {
    const category = categoryMap[categoryName];
    if (category?.icon) return category.icon;
    
    // Fallback icons for known categories
    const defaultIcons: Record<string, string> = {
      'Food': '🍔',
      'Transport': '🚗',
      'Entertainment': '🎮',
      'Shopping': '🛍️',
      'Bills': '📄',
      'Health': '💊',
      'Education': '📚',
      'Other': '📦',
    };
    return defaultIcons[categoryName] || '💰';
  };

  if (activeCategories.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="text-lg">⚔️</span>
          {t('resourceBars.title', 'Resource Bars')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {activeCategories.map(category => {
          const categoryData = categoryMap[category];
          const icon = getCategoryIcon(category);
          const displayName = getCategoryDisplayName(category);
          const spent = monthlySpending[category] || 0;
          const max = getMaxValue(category);
          const percentage = Math.min((spent / max) * 100, 120);
          const progressColor = getProgressColor(percentage);
          
          return (
            <div key={category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span>{icon}</span>
                  <span className="font-medium text-foreground/80">{displayName}</span>
                </div>
                <span className={cn(
                  "font-mono text-[10px]",
                  percentage >= 100 ? "text-red-500" : 
                  percentage >= 80 ? "text-orange-500" : 
                  "text-muted-foreground"
                )}>
                  {Math.round(spent)} / {max}
                </span>
              </div>
              <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500 ease-out",
                    progressColor
                  )}
                  style={{ 
                    width: `${Math.min(percentage, 100)}%`,
                  }}
                />
                {percentage > 100 && (
                  <div 
                    className="absolute top-0 right-0 h-full bg-red-600 animate-pulse rounded-r-full"
                    style={{ width: `${Math.min(percentage - 100, 20)}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
        
        <p className="text-[10px] text-muted-foreground text-center pt-1">
          {t('resourceBars.hint', 'Keep your resources balanced!')}
        </p>
      </CardContent>
    </Card>
  );
};
