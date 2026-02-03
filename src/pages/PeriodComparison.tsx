import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PeriodComparisonReport } from '@/components/reports/PeriodComparisonReport';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';

const PeriodComparison = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { transactions, loading: txLoading } = useTransactions();

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
    <AppShell fullWidth>
      {/* Page Title */}
      <div className="mb-4">
        <h1 className="font-display font-bold text-xl text-foreground">
          {t('periodComparison.title', 'Comparação de Períodos')}
        </h1>
      </div>

      <div>
        {txLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <PeriodComparisonReport transactions={transactions} />
        )}
      </div>
    </AppShell>
  );
};

export default PeriodComparison;
