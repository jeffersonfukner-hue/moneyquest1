import { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Transaction } from '@/types/database';

const SpendingByCategoryChart = lazy(() => 
  import('./SpendingByCategoryChart').then(module => ({ default: module.SpendingByCategoryChart }))
);

interface LazySpendingByCategoryChartProps {
  transactions: Transaction[];
}

const ChartSkeleton = () => (
  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
    <CardContent className="py-4">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-44 w-full rounded-lg" />
      <div className="flex gap-2 mt-2 justify-center">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </CardContent>
  </Card>
);

export const LazySpendingByCategoryChart = ({ transactions }: LazySpendingByCategoryChartProps) => {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <SpendingByCategoryChart transactions={transactions} />
    </Suspense>
  );
};
