import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useCategoryGoals, CategoryGoal } from '@/hooks/useCategoryGoals';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { SeasonalDecorations } from '@/components/game/SeasonalDecorations';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { GoalCard } from '@/components/goals/GoalCard';
import { AddGoalDialog } from '@/components/goals/AddGoalDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Target, Plus, Loader2, Lock, PiggyBank } from 'lucide-react';

const CategoryGoals = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { goals, loading: goalsLoading, addGoal, updateGoal, deleteGoal } = useCategoryGoals();
  const { canAccessCategoryGoals } = useSubscription();
  const { formatCurrency } = useCurrency();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CategoryGoal | null>(null);

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
    <div className="min-h-screen flex flex-col bg-background">
      <SeasonalDecorations />
      <MobileHeader 
        onSettingsClick={() => navigate('/settings')} 
        onProfileClick={() => navigate('/profile')} 
      />
      
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6 pb-24">
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

            {/* Add Goal Button */}
            <Button
              onClick={() => setShowAddDialog(true)}
              className="w-full mb-6 min-h-[48px]"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('categoryGoals.addGoal')}
            </Button>

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

      <BottomNavigation 
        activeTab="home" 
        onTabChange={(tab) => {
          if (tab !== 'add') navigate('/');
        }} 
        onAddClick={() => {}} 
      />
    </div>
  );
};

export default CategoryGoals;
