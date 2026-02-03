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
import { SupplierAnalysis } from '@/hooks/useReportsAnalytics';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

interface TopSuppliersChartProps {
  data: SupplierAnalysis[];
  onSupplierClick?: (supplier: string) => void;
  limit?: number;
}

// Neutral professional colors
const SUPPLIER_COLORS = [
  'hsl(var(--primary))',
  'hsl(220, 70%, 55%)',
  'hsl(200, 65%, 50%)',
  'hsl(180, 60%, 45%)',
  'hsl(160, 55%, 45%)',
  'hsl(var(--muted-foreground))',
  'hsl(240, 60%, 55%)',
  'hsl(260, 55%, 50%)',
  'hsl(280, 50%, 50%)',
  'hsl(300, 45%, 50%)',
];

export const TopSuppliersChart = ({ 
  data, 
  onSupplierClick,
  limit = 10 
}: TopSuppliersChartProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  const chartData = data.slice(0, limit).map((sup, index) => ({
    ...sup,
    supplierLabel: sup.supplier.length > 25 ? sup.supplier.substring(0, 22) + '...' : sup.supplier,
    fill: SUPPLIER_COLORS[index % SUPPLIER_COLORS.length],
  }));

  if (chartData.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            Top Fornecedores / Destinos
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Sem dados de fornecedores no período selecionado.
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const sup = payload[0]?.payload as SupplierAnalysis;
    
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg max-w-xs">
        <p className="font-medium text-foreground mb-2 break-words">{sup.supplier}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium">{formatCurrency(sup.total)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Transações:</span>
            <span className="font-medium">{sup.count}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Ticket médio:</span>
            <span className="font-medium">{formatCurrency(sup.avgTicket)}</span>
          </div>
          {sup.variation !== null && (
            <div className="flex justify-between gap-4 pt-1 border-t border-border/50">
              <span className="text-muted-foreground">vs período anterior:</span>
              <span className={cn(
                'font-medium',
                sup.variation > 0 ? 'text-red-500' : sup.variation < 0 ? 'text-green-500' : 'text-muted-foreground'
              )}>
                {sup.variation > 0 ? '+' : ''}{sup.variation.toFixed(0)}%
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
          <Users className="w-4 h-4" />
          Top {limit} Fornecedores / Destinos
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
                dataKey="supplierLabel" 
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
                onClick={(data) => onSupplierClick?.(data.supplier)}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Clique em um fornecedor para ver as transações
        </p>
      </CardContent>
    </Card>
  );
};
