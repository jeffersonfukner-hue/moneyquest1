import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useCategoryGoals, CategoryGoal } from '@/hooks/useCategoryGoals';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSpendingSuggestions } from '@/hooks/useSpendingSuggestions';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { AppShell } from '@/components/layout/AppShell';
import { SeasonalDecorations } from '@/components/game/SeasonalDecorations';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { GoalCard } from '@/components/goals/GoalCard';
import { AddGoalDialog } from '@/components/goals/AddGoalDialog';
import { GoalsMonthlyReport } from '@/components/goals/GoalsMonthlyReport';
import { AddTransactionDialog } from '@/components/game/AddTransactionDialog';
import { AdBanner } from '@/components/ads/AdBanner';
import { useAdBanner } from '@/hooks/useAdBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ArrowLeft, Target, Plus, Loader2, Lock, PiggyBank, BarChart3, Lightbulb, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const CategoryGoals = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { goals, loading: goalsLoading, addGoal, updateGoal, deleteGoal } = useCategoryGoals();
  const { canAccessCategoryGoals } = useSubscription();
  const { formatCurrency } = useCurrency();
  const { getCategoriesWithoutGoals, loading: suggestionsLoading } = useSpendingSuggestions();
  const { getCategoriesByType } = useCategories();
  const { addTransaction } = useTransactions();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CategoryGoal | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showAddTransactionDialog, setShowAddTransactionDialog] = useState(false);
  const { shouldShowBanner } = useAdBanner();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const existingCategories = goals.map(g => g.category);
  const totalBudget = goals.reduce((sum, g) => sum + g.budget_limit, 0);
  const totalSpent = goals.reduce((sum, g) => sum + (g.spent || 0), 0);
  const totalRemaining = totalBudget - totalSpent;

  // Get smart suggestions for categories without goals
  const smartSuggestions = getCategoriesWithoutGoals(existingCategories);
  const expenseCategories = getCategoriesByType('EXPENSE');
  
  // Get category icon from categories list
  const getCategoryIcon = (categoryName: string): string => {
    const cat = expenseCategories.find(c => c.name === categoryName);
    return cat?.icon || '📦';
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing': return TrendingUp;
      case 'decreasing': return TrendingDown;
      default: return Minus;
    }
  };

  const handleCreateSuggestedGoal = (category: string, amount: number) => {
    addGoal(category, amount);
  };

  const handleEdit = (goal: CategoryGoal) => {
    setEditingGoal(goal);
    setShowAddDialog(true);
  };

  const handleDialogClose = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) {
      setEditingGoal(null);
    }
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-background",
      shouldShowBanner ? "pb-[130px]" : "pb-20"
    )}>
      <SeasonalDecorations />
      <MobileHeader 
        onSettingsClick={() => navigate('/settings')} 
        onProfileClick={() => navigate('/profile')} 
      />
      
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('categoryGoals.pageTitle')}</h1>
            <p className="text-sm text-muted-foreground">{t('categoryGoals.pageDescription')}</p>
          </div>
        </div>

        {canAccessCategoryGoals ? (
          <>
            {/* Summary Card */}
            {goals.length > 0 && (
              <Card className="mb-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <PiggyBank className="h-5 w-5 text-primary" />
                    <span className="font-medium">{t('categoryGoals.monthlySummary')}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('categoryGoals.budget')}</p>
                      <p className="font-semibold text-lg">{formatCurrency(totalBudget)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('categoryGoals.spent')}</p>
                      <p className="font-semibold text-lg text-expense">{formatCurrency(totalSpent)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('categoryGoals.remaining')}</p>
                      <p className={`font-semibold text-lg ${totalRemaining >= 0 ? 'text-income' : 'text-destructive'}`}>
                        {formatCurrency(totalRemaining)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mb-6">
              <Button
                onClick={() => setShowAddDialog(true)}
                className="flex-1 min-h-[48px]"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('categoryGoals.addGoal')}
              </Button>
              {goals.length > 0 && (
                <Button
                  onClick={() => setShowReport(true)}
                  variant="outline"
                  className="min-h-[48px]"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {t('categoryGoals.report.viewReport')}
                </Button>
              )}
            </div>

            {/* Smart Suggestions Section */}
            {!suggestionsLoading && smartSuggestions.length > 0 && (
              <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <span className="font-medium">{t('categoryGoals.suggestions.smartSuggestions')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('categoryGoals.suggestions.smartSuggestionsDesc')}
                  </p>
                  <div className="space-y-3">
                    {smartSuggestions.slice(0, 3).map(suggestion => {
                      const TrendIcon = getTrendIcon(suggestion.trend);
                      return (
                        <div 
                          key={suggestion.category}
                          className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{getCategoryIcon(suggestion.category)}</span>
                            <div>
                              <p className="font-medium text-sm">{suggestion.category}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{t('categoryGoals.suggestions.average')}: {formatCurrency(suggestion.averageSpending)}</span>
                                <TrendIcon className="h-3 w-3" />
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateSuggestedGoal(suggestion.category, suggestion.suggestions.balanced)}
                            className="text-xs"
                          >
                            {formatCurrency(suggestion.suggestions.balanced)}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Goals List */}
            {goalsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : goals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Target className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">{t('categoryGoals.noGoals')}</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    {t('categoryGoals.noGoalsDescription')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {goals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={handleEdit}
                    onDelete={deleteGoal}
                  />
                ))}
              </div>
            )}

            <AddGoalDialog
              open={showAddDialog}
              onOpenChange={handleDialogClose}
              onAdd={addGoal}
              onUpdate={updateGoal}
              existingCategories={existingCategories}
              editingGoal={editingGoal}
            />

            {/* Monthly Report Sheet */}
            <Sheet open={showReport} onOpenChange={setShowReport}>
              <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle>{t('categoryGoals.report.title')}</SheetTitle>
                </SheetHeader>
                <GoalsMonthlyReport onClose={() => setShowReport(false)} />
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">{t('categoryGoals.lockedTitle')}</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {t('categoryGoals.lockedDescription')}
              </p>
              <UpgradePrompt feature="category_goals" context="modal" />
            </CardContent>
          </Card>
        )}
      </main>

      <AdBanner />

      <BottomNavigation 
        activeTab="home" 
        onTabChange={(tab) => {
          if (tab !== 'add') navigate('/');
        }} 
        onAddClick={() => setShowAddTransactionDialog(true)} 
      />

      <AddTransactionDialog 
        open={showAddTransactionDialog}
        onOpenChange={setShowAddTransactionDialog}
        onAdd={addTransaction}
      />
    </div>
  );
};

export default CategoryGoals;
