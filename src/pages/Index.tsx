import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { useQuests } from '@/hooks/useQuests';
import { useBadges } from '@/hooks/useBadges';
import { useDailyReward } from '@/hooks/useDailyReward';
import { useRealtimeXP } from '@/hooks/useRealtimeXP';
import { useReferralNotifications } from '@/hooks/useReferralNotifications';
import { useBreakpoint } from '@/hooks/use-mobile';
import { AppShell } from '@/components/layout/AppShell';

// Dashboard components - Financial First
import { 
  FinancialKPICards, 
  PeriodResultWidget, 
  TopCategoriesCard, 
  FinancialAlertsWidget,
  GamificationSidebar,
  RecentTransactionsWidget,
} from '@/components/dashboard';

// Existing components
import { DailyRewardBanner } from '@/components/game/DailyRewardBanner';
import { DailyRewardDialog } from '@/components/game/DailyRewardDialog';
import { TransactionsList } from '@/components/game/TransactionsList';
import { AddTransactionDialog, SessionSummary, PrefillData } from '@/components/game/AddTransactionDialog';
import { PWAInstallCard } from '@/components/pwa/PWAInstallCard';
import { QuestCelebration } from '@/components/game/QuestCelebration';
import { SeasonalDecorations } from '@/components/game/SeasonalDecorations';
import { TransactionFeedback } from '@/components/game/TransactionFeedback';
import { QuickTemplates } from '@/components/game/QuickTemplates';
import { XPNotification } from '@/components/game/XPNotification';
import { SessionSummaryCard } from '@/components/game/SessionSummaryCard';
import { TierUpgradeCelebration } from '@/components/referral/TierUpgradeCelebration';
import { TrialBanner } from '@/components/trial/TrialBanner';
import { TrialExpiredDialog } from '@/components/trial/TrialExpiredDialog';
import { getFeedbackMessage } from '@/lib/feedbackMessages';
import { TransactionTemplate } from '@/hooks/useTransactionTemplates';
import { Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const breakpoint = useBreakpoint();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const { transactions, addTransaction, updateTransaction, deleteTransaction, batchUpdateWallet, batchDeleteTransactions, celebrationData, clearCelebration, narrativeData, clearNarrative } = useTransactions();
  const { quests, refetch: refetchQuests } = useQuests();
  const { badges, refetch: refetchBadges } = useBadges();
  const { status: rewardStatus } = useDailyReward();
  const { xpChange, clearXPChange } = useRealtimeXP();
  const { tierUpgrade, clearTierUpgrade } = useReferralNotifications();
  
  // Tab state for dashboard views
  type DashboardTab = 'home' | 'transactions';
  
  // Get initial tab from URL search params or location state
  const searchParams = new URLSearchParams(location.search);
  const initialTab = (searchParams.get('tab') as DashboardTab) || (location.state as any)?.tab || 'home';
  
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [duplicatePrefill, setDuplicatePrefill] = useState<PrefillData | null>(null);
  
  // Inline feedback state
  const [inlineFeedback, setInlineFeedback] = useState<{
    message: string;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    currency: string;
    narrative?: string | null;
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
      const timer = setTimeout(() => setShowRewardDialog(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [rewardStatus?.can_claim]);

  // Show inline feedback when narrative data changes
  useEffect(() => {
    if (narrativeData) {
      const feedbackId = `${narrativeData.category}-${narrativeData.amount}-${Date.now()}`;
      
      if (lastFeedbackRef.current !== feedbackId) {
        lastFeedbackRef.current = feedbackId;
        
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
          narrative: narrativeData.narrative,
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

  // Handle duplicating a transaction
  const handleDuplicateTransaction = (transaction: typeof transactions[0]) => {
    setDuplicatePrefill({
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      currency: transaction.currency,
      wallet_id: transaction.wallet_id,
    });
    setShowAddDialog(true);
  };

  const isDesktop = breakpoint === 'desktop';

  const renderHomeContent = () => (
    <div className={cn(
      "grid gap-4",
      isDesktop ? "grid-cols-[1fr_320px]" : "grid-cols-1"
    )}>
      {/* Main Financial Column */}
      <div className="space-y-4">
        {/* PWA Install Card */}
        <PWAInstallCard />
        
        {/* Trial Premium Banner */}
        <TrialBanner />
        
        {/* Daily Reward Banner - Compact */}
        <DailyRewardBanner onClaimClick={() => setShowRewardDialog(true)} />
        
        {/* 1. KPIs Essenciais */}
        <FinancialKPICards />
        
        {/* 2. Resultado do Período */}
        <PeriodResultWidget />
        
        {/* 3. Alertas Financeiros */}
        <FinancialAlertsWidget />
        
        {/* Session summary - appears after finishing transaction session */}
        {sessionSummary && (
          <SessionSummaryCard
            {...sessionSummary}
            onDismiss={() => setSessionSummary(null)}
          />
        )}
        
        {/* Inline feedback with narrative */}
        {inlineFeedback && (
          <TransactionFeedback
            message={inlineFeedback.message}
            type={inlineFeedback.type}
            category={inlineFeedback.category}
            amount={inlineFeedback.amount}
            currency={inlineFeedback.currency}
            narrative={inlineFeedback.narrative}
            onDismiss={() => {
              setInlineFeedback(null);
              clearNarrative();
            }}
          />
        )}
        
        {/* 4. Análise de Gastos */}
        <TopCategoriesCard />
        
        {/* 5. Últimas Transações */}
        <RecentTransactionsWidget transactions={transactions} limit={8} />
        
        {/* Quick templates for fast transaction entry */}
        <QuickTemplates onUseTemplate={handleUseTemplate} />
      </div>

      {/* Sidebar Column - Gamification (Desktop only inline, mobile/tablet below) */}
      {isDesktop ? (
        <div className="space-y-4">
          <GamificationSidebar profile={profile} />
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          <GamificationSidebar profile={profile} />
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeContent();
      case 'transactions':
        return (
          <TransactionsList 
            transactions={transactions} 
            onDelete={deleteTransaction} 
            onUpdate={updateTransaction} 
            onBatchUpdateWallet={batchUpdateWallet} 
            onBatchDelete={batchDeleteTransactions} 
            onDuplicate={handleDuplicateTransaction} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <AppShell>
      <SeasonalDecorations />
      
      <div className="relative z-10 pb-4">
        {renderTabContent()}
      </div>

      <AddTransactionDialog 
        onAdd={addTransaction}
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setDuplicatePrefill(null);
          }
        }}
        onSessionComplete={(summary) => {
          if (summary.transactionCount > 0) {
            setSessionSummary(summary);
          }
        }}
        prefillData={duplicatePrefill}
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

      <DailyRewardDialog 
        open={showRewardDialog} 
        onOpenChange={(open) => {
          setShowRewardDialog(open);
          if (!open) refetchProfile();
        }}
      />

      {/* XPNotification only shows for level ups to reduce pop-up fatigue */}
      {xpChange && xpChange.levelUp && (
        <XPNotification 
          xpChange={xpChange} 
          onDismiss={() => {
            clearXPChange();
            refetchProfile();
          }} 
        />
      )}

      <TierUpgradeCelebration
        newTier={tierUpgrade}
        onClose={() => {
          clearTierUpgrade();
          refetchProfile();
          refetchBadges();
        }}
      />

      {/* Trial expired dialog - shown once when trial ends */}
      <TrialExpiredDialog />
    </AppShell>
  );
};

export default Index;
