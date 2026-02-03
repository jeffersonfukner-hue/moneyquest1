import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { useCurrency } from '@/contexts/CurrencyContext';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  balance: number;
}

export const BalanceEvolutionChart = () => {
  const { t } = useTranslation();
  const { transactions } = useTransactions();
  const { wallets } = useWallets();
  const { formatCurrency } = useCurrency();
  
  // Calculate current total balance
  const currentBalance = useMemo(() => {
    return wallets
      .filter(w => w.is_active)
      .reduce((sum, w) => sum + (w.current_balance || 0), 0);
  }, [wallets]);
  
  // Build chart data for last 30 days
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 29);
    
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    
    // Sort transactions by date (oldest first)
    const sortedTransactions = [...transactions]
      .filter(t => t.type === 'INCOME' || t.type === 'EXPENSE')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate balance for each day
    // We'll work backwards from current balance
    let runningBalance = currentBalance;
    
    // First, remove all transactions after today
    const futureTransactions = sortedTransactions.filter(t => 
      new Date(t.date) > today
    );
    
    for (const tx of futureTransactions) {
      if (tx.type === 'INCOME') {
        runningBalance -= tx.amount;
      } else {
        runningBalance += tx.amount;
      }
    }
    
    // Now build the data points
    const dataPoints: ChartDataPoint[] = [];
    
    // Process each day from most recent to oldest
    for (let i = days.length - 1; i >= 0; i--) {
      const day = days[i];
      const dayStr = format(day, 'yyyy-MM-dd');
      
      dataPoints.unshift({
        date: dayStr,
        dateLabel: format(day, 'dd/MM', { locale: ptBR }),
        balance: runningBalance,
      });
      
      // Subtract this day's transactions to get previous day's balance
      const dayTransactions = sortedTransactions.filter(t => 
        format(new Date(t.date), 'yyyy-MM-dd') === dayStr
      );
      
      for (const tx of dayTransactions) {
        if (tx.type === 'INCOME') {
          runningBalance -= tx.amount;
        } else {
          runningBalance += tx.amount;
        }
      }
    }
    
    return dataPoints;
  }, [transactions, currentBalance]);
  
  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return { direction: 'neutral', percentage: 0 };
    
    const firstBalance = chartData[0].balance;
    const lastBalance = chartData[chartData.length - 1].balance;
    
    if (firstBalance === 0) return { direction: 'neutral', percentage: 0 };
    
    const change = ((lastBalance - firstBalance) / Math.abs(firstBalance)) * 100;
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(change),
    };
  }, [chartData]);
  
  const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">
            {payload[0].payload.dateLabel}
          </p>
          <p className="font-semibold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('dashboard.balanceEvolution', 'Evolução do Saldo (30 dias)')}
          </CardTitle>
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trend.direction === 'up' && "text-success",
            trend.direction === 'down' && "text-destructive",
            trend.direction === 'neutral' && "text-muted-foreground"
          )}>
            <TrendIcon className="w-3 h-3" />
            <span>{trend.percentage.toFixed(1)}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                vertical={false}
              />
              <XAxis 
                dataKey="dateLabel" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                hide 
                domain={['dataMin - 100', 'dataMax + 100']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#balanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
