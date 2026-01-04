import { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Transaction } from '@/types/database';

const CashFlowChart = lazy(() => 
  import('./CashFlowChart').then(module => ({ default: module.CashFlowChart }))
);

interface LazyCashFlowChartProps {
  transactions: Transaction[];
  walletFilter?: string | null;
}

const ChartSkeleton = () => (
  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
    <CardContent className="py-4 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      <Skeleton className="h-64 sm:h-80 w-full rounded-lg" />
    </CardContent>
  </Card>
);

export const LazyCashFlowChart = ({ transactions, walletFilter }: LazyCashFlowChartProps) => {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <CashFlowChart transactions={transactions} walletFilter={walletFilter} />
    </Suspense>
  );
};
