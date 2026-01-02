import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Eye, MousePointer, TrendingUp, Calculator, BarChart3, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, BarChart, Bar, Cell
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';

// Estimated AdSense revenue rates (these are industry averages, adjust based on your actual data)
const ADSENSE_RATES = {
  cpmEstimate: 1.50, // Average CPM in USD for finance apps
  cpcEstimate: 0.25, // Average CPC in USD
  fillRate: 0.85,    // Estimated fill rate (85%)
};

type PeriodType = 'today' | '7days' | '30days';

interface ABTestEvent {
  id: string;
  test_name: string;
  variant: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface DailyMetrics {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  estimatedRevenue: number;
}

export const AdMetricsWidget = () => {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<PeriodType>('30days');

  const periodDays: Record<PeriodType, number> = {
    today: 0,
    '7days': 6,
    '30days': 29,
  };

  const getLocale = () => {
    switch (i18n.language) {
      case 'pt-BR': return ptBR;
      case 'es-ES': return es;
      default: return enUS;
    }
  };

  // Fetch ad-related events (from ab_test_events)
  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-ad-metrics', period],
    queryFn: async () => {
      const daysAgo = subDays(new Date(), periodDays[period]).toISOString();
      
      const { data, error } = await supabase
        .from('ab_test_events')
        .select('*')
        .in('test_name', ['ad_banner_v1', 'banner_copy_v1'])
        .gte('created_at', daysAgo)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as ABTestEvent[];
    },
  });

  // Calculate overall metrics
  const overallMetrics = useMemo(() => {
    if (!events || events.length === 0) {
      return {
        totalImpressions: 0,
        totalClicks: 0,
        ctr: 0,
        estimatedRevenueCPM: 0,
        estimatedRevenueCPC: 0,
        estimatedRevenueTotal: 0,
        fillAdjustedImpressions: 0,
      };
    }

    const impressions = events.filter(e => e.event_type === 'impression').length;
    const clicks = events.filter(e => e.event_type === 'click').length;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    
    // Apply fill rate to impressions for revenue calculation
    const fillAdjustedImpressions = impressions * ADSENSE_RATES.fillRate;
    
    // CPM revenue: (impressions / 1000) * CPM rate
    const estimatedRevenueCPM = (fillAdjustedImpressions / 1000) * ADSENSE_RATES.cpmEstimate;
    
    // CPC revenue: clicks * CPC rate
    const estimatedRevenueCPC = clicks * ADSENSE_RATES.cpcEstimate;
    
    // Total estimated revenue (use higher of the two as realistic estimate)
    const estimatedRevenueTotal = Math.max(estimatedRevenueCPM, estimatedRevenueCPC);

    return {
      totalImpressions: impressions,
      totalClicks: clicks,
      ctr,
      estimatedRevenueCPM,
      estimatedRevenueCPC,
      estimatedRevenueTotal,
      fillAdjustedImpressions,
    };
  }, [events]);

  // Calculate daily metrics for chart
  const dailyMetrics = useMemo(() => {
    if (!events || events.length === 0) return [];

    const chartDays = period === 'today' ? 1 : period === '7days' ? 7 : 14;
    const days = eachDayOfInterval({
      start: subDays(new Date(), chartDays - 1),
      end: new Date(),
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayEvents = events.filter(e => {
        const eventDate = new Date(e.created_at);
        return eventDate >= dayStart && eventDate < dayEnd;
      });

      const impressions = dayEvents.filter(e => e.event_type === 'impression').length;
      const clicks = dayEvents.filter(e => e.event_type === 'click').length;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      
      const fillAdjusted = impressions * ADSENSE_RATES.fillRate;
      const revenue = Math.max(
        (fillAdjusted / 1000) * ADSENSE_RATES.cpmEstimate,
        clicks * ADSENSE_RATES.cpcEstimate
      );

      return {
        date: format(day, 'dd/MM', { locale: getLocale() }),
        fullDate: format(day, 'PPP', { locale: getLocale() }),
        impressions,
        clicks,
        ctr,
        estimatedRevenue: revenue,
      };
    });
  }, [events, period, i18n.language]);

  // Variant performance comparison
  const variantPerformance = useMemo(() => {
    if (!events || events.length === 0) return [];

    const variants = ['adsense', 'internal_promo', 'single_line', 'two_line'];
    
    return variants.map(variant => {
      const variantEvents = events.filter(e => e.variant === variant);
      const impressions = variantEvents.filter(e => e.event_type === 'impression').length;
      const clicks = variantEvents.filter(e => e.event_type === 'click').length;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      
      const fillAdjusted = impressions * ADSENSE_RATES.fillRate;
      const revenue = Math.max(
        (fillAdjusted / 1000) * ADSENSE_RATES.cpmEstimate,
        clicks * ADSENSE_RATES.cpcEstimate
      );

      const colors: Record<string, string> = {
        adsense: '#3b82f6',
        internal_promo: '#8b5cf6',
        single_line: '#22c55e',
        two_line: '#f59e0b',
      };

      const labels: Record<string, string> = {
        adsense: 'AdSense',
        internal_promo: t('admin.adMetrics.internalPromo'),
        single_line: t('admin.adMetrics.singleLine'),
        two_line: t('admin.adMetrics.twoLine'),
      };

      return {
        variant,
        name: labels[variant] || variant,
        impressions,
        clicks,
        ctr,
        estimatedRevenue: revenue,
        color: colors[variant] || '#6b7280',
      };
    }).filter(v => v.impressions > 0); // Only show variants with data
  }, [events, t]);

  // Monthly projection
  const monthlyProjection = useMemo(() => {
    if (!dailyMetrics || dailyMetrics.length === 0) return 0;
    
    const avgDailyRevenue = dailyMetrics.reduce((sum, d) => sum + d.estimatedRevenue, 0) / dailyMetrics.length;
    return avgDailyRevenue * 30;
  }, [dailyMetrics]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean; 
    payload?: Array<{ 
      name: string; 
      value: number; 
      color: string;
      dataKey: string;
    }>; 
    label?: string 
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {
                entry.dataKey === 'estimatedRevenue' 
                  ? `$${entry.value.toFixed(2)}`
                  : entry.dataKey === 'ctr'
                    ? `${entry.value.toFixed(2)}%`
                    : entry.value
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (isLoading) {
    return <Skeleton className="h-[600px]" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              {t('admin.adMetrics.title')}
            </CardTitle>
            <CardDescription>{t('admin.adMetrics.description')}</CardDescription>
          </div>
          
          {/* Period Selector */}
          <ToggleGroup 
            type="single" 
            value={period} 
            onValueChange={(value) => value && setPeriod(value as PeriodType)}
            className="bg-muted/50 p-1 rounded-lg"
          >
            <ToggleGroupItem value="today" className="text-xs px-3">
              {t('admin.adMetrics.periodToday', 'Hoje')}
            </ToggleGroupItem>
            <ToggleGroupItem value="7days" className="text-xs px-3">
              {t('admin.adMetrics.period7Days', '7 dias')}
            </ToggleGroupItem>
            <ToggleGroupItem value="30days" className="text-xs px-3">
              {t('admin.adMetrics.period30Days', '30 dias')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Eye className="w-5 h-5 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-foreground">{overallMetrics.totalImpressions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t('admin.adMetrics.totalImpressions')}</p>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <MousePointer className="w-5 h-5 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-foreground">{overallMetrics.totalClicks.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t('admin.adMetrics.totalClicks')}</p>
          </div>
          <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold text-foreground">{overallMetrics.ctr.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">CTR</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-lg border border-amber-500/30">
            <DollarSign className="w-5 h-5 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold text-foreground">{formatCurrency(overallMetrics.estimatedRevenueTotal)}</p>
            <p className="text-xs text-muted-foreground">{t('admin.adMetrics.estimatedRevenue')}</p>
          </div>
        </div>

        {/* Monthly Projection Banner */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-lg border border-green-500/20">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-green-500" />
            <div>
              <p className="text-sm font-medium text-foreground">{t('admin.adMetrics.monthlyProjection')}</p>
              <p className="text-xs text-muted-foreground">{t('admin.adMetrics.basedOnPeriod', 'Baseado no período selecionado')}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2 bg-green-500/10 text-green-600 border-green-500/30">
            {formatCurrency(monthlyProjection)}
          </Badge>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="trend" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trend">{t('admin.adMetrics.trendTab')}</TabsTrigger>
            <TabsTrigger value="variants">{t('admin.adMetrics.variantsTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="trend" className="space-y-4">
            {/* Revenue Trend Chart */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">{t('admin.adMetrics.revenueTrend')}</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyMetrics}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `$${value.toFixed(2)}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="estimatedRevenue" 
                      name={t('admin.adMetrics.revenue')}
                      stroke="#22c55e" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Impressions & Clicks Trend */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">{t('admin.adMetrics.impressionsClicksTrend')}</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyMetrics}>
                    <defs>
                      <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="impressions" 
                      name={t('admin.adMetrics.impressions')}
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorImpressions)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="clicks" 
                      name={t('admin.adMetrics.clicks')}
                      stroke="#8b5cf6" 
                      fillOpacity={1} 
                      fill="url(#colorClicks)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="variants" className="space-y-4">
            {/* Variant Performance Comparison */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">{t('admin.adMetrics.variantPerformance')}</h4>
              {variantPerformance.length > 0 ? (
                <>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={variantPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={11}
                          width={100}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="impressions" name={t('admin.adMetrics.impressions')} radius={[0, 4, 4, 0]}>
                          {variantPerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Variant Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {variantPerformance.map((variant, index) => (
                      <div 
                        key={index} 
                        className="p-4 rounded-lg border border-border"
                        style={{ borderLeftColor: variant.color, borderLeftWidth: 4 }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: variant.color }} />
                          <span className="font-medium text-foreground text-sm">{variant.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">{t('admin.adMetrics.impressions')}</span>
                            <p className="font-medium text-foreground">{variant.impressions.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('admin.adMetrics.clicks')}</span>
                            <p className="font-medium text-foreground">{variant.clicks.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">CTR</span>
                            <p className="font-medium text-foreground">{variant.ctr.toFixed(2)}%</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('admin.adMetrics.revenue')}</span>
                            <p className="font-medium text-foreground">{formatCurrency(variant.estimatedRevenue)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t('admin.adMetrics.noVariantData')}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Revenue Breakdown */}
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <h4 className="text-sm font-medium text-foreground mb-3">{t('admin.adMetrics.revenueBreakdown')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t('admin.adMetrics.estimatedCPM')}</p>
              <p className="font-medium text-foreground">${ADSENSE_RATES.cpmEstimate.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('admin.adMetrics.estimatedCPC')}</p>
              <p className="font-medium text-foreground">${ADSENSE_RATES.cpcEstimate.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('admin.adMetrics.fillRate')}</p>
              <p className="font-medium text-foreground">{(ADSENSE_RATES.fillRate * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('admin.adMetrics.adjustedImpressions')}</p>
              <p className="font-medium text-foreground">{Math.round(overallMetrics.fillAdjustedImpressions).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Official Disclaimer */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {t('admin.adMetrics.officialDisclaimer', 'Valores estimados. Dados oficiais disponíveis no Google AdSense.')}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
