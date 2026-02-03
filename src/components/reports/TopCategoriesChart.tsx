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
  Cell,
} from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CategoryAnalysis } from '@/hooks/useReportsAnalytics';
import { cn } from '@/lib/utils';
import { PieChart } from 'lucide-react';

interface TopCategoriesChartProps {
  data: CategoryAnalysis[];
  onCategoryClick?: (category: string) => void;
  limit?: number;
}

// Professional color palette (non-gamified)
const CATEGORY_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--muted-foreground))',
  'hsl(220, 70%, 50%)',
  'hsl(280, 60%, 50%)',
  'hsl(340, 65%, 47%)',
  'hsl(38, 92%, 50%)',
];

export const TopCategoriesChart = ({ 
  data, 
  onCategoryClick,
  limit = 10 
}: TopCategoriesChartProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  const chartData = data.slice(0, limit).map((cat, index) => ({
    ...cat,
    categoryLabel: t(`transactions.categories.${cat.category}`, cat.category),
    fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  if (chartData.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Top Categorias de Despesas
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Sem dados de despesas no período selecionado.
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const cat = payload[0]?.payload as (CategoryAnalysis & { categoryLabel: string });
    
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{cat.categoryLabel}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium">{formatCurrency(cat.total)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">% do total:</span>
            <span className="font-medium">{cat.percentage.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Transações:</span>
            <span className="font-medium">{cat.count}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Ticket médio:</span>
            <span className="font-medium">{formatCurrency(cat.avgTicket)}</span>
          </div>
          {cat.variation !== null && (
            <div className="flex justify-between gap-4 pt-1 border-t border-border/50">
              <span className="text-muted-foreground">vs período anterior:</span>
              <span className={cn(
                'font-medium',
                cat.variation > 0 ? 'text-red-500' : cat.variation < 0 ? 'text-green-500' : 'text-muted-foreground'
              )}>
                {cat.variation > 0 ? '+' : ''}{cat.variation.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <PieChart className="w-4 h-4" />
          Top {limit} Categorias de Despesas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="vertical" 
              margin={{ left: 0, right: 20, top: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                tickFormatter={(v) => formatCurrency(v)}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                type="category" 
                dataKey="categoryLabel" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                width={100}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
              <Bar 
                dataKey="total" 
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(data) => onCategoryClick?.(data.category)}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Clique em uma categoria para ver as transações detalhadas
        </p>
      </CardContent>
    </Card>
  );
};
