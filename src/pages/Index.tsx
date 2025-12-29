import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { useQuests } from '@/hooks/useQuests';
import { useBadges } from '@/hooks/useBadges';
import { LevelProgress } from '@/components/game/LevelProgress';
import { StatsCards } from '@/components/game/StatsCards';
import { QuestsPanel } from '@/components/game/QuestsPanel';
import { BadgesGrid } from '@/components/game/BadgesGrid';
import { TransactionsList } from '@/components/game/TransactionsList';
import { AddTransactionDialog } from '@/components/game/AddTransactionDialog';
import { MoodIndicator } from '@/components/game/MoodIndicator';
import { QuestCelebration } from '@/components/game/QuestCelebration';
import { SeasonalDecorations } from '@/components/game/SeasonalDecorations';
import { BottomNavigation, type TabId } from '@/components/navigation/BottomNavigation';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { AICoachCard } from '@/components/ai/AICoachCard';
import { CategoryGoalsCard } from '@/components/goals/CategoryGoalsCard';
import { Gamepad2 } from 'lucide-react';

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { transactions, addTransaction, deleteTransaction, celebrationData, clearCelebration } = useTransactions();
  const { quests, refetch: refetchQuests } = useQuests();
  const { badges, refetch: refetchBadges } = useBadges();
  
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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
            <LevelProgress profile={profile} />
            <StatsCards profile={profile} />
            <AICoachCard />
            <CategoryGoalsCard />
            <MoodIndicator />
          </div>
        );
      case 'transactions':
        return <TransactionsList transactions={transactions} onDelete={deleteTransaction} />;
      case 'quests':
        return <QuestsPanel quests={quests} />;
      case 'badges':
        return <BadgesGrid badges={badges} />;
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
    </div>
  );
};

export default Index;
