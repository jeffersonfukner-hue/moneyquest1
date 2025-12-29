import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Button } from '@/components/ui/button';
import { LogOut, Gamepad2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { transactions, addTransaction, deleteTransaction, celebrationData, clearCelebration } = useTransactions();
  const { quests, refetch: refetchQuests } = useQuests();
  const { badges, refetch: refetchBadges } = useBadges();

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
          <p className="text-muted-foreground">Loading your quest...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-xl font-bold text-gradient-primary">MoneyQuest</h1>
          </div>
          <div className="flex items-center gap-3">
            <MoodIndicator />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <LevelProgress profile={profile} />
        <StatsCards profile={profile} />
        
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <QuestsPanel quests={quests} />
            <BadgesGrid badges={badges} />
          </div>
          <TransactionsList transactions={transactions} onDelete={deleteTransaction} />
        </div>
      </main>

      <AddTransactionDialog onAdd={addTransaction} />
      
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
