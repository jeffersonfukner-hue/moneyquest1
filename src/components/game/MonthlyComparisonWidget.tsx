import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, BarChart3, Wallet } from 'lucide-react';
import { Transaction, SupportedCurrency } from '@/types/database';
import { useCurrency } from '@/contexts/CurrencyContext';
import { parseDateString } from '@/lib/dateUtils';
import { useScheduledTransactions } from '@/hooks/useScheduledTransactions';
import { useWalletTransfers } from '@/hooks/useWalletTransfers';
import { useWallets } from '@/hooks/useWallets';

interface MonthlyComparisonWidgetProps {
  transactions: Transaction[];
}

export const MonthlyComparisonWidget = ({ transactions }: MonthlyComparisonWidgetProps) => {
  const { t } = useTranslation();
  const { formatCurrency, convertToUserCurrency } = useCurrency();
  const { scheduledTransactions } = useScheduledTransactions();
  const { transfers } = useWalletTransfers();
  const { wallets } = useWallets();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  
  // Previous month calculation
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Calculate total wallet balance (sum of all active wallets)
  const totalWalletBalance = useMemo(() => {
    return wallets
      .filter(w => w.is_active)
      .reduce((sum, w) => sum + convertToUserCurrency(w.current_balance, w.currency), 0);
  }, [wallets, convertToUserCurrency]);

  // Calculate current month income
  const currentMonthIncome = useMemo(() => {
    return transactions
      .filter((tx) => {
        const txDate = parseDateString(tx.date);
        return (
          tx.type === 'INCOME' &&
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, tx) => sum + convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency), 0);
  }, [transactions, currentMonth, currentYear, convertToUserCurrency]);

  // Calculate transfers out (money leaving accounts) for current month
  const { currentMonthTransfersOut, prevMonthTransfersOut } = useMemo(() => {
    let currentOut = 0;
    let prevOut = 0;
    
    transfers.forEach((transfer) => {
      const transferDate = parseDateString(transfer.date);
      const amount = convertToUserCurrency(transfer.amount, (transfer.currency || 'BRL') as SupportedCurrency);
      
      if (
        transferDate.getMonth() === currentMonth &&
        transferDate.getFullYear() === currentYear
      ) {
        currentOut += amount;
      } else if (
        transferDate.getMonth() === prevMonth &&
        transferDate.getFullYear() === prevYear
      ) {
        prevOut += amount;
      }
    });
    
    return { currentMonthTransfersOut: currentOut, prevMonthTransfersOut: prevOut };
  }, [transfers, currentMonth, currentYear, prevMonth, prevYear, convertToUserCurrency]);

  // Calculate scheduled expenses for the rest of current month
  const scheduledFutureExpenses = useMemo(() => {
    return scheduledTransactions
      .filter(st => {
        if (st.type !== 'EXPENSE' || !st.is_active) return false;
        const nextRun = parseDateString(st.next_run_date);
        return nextRun > today && nextRun <= lastDayOfMonth;
      })
      .reduce((sum, st) => sum + convertToUserCurrency(st.amount, (st.currency || 'BRL') as SupportedCurrency), 0);
  }, [scheduledTransactions, today, lastDayOfMonth, convertToUserCurrency]);

  // Separate past and future expenses for current month (from transactions)
  const { pastExpenses, futureTransactionExpenses } = useMemo(() => {
    let past = 0;
    let future = 0;
    
    transactions.forEach((tx) => {
      const txDate = parseDateString(tx.date);
      if (
        tx.type === 'EXPENSE' &&
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      ) {
        const amount = convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency);
        if (txDate <= today) {
          past += amount;
        } else {
          future += amount;
        }
      }
    });
    
    return { pastExpenses: past, futureTransactionExpenses: future };
  }, [transactions, currentMonth, currentYear, today, convertToUserCurrency]);

  // Future expenses = scheduled + already registered future transactions
  const futureExpenses = scheduledFutureExpenses + futureTransactionExpenses;

  // Include transfers out in total expenses
  const currentMonthExpenses = pastExpenses + futureExpenses + currentMonthTransfersOut;

  const prevMonthExpenses = useMemo(() => {
    const txExpenses = transactions
      .filter((tx) => {
        const txDate = parseDateString(tx.date);
        return (
          tx.type === 'EXPENSE' &&
          txDate.getMonth() === prevMonth &&
          txDate.getFullYear() === prevYear
        );
      })
      .reduce((sum, tx) => sum + convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency), 0);
    
    // Include transfers out in previous month expenses
    return txExpenses + prevMonthTransfersOut;
  }, [transactions, prevMonth, prevYear, convertToUserCurrency, prevMonthTransfersOut]);

  // Calculate percentage change
  const percentChange = prevMonthExpenses > 0 
    ? ((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100 
    : 0;

  const isIncrease = percentChange > 0;
  const isDecrease = percentChange < 0;
  const isStable = percentChange === 0;

  // Get month names
  const monthNames = [
    t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'),
    t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'),
    t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec')
  ];

  const currentMonthName = monthNames[currentMonth] || new Date(currentYear, currentMonth).toLocaleString('default', { month: 'short' });
  const prevMonthName = monthNames[prevMonth] || new Date(prevYear, prevMonth).toLocaleString('default', { month: 'short' });

  // Calculate bar widths for visual comparison
  const maxExpense = Math.max(currentMonthExpenses, prevMonthExpenses, 1);
  const currentMonthBarWidth = (currentMonthExpenses / maxExpense) * 100;
  const prevBarWidth = (prevMonthExpenses / maxExpense) * 100;

  // Calculate available budget (wallet balance is already the result of all past transactions)
  // So available = current balance + future income - future expenses
  const availableBudget = totalWalletBalance;
  const monthBalance = currentMonthIncome - currentMonthExpenses;

  if (currentMonthExpenses === 0 && prevMonthExpenses === 0) {
    return null;
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <BarChart3 className="w-4 h-4" />
          {t('dashboard.monthlyComparison')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Available Budget Summary */}
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">{t('dashboard.availableBudget')}</span>
          </div>
          <span className={`text-sm font-bold ${availableBudget >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(availableBudget)}
          </span>
        </div>

        {/* Income vs Expenses summary for current month */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex flex-col p-2 bg-green-500/10 rounded-lg">
            <span className="text-muted-foreground">{t('dashboard.monthlyIncome')}</span>
            <span className="font-semibold text-green-500">{formatCurrency(currentMonthIncome)}</span>
          </div>
          <div className="flex flex-col p-2 bg-red-500/10 rounded-lg">
            <span className="text-muted-foreground">{t('dashboard.monthlyExpenses')}</span>
            <span className="font-semibold text-red-500">{formatCurrency(currentMonthExpenses)}</span>
          </div>
        </div>

        {/* Change indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isIncrease && <TrendingUp className="w-5 h-5 text-red-500" />}
            {isDecrease && <TrendingDown className="w-5 h-5 text-green-500" />}
            {isStable && <Minus className="w-5 h-5 text-muted-foreground" />}
            <span className={`text-lg font-bold ${
              isIncrease ? 'text-red-500' : isDecrease ? 'text-green-500' : 'text-muted-foreground'
            }`}>
              {isIncrease ? '+' : ''}{percentChange.toFixed(0)}%
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {isIncrease ? t('dashboard.spentMore') : isDecrease ? t('dashboard.spentLess') : t('dashboard.spentSame')}
          </span>
        </div>

        {/* Bar comparison */}
        <div className="space-y-2">
          {/* Current month with past/future/transfers split */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-foreground font-medium">{currentMonthName}</span>
              <div className="flex items-center gap-1 flex-wrap justify-end">
                <span className={isIncrease ? 'text-red-500' : 'text-primary'}>
                  {formatCurrency(pastExpenses)}
                </span>
                {futureExpenses > 0 && (
                  <>
                    <span className="text-muted-foreground">+</span>
                    <span className="text-amber-500">
                      {formatCurrency(futureExpenses)}
                    </span>
                  </>
                )}
                {currentMonthTransfersOut > 0 && (
                  <>
                    <span className="text-muted-foreground">+</span>
                    <span className="text-blue-500">
                      {formatCurrency(currentMonthTransfersOut)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full flex transition-all duration-500"
                style={{ width: `${currentMonthBarWidth}%` }}
              >
                {/* Past expenses bar */}
                <div 
                  className={`h-full transition-all duration-500 ${
                    isIncrease ? 'bg-red-500' : 'bg-primary'
                  }`}
                  style={{ width: `${currentMonthExpenses > 0 ? (pastExpenses / currentMonthExpenses) * 100 : 0}%` }}
                />
                {/* Future expenses bar */}
                {futureExpenses > 0 && (
                  <div 
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${(futureExpenses / currentMonthExpenses) * 100}%` }}
                  />
                )}
                {/* Transfers out bar */}
                {currentMonthTransfersOut > 0 && (
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${(currentMonthTransfersOut / currentMonthExpenses) * 100}%` }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Previous month */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{prevMonthName}</span>
              <span className="text-muted-foreground">{formatCurrency(prevMonthExpenses)}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-muted-foreground/40 rounded-full transition-all duration-500"
                style={{ width: `${prevBarWidth}%` }}
              />
            </div>
          </div>
        </div>

        {/* Legend for expenses breakdown */}
        {(futureExpenses > 0 || currentMonthTransfersOut > 0) && (
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isIncrease ? 'bg-red-500' : 'bg-primary'}`} />
              <span>{t('dashboard.pastExpenses')}</span>
            </div>
            {futureExpenses > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{t('dashboard.futureExpenses')}</span>
              </div>
            )}
            {currentMonthTransfersOut > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>{t('dashboard.transfers')}</span>
              </div>
            )}
          </div>
        )}

        {/* Difference */}
        <div className="pt-2 border-t border-border/30 flex justify-between items-center text-xs">
          <span className="text-muted-foreground">{t('dashboard.difference')}</span>
          <span className={`font-medium ${
            isIncrease ? 'text-red-500' : isDecrease ? 'text-green-500' : 'text-muted-foreground'
          }`}>
            {isIncrease ? '+' : ''}{formatCurrency(currentMonthExpenses - prevMonthExpenses)}
          </span>
        </div>

        {/* Month balance */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">{t('dashboard.monthBalance')}</span>
          <span className={`font-medium ${monthBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {monthBalance >= 0 ? '+' : ''}{formatCurrency(monthBalance)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
