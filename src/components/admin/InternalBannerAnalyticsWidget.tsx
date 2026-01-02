import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Gift, Crown, MousePointer, Eye, TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';

type PeriodType = 'today' | '7days' | '30days';

interface ABTestEvent {
  id: string;
  test_name: string;
  variant: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface BannerMetrics {
  type: 'premium' | 'referral';
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionRate: number;
}

export const InternalBannerAnalyticsWidget = () => {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<PeriodType>('7days');

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

  // Fetch internal banner events from ab_test_events
  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-internal-banner-metrics', period],
    queryFn: async () => {
      const daysAgo = subDays(new Date(), periodDays[period]).toISOString();
      
      const { data, error } = await supabase
        .from('ab_test_events')
        .select('*')
        .eq('test_name', 'adBanner')
        .gte('created_at', daysAgo)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as ABTestEvent[];
    },
  });

  // Calculate metrics for Premium vs Referral banners
  const bannerMetrics = useMemo((): BannerMetrics[] => {
    if (!events || events.length === 0) return [];

    // Filter events that have metadata indicating banner type
    const premiumEvents = events.filter(e => {
      const metadata = e.metadata as Record<string, unknown> | null;
      return metadata?.bannerType === 'internal_premium' || 
             e.variant === 'internal_premium' ||
             (metadata?.action === 'upgrade_click');
    });

    const referralEvents = events.filter(e => {
      const metadata = e.metadata as Record<string, unknown> | null;
      return metadata?.bannerType === 'internal_referral' || 
             e.variant === 'internal_referral' ||
             (metadata?.action === 'share_click');
    });

    // Also count generic internal impressions and split them
    const genericInternalEvents = events.filter(e => {
      const metadata = e.metadata as Record<string, unknown> | null;
      return e.variant === 'internal_promo' || 
             (metadata?.showInternalOnly === true);
    });

    // Calculate premium metrics
    const premiumImpressions = premiumEvents.filter(e => e.event_type === 'impression').length +
      Math.floor(genericInternalEvents.filter(e => e.event_type === 'impression').length * 0.5);
    const premiumClicks = premiumEvents.filter(e => e.event_type === 'click').length +
      events.filter(e => {
        const metadata = e.metadata as Record<string, unknown> | null;
        return e.event_type === 'click' && metadata?.action === 'upgrade_click';
      }).length;
    const premiumConversions = events.filter(e => {
      const metadata = e.metadata as Record<string, unknown> | null;
      return metadata?.action === 'go_premium';
    }).length;

    // Calculate referral metrics
    const referralImpressions = referralEvents.filter(e => e.event_type === 'impression').length +
      Math.floor(genericInternalEvents.filter(e => e.event_type === 'impression').length * 0.5);
    const referralClicks = referralEvents.filter(e => e.event_type === 'click').length +
      events.filter(e => {
        const metadata = e.metadata as Record<string, unknown> | null;
        return e.event_type === 'click' && 
          (metadata?.action === 'share_click' || metadata?.action === 'referral_share');
      }).length;
    const referralConversions = events.filter(e => {
      const metadata = e.metadata as Record<string, unknown> | null;
      return metadata?.action === 'referral_shared';
    }).length;

    return [
      {
        type: 'premium',
        impressions: premiumImpressions,
        clicks: premiumClicks,
        ctr: premiumImpressions > 0 ? (premiumClicks / premiumImpressions) * 100 : 0,
        conversions: premiumConversions,
        conversionRate: premiumClicks > 0 ? (premiumConversions / premiumClicks) * 100 : 0,
      },
      {
        type: 'referral',
        impressions: referralImpressions,
        clicks: referralClicks,
        ctr: referralImpressions > 0 ? (referralClicks / referralImpressions) * 100 : 0,
        conversions: referralConversions,
        conversionRate: referralClicks > 0 ? (referralConversions / referralClicks) * 100 : 0,
      },
    ];
  }, [events]);

  // Daily trend data
  const dailyTrend = useMemo(() => {
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

      const premiumClicks = dayEvents.filter(e => {
        const metadata = e.metadata as Record<string, unknown> | null;
        return e.event_type === 'click' && 
          (metadata?.bannerType === 'internal_premium' || metadata?.action === 'upgrade_click');
      }).length;

      const referralClicks = dayEvents.filter(e => {
        const metadata = e.metadata as Record<string, unknown> | null;
        return e.event_type === 'click' && 
          (metadata?.bannerType === 'internal_referral' || metadata?.action === 'share_click');
      }).length;

      const impressions = dayEvents.filter(e => e.event_type === 'impression').length;

      return {
        date: format(day, 'dd/MM', { locale: getLocale() }),
        premium: premiumClicks,
        referral: referralClicks,
        impressions,
      };
    });
  }, [events, period, i18n.language]);

  // Overall totals
  const totals = useMemo(() => {
    const premium = bannerMetrics.find(b => b.type === 'premium');
    const referral = bannerMetrics.find(b => b.type === 'referral');

    return {
      totalImpressions: (premium?.impressions || 0) + (referral?.impressions || 0),
      totalClicks: (premium?.clicks || 0) + (referral?.clicks || 0),
      avgCtr: bannerMetrics.length > 0 
        ? bannerMetrics.reduce((sum, b) => sum + b.ctr, 0) / bannerMetrics.length 
        : 0,
      bestPerformer: (premium?.ctr || 0) > (referral?.ctr || 0) ? 'premium' : 'referral',
    };
  }, [bannerMetrics]);

  // Chart data for pie
  const pieData = useMemo(() => {
    return bannerMetrics.map(b => ({
      name: b.type === 'premium' ? 'Premium' : 'Referral',
      value: b.clicks,
      color: b.type === 'premium' ? '#8b5cf6' : '#22c55e',
    })).filter(d => d.value > 0);
  }, [bannerMetrics]);

  // CTR comparison trend
  const getCtrTrend = (current: number, previous: number) => {
    if (previous === 0) return { icon: Minus, color: 'text-muted-foreground', change: 0 };
    const change = ((current - previous) / previous) * 100;
    if (change > 0) return { icon: ArrowUpRight, color: 'text-green-500', change };
    if (change < 0) return { icon: ArrowDownRight, color: 'text-red-500', change };
    return { icon: Minus, color: 'text-muted-foreground', change: 0 };
  };

  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean; 
    payload?: Array<{ name: string; value: number; color: string }>; 
    label?: string 
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return <Skeleton className="h-[500px]" />;
  }

  const premium = bannerMetrics.find(b => b.type === 'premium');
  const referral = bannerMetrics.find(b => b.type === 'referral');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {t('admin.internalBanners.title', 'Analytics de Banners Internos')}
            </CardTitle>
            <CardDescription>
              {t('admin.internalBanners.description', 'Comparação de performance entre Premium e Referral')}
            </CardDescription>
          </div>
          
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
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Eye className="w-5 h-5 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-foreground">{totals.totalImpressions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t('admin.adMetrics.totalImpressions', 'Impressões')}</p>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <MousePointer className="w-5 h-5 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-foreground">{totals.totalClicks.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t('admin.adMetrics.totalClicks', 'Cliques')}</p>
          </div>
          <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold text-foreground">{totals.avgCtr.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">{t('admin.internalBanners.avgCtr', 'CTR Médio')}</p>
          </div>
          <div className="text-center p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
            {totals.bestPerformer === 'premium' ? (
              <Crown className="w-5 h-5 mx-auto mb-2 text-amber-500" />
            ) : (
              <Gift className="w-5 h-5 mx-auto mb-2 text-amber-500" />
            )}
            <p className="text-lg font-bold text-foreground capitalize">{totals.bestPerformer}</p>
            <p className="text-xs text-muted-foreground">{t('admin.internalBanners.bestPerformer', 'Melhor Performance')}</p>
          </div>
        </div>

        {/* Banner Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Premium Banner Card */}
          <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Crown className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Banner Premium</h4>
                <p className="text-xs text-muted-foreground">{t('admin.internalBanners.premiumDesc', 'Upgrade para Premium')}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('admin.adMetrics.impressions', 'Impressões')}</span>
                <span className="font-medium">{premium?.impressions.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('admin.adMetrics.clicks', 'Cliques')}</span>
                <span className="font-medium">{premium?.clicks.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">CTR</span>
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-600">
                  {(premium?.ctr || 0).toFixed(2)}%
                </Badge>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{t('admin.internalBanners.conversionRate', 'Taxa de Conversão')}</span>
                  <span className="text-purple-500 font-medium">{(premium?.conversionRate || 0).toFixed(1)}%</span>
                </div>
                <Progress value={premium?.conversionRate || 0} className="h-2" />
              </div>
            </div>
          </div>

          {/* Referral Banner Card */}
          <div className="p-4 rounded-lg border bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Gift className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Banner Referral</h4>
                <p className="text-xs text-muted-foreground">{t('admin.internalBanners.referralDesc', 'Programa de indicação')}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('admin.adMetrics.impressions', 'Impressões')}</span>
                <span className="font-medium">{referral?.impressions.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('admin.adMetrics.clicks', 'Cliques')}</span>
                <span className="font-medium">{referral?.clicks.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">CTR</span>
                <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                  {(referral?.ctr || 0).toFixed(2)}%
                </Badge>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{t('admin.internalBanners.conversionRate', 'Taxa de Conversão')}</span>
                  <span className="text-green-500 font-medium">{(referral?.conversionRate || 0).toFixed(1)}%</span>
                </div>
                <Progress value={referral?.conversionRate || 0} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Click Distribution Pie Chart */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">
              {t('admin.internalBanners.clickDistribution', 'Distribuição de Cliques')}
            </h4>
            <div className="h-48">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Cliques']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('common.noData', 'Sem dados')}
                </div>
              )}
            </div>
          </div>

          {/* Daily Trend Bar Chart */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">
              {t('admin.internalBanners.dailyTrend', 'Tendência Diária de Cliques')}
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="premium" 
                    name="Premium" 
                    fill="#8b5cf6" 
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="referral" 
                    name="Referral" 
                    fill="#22c55e" 
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* CTR Comparison Bar */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-4">
            {t('admin.internalBanners.ctrComparison', 'Comparação de CTR')}
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Crown className="w-4 h-4 text-purple-500" />
              <span className="text-sm w-20">Premium</span>
              <div className="flex-1">
                <Progress 
                  value={Math.min((premium?.ctr || 0) * 10, 100)} 
                  className="h-3 bg-purple-500/20 [&>div]:bg-purple-500"
                />
              </div>
              <Badge variant="outline" className="min-w-[60px] justify-center">
                {(premium?.ctr || 0).toFixed(2)}%
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Gift className="w-4 h-4 text-green-500" />
              <span className="text-sm w-20">Referral</span>
              <div className="flex-1">
                <Progress 
                  value={Math.min((referral?.ctr || 0) * 10, 100)} 
                  className="h-3 bg-green-500/20 [&>div]:bg-green-500"
                />
              </div>
              <Badge variant="outline" className="min-w-[60px] justify-center">
                {(referral?.ctr || 0).toFixed(2)}%
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
