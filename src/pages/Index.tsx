import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { useBreakpoint } from '@/hooks/use-mobile';
import { AppShell } from '@/components/layout/AppShell';
import { Wallet } from 'lucide-react';

// Dashboard components - Financial First
import { 
  FinancialKPICards, 
  PeriodResultWidget, 
  TopCategoriesCard, 
  FinancialAlertsWidget,
  RecentTransactionsWidget,
} from '@/components/dashboard';
import { OrganizationIndexWidget } from '@/components/dashboard/OrganizationIndexWidget';
import { BalanceEvolutionChart } from '@/components/dashboard/BalanceEvolutionChart';
import { TransactionConfirmation } from '@/components/dashboard/TransactionConfirmation';

// Existing components
import { TransactionsList } from '@/components/game/TransactionsList';
import { AddTransactionDialog, SessionSummary, PrefillData } from '@/components/game/AddTransactionDialog';
import { PWAInstallCard } from '@/components/pwa/PWAInstallCard';
import { QuickTemplates } from '@/components/game/QuickTemplates';
import { SessionSummaryCard } from '@/components/game/SessionSummaryCard';
import { TrialBanner } from '@/components/trial/TrialBanner';
import { TrialExpiredDialog } from '@/components/trial/TrialExpiredDialog';
import { TransactionTemplate } from '@/hooks/useTransactionTemplates';
import { cn } from '@/lib/utils';

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const breakpoint = useBreakpoint();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { transactions, addTransaction, updateTransaction, deleteTransaction, batchUpdateWallet, batchDeleteTransactions, narrativeData, clearNarrative } = useTransactions();
  
  // Tab state for dashboard views
  type DashboardTab = 'home' | 'transactions';
  
  // Get initial tab from URL search params or location state
  const searchParams = new URLSearchParams(location.search);
  const initialTab = (searchParams.get('tab') as DashboardTab) || (location.state as any)?.tab || 'home';
  
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [duplicatePrefill, setDuplicatePrefill] = useState<PrefillData | null>(null);
  
  // Simple transaction confirmation state
  const [confirmation, setConfirmation] = useState<{
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    currency: string;
  } | null>(null);
  const lastConfirmationRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Show simple confirmation when a transaction is added
  useEffect(() => {
    if (narrativeData) {
      const confirmationId = `${narrativeData.category}-${narrativeData.amount}-${Date.now()}`;
      
      if (lastConfirmationRef.current !== confirmationId) {
        lastConfirmationRef.current = confirmationId;
        
        setConfirmation({
          type: narrativeData.eventType as 'INCOME' | 'EXPENSE',
          category: narrativeData.category || '',
          amount: narrativeData.amount || 0,
          currency: narrativeData.currency || profile?.currency || 'BRL',
        });
      }
    }
  }, [narrativeData, profile?.currency]);

  if (authLoading || profileLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Wallet className="w-8 h-8 text-primary" />
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
    <div className="space-y-4">
      {/* PWA Install Card */}
      <PWAInstallCard />
      
      {/* Trial Premium Banner */}
      <TrialBanner />
      
      {/* 1. KPIs Essenciais */}
      <FinancialKPICards />
      
      {/* 2. Resultado do Período + Mini Comparativo */}
      <PeriodResultWidget />
      
      {/* 3. Gráfico de Evolução de Saldo */}
      <BalanceEvolutionChart />
      
      {/* 4. Top Categorias */}
      <TopCategoriesCard />
      
      {/* 5. Alertas Financeiros */}
      <FinancialAlertsWidget />
      
      {/* 6. Últimas Transações */}
      <RecentTransactionsWidget transactions={transactions} limit={8} />
      
      {/* Índice de Organização - Discreto no final */}
      <OrganizationIndexWidget />
      
      {/* Transaction confirmation - simple, neutral */}
      {confirmation && (
        <TransactionConfirmation
          type={confirmation.type}
          category={confirmation.category}
          amount={confirmation.amount}
          currency={confirmation.currency}
          onDismiss={() => {
            setConfirmation(null);
            clearNarrative();
          }}
        />
      )}
      
      {/* Session summary - appears after finishing transaction session */}
      {sessionSummary && (
        <SessionSummaryCard
          {...sessionSummary}
          onDismiss={() => setSessionSummary(null)}
        />
      )}
      
      {/* Quick templates for fast transaction entry */}
      <QuickTemplates onUseTemplate={handleUseTemplate} />
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

      {/* Trial expired dialog - shown once when trial ends */}
      <TrialExpiredDialog />
    </AppShell>
  );
};

export default Index;
