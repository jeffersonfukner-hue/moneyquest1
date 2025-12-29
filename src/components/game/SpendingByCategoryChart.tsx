import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Transaction, SupportedCurrency } from '@/types/database';
import { useCurrency } from '@/contexts/CurrencyContext';
import { parseDateString } from '@/lib/dateUtils';

interface SpendingByCategoryChartProps {
  transactions: Transaction[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(262, 80%, 50%)',
  'hsl(199, 89%, 48%)',
  'hsl(43, 96%, 56%)',
];

export const SpendingByCategoryChart = ({ transactions }: SpendingByCategoryChartProps) => {
  const { t } = useTranslation();
  const { formatCurrency, convertToUserCurrency } = useCurrency();

  // Filter only expenses from current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyExpenses = transactions.filter((tx) => {
    const txDate = parseDateString(tx.date);
    return (
      tx.type === 'EXPENSE' &&
      txDate.getMonth() === currentMonth &&
      txDate.getFullYear() === currentYear
    );
  });

  // Group by category with currency conversion
  const categoryTotals = monthlyExpenses.reduce((acc, tx) => {
    const category = tx.category || 'Outros';
    const convertedAmount = convertToUserCurrency(tx.amount, (tx.currency || 'BRL') as SupportedCurrency);
    acc[category] = (acc[category] || 0) + convertedAmount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Max 6 categories for readability

  if (chartData.length === 0) {
    return null;
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <PieChartIcon className="w-4 h-4" />
          {t('dashboard.spendingByCategory')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="stroke-background"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const percentage = ((data.value / total) * 100).toFixed(1);
                    return (
                      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                        <p className="text-sm font-medium text-foreground">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(data.value)} ({percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1 text-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-muted-foreground truncate max-w-[80px]">{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
