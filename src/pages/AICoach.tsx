import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AICoach as AICoachComponent } from '@/components/ai/AICoach';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { SeasonalDecorations } from '@/components/game/SeasonalDecorations';
import { AddTransactionDialog } from '@/components/game/AddTransactionDialog';
import { ArrowLeft, Bot, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const AICoach = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { transactions, addTransaction } = useTransactions();
  const [showAddTransactionDialog, setShowAddTransactionDialog] = useState(false);
  const { canAccessAIInsights } = useSubscription();

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

  const profileStats = {
    level: profile.level,
    level_title: profile.level_title,
    xp: profile.xp,
    streak: profile.streak,
    total_income: profile.total_income,
    total_expenses: profile.total_expenses,
    financial_mood: profile.financial_mood,
  };

  const transactionData = transactions.map(t => ({
    id: t.id,
    description: t.description,
    amount: t.amount,
    category: t.category,
    type: t.type as 'INCOME' | 'EXPENSE',
    date: t.date,
  }));

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
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('aiCoach.pageTitle')}</h1>
            <p className="text-sm text-muted-foreground">{t('aiCoach.pageDescription')}</p>
          </div>
        </div>

        {canAccessAIInsights ? (
          <AICoachComponent 
            transactions={transactionData} 
            profile={profileStats} 
          />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">{t('aiCoach.lockedTitle')}</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {t('aiCoach.lockedDescription')}
              </p>
              <UpgradePrompt feature="ai_insights" context="modal" />
            </CardContent>
          </Card>
        )}
      </main>

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

export default AICoach;
