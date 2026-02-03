import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { GitCompareArrows } from 'lucide-react';

interface IncomeVsExpensesChartProps {
  data: Array<{
    period: string;
    income: number;
    expenses: number;
  }>;
  onPeriodClick?: (period: string) => void;
}

export const IncomeVsExpensesChart = ({ 
  data, 
  onPeriodClick 
}: IncomeVsExpensesChartProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  if (data.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <GitCompareArrows className="w-4 h-4" />
            Entradas vs Saídas
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Sem dados no período selecionado.
        </CardContent>
      </Card>
    );
  }

  // Add net result to each data point
  const chartData = data.map(d => ({
    ...d,
    netResult: d.income - d.expenses,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const point = payload[0]?.payload;
    
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-green-500">Entradas:</span>
            <span className="font-medium">{formatCurrency(point.income)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-red-500">Saídas:</span>
            <span className="font-medium">{formatCurrency(point.expenses)}</span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t border-border/50">
            <span className="text-muted-foreground">Resultado:</span>
            <span className={`font-bold ${point.netResult >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {point.netResult >= 0 ? '+' : ''}{formatCurrency(point.netResult)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <GitCompareArrows className="w-4 h-4" />
          Entradas vs Saídas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="period" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => {
                  if (Math.abs(value) >= 1000) {
                    return `${(value / 1000).toFixed(0)}k`;
                  }
                  return value.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
              <Bar 
                dataKey="income" 
                name="Entradas" 
                fill="hsl(var(--chart-2))" 
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Bar 
                dataKey="expenses" 
                name="Saídas" 
                fill="hsl(var(--destructive))" 
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
