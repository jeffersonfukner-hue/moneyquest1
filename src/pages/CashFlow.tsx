import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CashFlowChart } from '@/components/reports/CashFlowChart';
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
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { AddTransactionDialog } from '@/components/game/AddTransactionDialog';

const CashFlow = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { transactions, loading: txLoading, addTransaction } = useTransactions();
  const { wallets } = useWallets();
  const { isPremium } = useSubscription();
  const [walletFilter, setWalletFilter] = useState<string | null>(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

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
    <div className="min-h-screen bg-background pb-20">
      {/* Simple Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 h-14 px-4 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-lg text-foreground">
            {t('cashFlow.title')}
          </h1>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-4 space-y-4">
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
              <CashFlowChart 
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
      </main>

      <BottomNavigation 
        activeTab="home" 
        onTabChange={(tab) => {
          if (tab === 'home') navigate('/');
          if (tab === 'transactions') navigate('/');
          if (tab === 'quests') navigate('/');
        }}
        onAddClick={() => setShowAddTransaction(true)}
      />

      <AddTransactionDialog 
        open={showAddTransaction} 
        onOpenChange={setShowAddTransaction}
        onAdd={addTransaction}
      />
    </div>
  );
};

export default CashFlow;
