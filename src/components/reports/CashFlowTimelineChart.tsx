import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ComposedChart,
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CashFlowDataPoint } from '@/hooks/useReportsAnalytics';
import { TrendingUp } from 'lucide-react';

interface CashFlowTimelineChartProps {
  data: CashFlowDataPoint[];
  onPeriodClick?: (periodStart: Date, periodEnd: Date) => void;
}

export const CashFlowTimelineChart = ({ 
  data, 
  onPeriodClick 
}: CashFlowTimelineChartProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  if (data.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Fluxo de Caixa no Tempo
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Sem dados no período selecionado.
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const point = payload[0]?.payload as CashFlowDataPoint;
    
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
            <span className={`font-bold ${point.netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {point.netFlow >= 0 ? '+' : ''}{formatCurrency(point.netFlow)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Saldo acumulado:</span>
            <span className="font-medium text-primary">{formatCurrency(point.cumulativeBalance)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Fluxo de Caixa no Tempo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
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
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Bar 
                dataKey="income" 
                name="Entradas" 
                fill="hsl(var(--chart-2))" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar 
                dataKey="expenses" 
                name="Saídas" 
                fill="hsl(var(--destructive))" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Line
                type="monotone"
                dataKey="cumulativeBalance"
                name="Saldo Acumulado"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                activeDot={{ r: 5, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Clique em um período para ver as transações detalhadas
        </p>
      </CardContent>
    </Card>
  );
};
