import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Transaction, CategoryGoal, SupportedCurrency } from '@/types/database';
import { cn } from '@/lib/utils';
import { getMonthStartString } from '@/lib/dateUtils';
import { useCurrency } from '@/contexts/CurrencyContext';

interface ResourceBarsProps {
  transactions: Transaction[];
  categoryGoals?: CategoryGoal[];
}

const RESOURCE_CONFIG: Record<string, {
  icon: string;
  rpgNameKey: string;
  gradient: string;
  maxDefault: number;
}> = {
  Food: { 
    icon: '🍔', 
    rpgNameKey: 'provisions', 
    gradient: 'from-amber-500 to-orange-500',
    maxDefault: 500 
  },
  Transport: { 
    icon: '🚗', 
    rpgNameKey: 'travelFuel', 
    gradient: 'from-blue-500 to-cyan-500',
    maxDefault: 300 
  },
  Entertainment: { 
    icon: '🎮', 
    rpgNameKey: 'funEnergy', 
    gradient: 'from-purple-500 to-pink-500',
    maxDefault: 200 
  },
  Shopping: { 
    icon: '🛍️', 
    rpgNameKey: 'treasure', 
    gradient: 'from-pink-500 to-rose-500',
    maxDefault: 400 
  },
  Bills: { 
    icon: '📄', 
    rpgNameKey: 'kingdomTax', 
    gradient: 'from-slate-500 to-gray-500',
    maxDefault: 600 
  },
  Health: { 
    icon: '💊', 
    rpgNameKey: 'lifeEssence', 
    gradient: 'from-emerald-500 to-green-500',
    maxDefault: 200 
  },
  Education: {
    icon: '📚',
    rpgNameKey: 'magicScrolls',
    gradient: 'from-indigo-500 to-blue-500',
    maxDefault: 300
  }
};

export const ResourceBars = ({ transactions, categoryGoals = [] }: ResourceBarsProps) => {
  const { t } = useTranslation();
  const { convertToUserCurrency } = useCurrency();
  
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
    return RESOURCE_CONFIG[category]?.maxDefault || 500;
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
      .filter(cat => RESOURCE_CONFIG[cat])
      .sort((a, b) => (monthlySpending[b] || 0) - (monthlySpending[a] || 0))
      .slice(0, 5); // Show top 5
  }, [monthlySpending, categoryGoals]);

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
          const config = RESOURCE_CONFIG[category];
          const spent = monthlySpending[category] || 0;
          const max = getMaxValue(category);
          const percentage = Math.min((spent / max) * 100, 120);
          const progressColor = getProgressColor(percentage);
          
          return (
            <div key={category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                  <span>{config.icon}</span>
                  <span className="font-medium text-foreground/80">{t(`resourceBars.${config.rpgNameKey}`)}</span>
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
