import { useMemo } from 'react';
import { AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useProfile } from '@/hooks/useProfile';
import { useLoans } from '@/hooks/useLoans';
import { useCurrency } from '@/contexts/CurrencyContext';

interface LoanBudgetAlertProps {
  showCard?: boolean;
}

export function LoanBudgetAlert({ showCard = true }: LoanBudgetAlertProps) {
  const { profile } = useProfile();
  const { totalParcelasMensais, activeLoans } = useLoans();
  const { formatCurrency } = useCurrency();

  // Calculate monthly income from profile or estimate from total_income
  const monthlyIncome = useMemo(() => {
    if (!profile) return 0;
    // Use average monthly income (total_income divided by months since account creation)
    const createdAt = new Date(profile.created_at);
    const now = new Date();
    const monthsActive = Math.max(1, 
      (now.getFullYear() - createdAt.getFullYear()) * 12 + 
      (now.getMonth() - createdAt.getMonth()) + 1
    );
    return profile.total_income / monthsActive;
  }, [profile]);

  // Calculate commitment percentage
  const commitmentPercentage = useMemo(() => {
    if (monthlyIncome <= 0 || totalParcelasMensais <= 0) return 0;
    return Math.min(100, (totalParcelasMensais / monthlyIncome) * 100);
  }, [monthlyIncome, totalParcelasMensais]);

  // Determine status level
  const status = useMemo(() => {
    if (commitmentPercentage >= 30) return 'critical';
    if (commitmentPercentage >= 20) return 'warning';
    return 'healthy';
  }, [commitmentPercentage]);

  // If no active loans or no income data, don't show
  if (activeLoans.length === 0 || monthlyIncome <= 0) {
    return null;
  }

  const statusConfig = {
    healthy: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      progressColor: 'bg-green-500',
      title: 'Empréstimos sob controle 💪',
      message: `Parabéns! Seus empréstimos comprometem apenas ${commitmentPercentage.toFixed(0)}% da sua renda mensal. Continue assim!`,
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      progressColor: 'bg-yellow-500',
      title: 'Fique atento ao comprometimento',
      message: `Seus empréstimos comprometem ${commitmentPercentage.toFixed(0)}% da sua renda mensal. O ideal é manter esse valor abaixo de 20%.`,
    },
    critical: {
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      progressColor: 'bg-red-500',
      title: 'Comprometimento elevado',
      message: `⚠️ Seus empréstimos comprometem ${commitmentPercentage.toFixed(0)}% da sua renda mensal. Considere renegociar ou quitar algumas dívidas para recuperar sua liberdade financeira.`,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  if (!showCard) {
    // Simple inline alert version
    if (status === 'healthy') return null;
    
    return (
      <Alert className={`${config.bgColor} ${config.borderColor}`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
        <AlertTitle className={config.color}>{config.title}</AlertTitle>
        <AlertDescription className="text-sm">
          {config.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={`${config.borderColor} border`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${config.bgColor}`}>
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className={`font-medium text-sm ${config.color}`}>
                {config.title}
              </h4>
              <span className={`text-lg font-bold ${config.color}`}>
                {commitmentPercentage.toFixed(0)}%
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="mb-2">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full ${config.progressColor} transition-all duration-500`}
                  style={{ width: `${Math.min(100, commitmentPercentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0%</span>
                <span className="text-yellow-600">20%</span>
                <span className="text-red-600">30%</span>
                <span>100%</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {config.message}
            </p>

            {/* Summary */}
            <div className="flex justify-between text-xs mt-2 pt-2 border-t border-border">
              <span className="text-muted-foreground">
                Parcelas mensais: <strong>{formatCurrency(totalParcelasMensais)}</strong>
              </span>
              <span className="text-muted-foreground">
                Renda média: <strong>{formatCurrency(monthlyIncome)}</strong>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}