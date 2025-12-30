import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Target, Eye, MousePointer, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Cell 
} from 'recharts';

interface ABTestEvent {
  id: string;
  test_name: string;
  variant: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const ModalConversionWidget = () => {
  const { t } = useTranslation();

  // Fetch modal conversion data from ab_test_events
  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-modal-conversion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ab_test_events')
        .select('*')
        .eq('test_name', 'premium_banner_modal_v1')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ABTestEvent[];
    },
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!events || events.length === 0) {
      return {
        impressions: 0,
        goPremiumClicks: 0,
        stayFreeClicks: 0,
        conversionRate: 0,
        dismissRate: 0,
      };
    }

    const impressions = events.filter(e => e.event_type === 'impression').length;
    const goPremiumClicks = events.filter(
      e => e.event_type === 'click' && (e.metadata as Record<string, unknown>)?.action === 'go_premium'
    ).length;
    const stayFreeClicks = events.filter(
      e => e.event_type === 'click' && (e.metadata as Record<string, unknown>)?.action === 'stay_free'
    ).length;

    const conversionRate = impressions > 0 ? (goPremiumClicks / impressions) * 100 : 0;
    const dismissRate = impressions > 0 ? (stayFreeClicks / impressions) * 100 : 0;

    return {
      impressions,
      goPremiumClicks,
      stayFreeClicks,
      conversionRate,
      dismissRate,
    };
  }, [events]);

  // Chart data
  const chartData = useMemo(() => [
    { 
      name: t('admin.modal.impressions'), 
      value: metrics.impressions, 
      fill: '#3b82f6' 
    },
    { 
      name: t('admin.modal.goPremium'), 
      value: metrics.goPremiumClicks, 
      fill: '#22c55e' 
    },
    { 
      name: t('admin.modal.stayFree'), 
      value: metrics.stayFreeClicks, 
      fill: '#eab308' 
    },
  ], [metrics, t]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value} {t('admin.modal.events')}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          {t('admin.modal.title')}
        </CardTitle>
        <CardDescription>{t('admin.modal.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Eye className="w-5 h-5 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-foreground">{metrics.impressions}</p>
            <p className="text-xs text-muted-foreground">{t('admin.modal.impressions')}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <MousePointer className="w-5 h-5 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-foreground">{metrics.goPremiumClicks}</p>
            <p className="text-xs text-muted-foreground">{t('admin.modal.goPremium')}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <MousePointer className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold text-foreground">{metrics.stayFreeClicks}</p>
            <p className="text-xs text-muted-foreground">{t('admin.modal.stayFree')}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">{metrics.conversionRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">{t('admin.modal.conversionRate')}</p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Rates */}
        <div className="flex items-center justify-center gap-4">
          <Badge variant="outline" className="text-green-500 border-green-500/30">
            {t('admin.modal.conversionRate')}: {metrics.conversionRate.toFixed(1)}%
          </Badge>
          <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
            {t('admin.modal.dismissRate')}: {metrics.dismissRate.toFixed(1)}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
