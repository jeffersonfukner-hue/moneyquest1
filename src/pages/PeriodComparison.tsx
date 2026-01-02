import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PeriodComparisonReport } from '@/components/reports/PeriodComparisonReport';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { AddTransactionDialog } from '@/components/game/AddTransactionDialog';

const PeriodComparison = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { transactions, loading: txLoading, addTransaction } = useTransactions();
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
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
            {t('periodComparison.title', 'Comparação de Períodos')}
          </h1>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-4">
        {txLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <PeriodComparisonReport transactions={transactions} />
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

export default PeriodComparison;
