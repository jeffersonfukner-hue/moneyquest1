import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { useQuests } from '@/hooks/useQuests';
import { useBadges } from '@/hooks/useBadges';
import { useCategoryGoals } from '@/hooks/useCategoryGoals';
import { useDailyReward } from '@/hooks/useDailyReward';
import { useRealtimeXP } from '@/hooks/useRealtimeXP';
import { LevelProgress } from '@/components/game/LevelProgress';
import { StatsCards } from '@/components/game/StatsCards';
import { ResourceBars } from '@/components/game/ResourceBars';
import { LeaderboardCard } from '@/components/game/LeaderboardCard';
import { DailyRewardBanner } from '@/components/game/DailyRewardBanner';
import { DailyRewardDialog } from '@/components/game/DailyRewardDialog';
import { QuestsPanel } from '@/components/game/QuestsPanel';
import { BadgesGrid } from '@/components/game/BadgesGrid';
import { TransactionsList } from '@/components/game/TransactionsList';
import { RecentTransactionsCard } from '@/components/game/RecentTransactionsCard';
import { SpendingByCategoryChart } from '@/components/game/SpendingByCategoryChart';
import { MonthlySavingsWidget } from '@/components/game/MonthlySavingsWidget';
import { MonthlyComparisonWidget } from '@/components/game/MonthlyComparisonWidget';
import { AddTransactionDialog } from '@/components/game/AddTransactionDialog';
import { MoodIndicator } from '@/components/game/MoodIndicator';
import { QuestCelebration } from '@/components/game/QuestCelebration';
import { SeasonalDecorations } from '@/components/game/SeasonalDecorations';
import { NarrativeEvent } from '@/components/game/NarrativeEvent';
import { TransactionFeedback } from '@/components/game/TransactionFeedback';
import { QuickTemplates } from '@/components/game/QuickTemplates';
import { XPNotification } from '@/components/game/XPNotification';
import { BottomNavigation, type TabId } from '@/components/navigation/BottomNavigation';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { AICoachCard } from '@/components/ai/AICoachCard';
import { CategoryGoalsCard } from '@/components/goals/CategoryGoalsCard';
import { AdBanner } from '@/components/ads/AdBanner';
import { CashFlowWidget } from '@/components/reports/CashFlowWidget';
import { PeriodComparisonWidget } from '@/components/reports/PeriodComparisonWidget';
import { useAdBanner } from '@/hooks/useAdBanner';
import { getFeedbackMessage } from '@/lib/feedbackMessages';
import { TransactionTemplate } from '@/hooks/useTransactionTemplates';
import { Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const { transactions, addTransaction, updateTransaction, deleteTransaction, celebrationData, clearCelebration, narrativeData, clearNarrative } = useTransactions();
  const { quests, refetch: refetchQuests } = useQuests();
  const { badges, refetch: refetchBadges } = useBadges();
  const { goals } = useCategoryGoals();
  const { status: rewardStatus } = useDailyReward();
  const { shouldShowBanner } = useAdBanner();
  const { xpChange, clearXPChange } = useRealtimeXP();
  
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  
  // Inline feedback state
  const [inlineFeedback, setInlineFeedback] = useState<{
    message: string;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    currency: string;
  } | null>(null);
  const lastFeedbackRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Auto-show reward dialog on first load if reward is available
  useEffect(() => {
    if (rewardStatus?.can_claim && !showRewardDialog) {
      // Small delay to let the page load first
      const timer = setTimeout(() => setShowRewardDialog(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [rewardStatus?.can_claim]);

  // Show inline feedback when narrative data changes
  useEffect(() => {
    if (narrativeData) {
      // Create unique ID for this feedback to prevent duplicates
      const feedbackId = `${narrativeData.category}-${narrativeData.amount}-${Date.now()}`;
      
      // Only show if it's a new feedback
      if (lastFeedbackRef.current !== feedbackId) {
        lastFeedbackRef.current = feedbackId;
        
        // Use the generated narrative or create a contextual message
        const message = narrativeData.narrative || getFeedbackMessage(
          narrativeData.eventType as 'INCOME' | 'EXPENSE',
          narrativeData.category || '',
          narrativeData.amount || 0,
          t
        );
        
        setInlineFeedback({
          message,
          type: narrativeData.eventType as 'INCOME' | 'EXPENSE',
          category: narrativeData.category || '',
          amount: narrativeData.amount || 0,
          currency: narrativeData.currency || profile?.currency || 'BRL',
        });
      }
    }
  }, [narrativeData, t, profile?.currency]);

  if (authLoading || profileLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Gamepad2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Handle using a quick template
  const handleUseTemplate = async (template: TransactionTemplate) => {
    const { error } = await addTransaction({
      description: template.description,
      amount: template.amount,
      category: template.category,
      type: template.type,
      date: format(new Date(), 'yyyy-MM-dd'),
      currency: template.currency,
      wallet_id: null,
    });
    
    if (!error) {
      toast.success(t('templates.used'));
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-4 pb-4">
            {/* Mood indicator at top for visibility */}
            <div className="flex justify-center sm:justify-start">
              <MoodIndicator />
            </div>
            
            <DailyRewardBanner onClaimClick={() => setShowRewardDialog(true)} />
            <LevelProgress profile={profile} />
            <StatsCards profile={profile} />
            
            {/* Inline feedback */}
            {inlineFeedback && (
              <TransactionFeedback
                message={inlineFeedback.message}
                type={inlineFeedback.type}
                category={inlineFeedback.category}
                amount={inlineFeedback.amount}
                currency={inlineFeedback.currency}
                onDismiss={() => setInlineFeedback(null)}
              />
            )}
            
            {/* Recent transactions directly after status */}
            <RecentTransactionsCard transactions={transactions} onViewMore={setActiveTab} />
            
            {/* Quick templates for fast transaction entry */}
            <QuickTemplates onUseTemplate={handleUseTemplate} />
            
            <ResourceBars transactions={transactions} categoryGoals={goals} />
            <CategoryGoalsCard />
            
            {/* Analytics widgets */}
            <CashFlowWidget />
            <PeriodComparisonWidget />
            <MonthlySavingsWidget transactions={transactions} />
            <MonthlyComparisonWidget transactions={transactions} />
            <SpendingByCategoryChart transactions={transactions} />
            
            {/* Social & AI at bottom */}
            <LeaderboardCard />
            <AICoachCard />
          </div>
        );
      case 'transactions':
        return <TransactionsList transactions={transactions} onDelete={deleteTransaction} onUpdate={updateTransaction} />;
      case 'quests':
        return <QuestsPanel quests={quests} />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-background relative",
      shouldShowBanner ? "pb-[130px]" : "pb-20"
    )}>
      <SeasonalDecorations />
      
      <MobileHeader onSettingsClick={() => navigate('/settings')} onProfileClick={() => navigate('/profile')} />

      <main className="px-4 py-4 max-w-md mx-auto relative z-10">
        {renderTabContent()}
      </main>

      <AdBanner />

      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddClick={() => setShowAddDialog(true)}
      />

      <AddTransactionDialog 
        onAdd={addTransaction}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
      
      <QuestCelebration 
        completedQuest={celebrationData?.quest || null}
        unlockedBadge={celebrationData?.badge || null}
        onClose={() => {
          clearCelebration();
          refetchQuests();
          refetchBadges();
          refetchProfile();
        }}
      />

      {narrativeData && (
        <NarrativeEvent
          narrative={narrativeData.narrative}
          impact={narrativeData.impact}
          eventType={narrativeData.eventType}
          category={narrativeData.category}
          amount={narrativeData.amount}
          onClose={clearNarrative}
        />
      )}

      <DailyRewardDialog 
        open={showRewardDialog} 
        onOpenChange={(open) => {
          setShowRewardDialog(open);
          if (!open) refetchProfile();
        }}
      />

      <XPNotification 
        xpChange={xpChange} 
        onDismiss={() => {
          clearXPChange();
          refetchProfile();
        }} 
      />
    </div>
  );
};

export default Index;
