import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useCategoryGoals } from '@/hooks/useCategoryGoals';
import { Target, Lock, ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CategoryGoalsCard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canAccessCategoryGoals } = useSubscription();
  const { goals } = useCategoryGoals();

  // Count goals that are over budget or near limit (>= 80%)
  const alertCount = goals.filter(goal => {
    const spent = goal.spent || 0;
    const percentage = (spent / goal.budget_limit) * 100;
    return percentage >= 80;
  }).length;

  const overBudgetCount = goals.filter(goal => {
    const spent = goal.spent || 0;
    return spent > goal.budget_limit;
  }).length;

  return (
    <Card 
      className={cn(
        "relative overflow-hidden cursor-pointer transition-all hover:shadow-lg",
        "bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-amber-500/5",
        "border-amber-500/20",
        overBudgetCount > 0 && canAccessCategoryGoals && "border-destructive/50"
      )}
      onClick={() => navigate('/category-goals')}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative",
            canAccessCategoryGoals 
              ? "bg-gradient-to-br from-amber-500 to-amber-600" 
              : "bg-muted"
          )}>
            <Target className={cn(
              "h-6 w-6",
              canAccessCategoryGoals ? "text-amber-950" : "text-muted-foreground"
            )} />
            {alertCount > 0 && canAccessCategoryGoals && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
              >
                {alertCount}
              </Badge>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">{t('categoryGoals.title')}</h3>
              {!canAccessCategoryGoals && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-400/20 rounded-full">
                  <Lock className="h-3 w-3 text-amber-500" />
                  <span className="text-[10px] font-medium text-amber-600">Premium</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {overBudgetCount > 0 && canAccessCategoryGoals ? (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  {t('categoryGoals.alertsCount', { count: overBudgetCount })}
                </span>
              ) : (
                t('categoryGoals.cardDescription')
              )}
            </p>
          </div>

          <Button 
            size="sm" 
            variant="ghost"
            className="shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
