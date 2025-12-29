import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { useQuests } from '@/hooks/useQuests';
import { useBadges } from '@/hooks/useBadges';
import { useCategoryGoals } from '@/hooks/useCategoryGoals';
import { useDailyReward } from '@/hooks/useDailyReward';
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
import { BottomNavigation, type TabId } from '@/components/navigation/BottomNavigation';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { AICoachCard } from '@/components/ai/AICoachCard';
import { CategoryGoalsCard } from '@/components/goals/CategoryGoalsCard';
import { Gamepad2 } from 'lucide-react';

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const { transactions, addTransaction, deleteTransaction, celebrationData, clearCelebration, narrativeData, clearNarrative } = useTransactions();
  const { quests, refetch: refetchQuests } = useQuests();
  const { badges, refetch: refetchBadges } = useBadges();
  const { goals } = useCategoryGoals();
  const { status: rewardStatus } = useDailyReward();
  
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRewardDialog, setShowRewardDialog] = useState(false);

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-4">
            <DailyRewardBanner onClaimClick={() => setShowRewardDialog(true)} />
            <LevelProgress profile={profile} />
            <StatsCards profile={profile} />
            <ResourceBars transactions={transactions} categoryGoals={goals} />
            <LeaderboardCard />
            <MonthlySavingsWidget transactions={transactions} />
            <MonthlyComparisonWidget transactions={transactions} />
            <SpendingByCategoryChart transactions={transactions} />
            <RecentTransactionsCard transactions={transactions} onViewMore={setActiveTab} />
            <AICoachCard />
            <CategoryGoalsCard />
            <MoodIndicator />
          </div>
        );
      case 'transactions':
        return <TransactionsList transactions={transactions} onDelete={deleteTransaction} />;
      case 'quests':
        return <QuestsPanel quests={quests} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <SeasonalDecorations />
      
      <MobileHeader onSettingsClick={() => navigate('/settings')} onProfileClick={() => navigate('/profile')} />

      <main className="px-4 py-4 max-w-md mx-auto relative z-10">
        {renderTabContent()}
      </main>

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
        }}
      />

      {narrativeData && (
        <NarrativeEvent
          narrative={narrativeData.narrative}
          impact={narrativeData.impact}
          eventType={narrativeData.eventType}
          category={narrativeData.category}
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
    </div>
  );
};

export default Index;
