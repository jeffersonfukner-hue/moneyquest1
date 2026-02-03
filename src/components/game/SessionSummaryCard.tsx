import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

export interface SessionSummary {
  transactionCount: number;
  totalExpense: number;
  totalIncome: number;
  xpGained: number; // kept for compatibility but not displayed
}

interface SessionSummaryCardProps extends SessionSummary {
  onDismiss: () => void;
}

export const SessionSummaryCard = ({
  transactionCount,
  totalExpense,
  totalIncome,
  onDismiss,
}: SessionSummaryCardProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(true);

  const AUTO_DISMISS_MS = 10000;

  // Auto-dismiss timer with progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newValue = prev - (100 / (AUTO_DISMISS_MS / 100));
        if (newValue <= 0) {
          clearInterval(interval);
          handleDismiss();
          return 0;
        }
        return newValue;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 200);
  };

  // Determine balance
  const netFlow = totalIncome - totalExpense;
  const isPositive = netFlow >= 0;

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden border animate-in slide-in-from-top-2 fade-in duration-200">
      {/* Auto-dismiss progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
        <div 
          className="h-full transition-all duration-100 bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>

      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-success" />
            {t('sessionSummary.title', 'Resumo de Lançamentos')}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold tabular-nums">{transactionCount}</p>
            <p className="text-xs text-muted-foreground">
              {transactionCount === 1 
                ? t('sessionSummary.transaction', 'Lançamento')
                : t('sessionSummary.transactions', 'Lançamentos')
              }
            </p>
          </div>
          
          {totalIncome > 0 && (
            <div className="space-y-1">
              <p className="text-lg font-semibold text-success tabular-nums flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {formatCurrency(totalIncome)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('sessionSummary.income', 'Entradas')}
              </p>
            </div>
          )}
          
          {totalExpense > 0 && (
            <div className="space-y-1">
              <p className="text-lg font-semibold text-destructive tabular-nums flex items-center justify-center gap-1">
                <TrendingDown className="w-4 h-4" />
                {formatCurrency(totalExpense)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('sessionSummary.expenses', 'Saídas')}
              </p>
            </div>
          )}
        </div>

        {/* Net result */}
        <div className={cn(
          "flex items-center justify-between p-2 rounded-lg text-sm",
          isPositive ? "bg-success/10" : "bg-destructive/10"
        )}>
          <span className="text-muted-foreground">
            {t('sessionSummary.netResult', 'Resultado líquido')}
          </span>
          <span className={cn(
            "font-semibold tabular-nums",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {isPositive ? '+' : ''}{formatCurrency(netFlow)}
          </span>
        </div>

        {/* Close button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleDismiss}
        >
          {t('sessionSummary.close', 'Fechar')}
        </Button>
      </CardContent>
    </Card>
  );
};
