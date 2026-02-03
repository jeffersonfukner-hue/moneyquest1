import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LazyCashFlowChart } from '@/components/reports/LazyCashFlowChart';
import { PremiumCashFlowReport } from '@/components/reports/PremiumCashFlowReport';
import { PremiumCashFlowTeaser } from '@/components/reports/PremiumCashFlowTeaser';
import { PeriodComparisonReport } from '@/components/reports/PeriodComparisonReport';
import { WalletFilter } from '@/components/wallets/WalletFilter';
import { MonthlySavingsWidget } from '@/components/game/MonthlySavingsWidget';
import { MonthlyComparisonWidget } from '@/components/game/MonthlyComparisonWidget';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, GitCompareArrows, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';

type ReportTab = 'cash-flow' | 'comparison';

/**
 * Unified Reports page with tabs for Cash Flow and Period Comparison
 */
const ReportsRouter = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { transactions, loading: txLoading } = useTransactions();
  const { wallets } = useWallets();
  const { isPremium } = useSubscription();
  const [walletFilter, setWalletFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>('cash-flow');

  useEffect(() => {
    // Handle legacy routes - redirect to /reports
    if (location.pathname === '/cash-flow') {
      navigate('/reports', { replace: true });
    } else if (location.pathname === '/period-comparison') {
      navigate('/reports?view=comparison', { replace: true });
    }

    // Check for view query param
    const searchParams = new URLSearchParams(location.search);
    const view = searchParams.get('view');
    if (view === 'comparison') {
      setActiveTab('comparison');
    }
  }, [location, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as ReportTab);
    // Update URL without full navigation
    if (value === 'comparison') {
      navigate('/reports?view=comparison', { replace: true });
    } else {
      navigate('/reports', { replace: true });
    }
  };

  const filteredTransactions = walletFilter
    ? transactions.filter(tx => tx.wallet_id === walletFilter)
    : transactions;

  return (
    <AppShell fullWidth>
      <div className="mb-4">
        <h1 className="font-display font-bold text-xl text-foreground">
          {t('sidebar.reports', 'Relatórios')}
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="cash-flow" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {t('reports.cashFlow', 'Fluxo de Caixa')}
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <GitCompareArrows className="w-4 h-4" />
            {t('reports.comparison', 'Comparativo')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cash-flow" className="space-y-4">
          {txLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <WalletFilter 
                  wallets={wallets} 
                  selectedWalletId={walletFilter} 
                  onSelect={setWalletFilter} 
                />
              </div>

              <LazyCashFlowChart transactions={filteredTransactions} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MonthlySavingsWidget transactions={filteredTransactions} />
                <MonthlyComparisonWidget transactions={filteredTransactions} />
              </div>

              {isPremium ? (
                <PremiumCashFlowReport transactions={filteredTransactions} />
              ) : (
                <PremiumCashFlowTeaser />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comparison">
          {txLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <PeriodComparisonReport transactions={transactions} />
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

export default ReportsRouter;
