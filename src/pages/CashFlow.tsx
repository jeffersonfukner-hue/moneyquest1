import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LazyCashFlowChart } from '@/components/reports/LazyCashFlowChart';
import { PremiumCashFlowReport } from '@/components/reports/PremiumCashFlowReport';
import { PremiumCashFlowTeaser } from '@/components/reports/PremiumCashFlowTeaser';
import { WalletFilter } from '@/components/wallets/WalletFilter';
import { MonthlySavingsWidget } from '@/components/game/MonthlySavingsWidget';
import { MonthlyComparisonWidget } from '@/components/game/MonthlyComparisonWidget';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';

const CashFlow = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { transactions, loading: txLoading } = useTransactions();
  const { wallets } = useWallets();
  const { isPremium } = useSubscription();
  const [walletFilter, setWalletFilter] = useState<string | null>(null);

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

  const filteredTransactions = walletFilter
    ? transactions.filter(tx => tx.wallet_id === walletFilter)
    : transactions;

  return (
    <AppShell fullWidth>
      {/* Page Title */}
      <div className="mb-4">
        <h1 className="font-display font-bold text-xl text-foreground">
          {t('cashFlow.title')}
        </h1>
      </div>

      <div className="space-y-4">
        {isPremium ? (
          /* Premium users get full report */
          <PremiumCashFlowReport transactions={transactions} />
        ) : (
          /* Free users get basic chart + teaser */
          <>
            {/* Wallet Filter */}
            <div className="flex justify-end">
              <WalletFilter
                wallets={wallets.filter(w => w.is_active)}
                selectedWalletId={walletFilter}
                onSelect={setWalletFilter}
              />
            </div>

            {/* Main Cash Flow Chart */}
            {txLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <LazyCashFlowChart 
                transactions={transactions} 
                walletFilter={walletFilter} 
              />
            )}

            {/* Additional Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MonthlySavingsWidget transactions={filteredTransactions} />
              <MonthlyComparisonWidget transactions={filteredTransactions} />
            </div>

            {/* Premium Teaser */}
            <PremiumCashFlowTeaser />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default CashFlow;
