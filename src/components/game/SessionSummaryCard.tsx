import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Trophy, Zap, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

export interface SessionSummary {
  transactionCount: number;
  totalExpense: number;
  totalIncome: number;
  xpGained: number;
}

interface SessionSummaryCardProps extends SessionSummary {
  onDismiss: () => void;
}

export const SessionSummaryCard = ({
  transactionCount,
  totalExpense,
  totalIncome,
  xpGained,
  onDismiss,
}: SessionSummaryCardProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(true);

  const AUTO_DISMISS_MS = 15000;

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
    setTimeout(onDismiss, 300);
  };

  // Determine mood based on balance
  const netFlow = totalIncome - totalExpense;
  const isPositive = netFlow >= 0;

  if (!isVisible) {
    return null;
  }

  return (
    <Card className={cn(
      "relative overflow-hidden border-2 animate-scale-in",
      isPositive ? "border-income/50 bg-income/5" : "border-expense/50 bg-expense/5"
    )}>
      {/* Auto-dismiss progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
        <div 
          className={cn(
            "h-full transition-all duration-100",
            isPositive ? "bg-income" : "bg-expense"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Trophy className={cn(
              "w-5 h-5",
              isPositive ? "text-income" : "text-expense"
            )} />
            {t('sessionSummary.title')}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mission Complete */}
        <div className="text-center py-2">
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold",
            isPositive ? "bg-income/20 text-income" : "bg-expense/20 text-expense"
          )}>
            <Target className="w-4 h-4" />
            {t('sessionSummary.missionComplete')}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {transactionCount === 1 
                ? t('sessionSummary.transactionLaunched')
                : t('sessionSummary.transactionsLaunched', { count: transactionCount })
              }
            </span>
          </div>

          {totalExpense > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('sessionSummary.totalSpent')}</span>
              <span className="font-semibold text-expense">
                {formatCurrency(totalExpense)}
              </span>
            </div>
          )}

          {totalIncome > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('sessionSummary.totalReceived')}</span>
              <span className="font-semibold text-income">
                {formatCurrency(totalIncome)}
              </span>
            </div>
          )}
        </div>

        {/* Gamified message */}
        <div className={cn(
          "p-3 rounded-lg text-sm italic text-center",
          isPositive ? "bg-income/10" : "bg-expense/10"
        )}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Zap className={cn(
              "w-4 h-4",
              isPositive ? "text-income" : "text-expense"
            )} />
            <span className="font-medium">+{xpGained} XP</span>
          </div>
          <p className="text-muted-foreground">
            {t('sessionSummary.congratsMessage', { xp: xpGained })}
          </p>
        </div>

        {/* Close button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleDismiss}
        >
          {t('sessionSummary.closeSummary')}
        </Button>
      </CardContent>
    </Card>
  );
};
