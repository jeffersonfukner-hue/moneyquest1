import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, MousePointer, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Cell 
} from 'recharts';

interface ABTestEvent {
  id: string;
  test_name: string;
  variant: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface TestMetrics {
  name: string;
  impressions: number;
  clicks: number;
  ctr: number;
  color: string;
}

export const ABTestComparisonWidget = () => {
  const { t } = useTranslation();

  // Fetch all A/B test events
  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-ab-test-comparison'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ab_test_events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ABTestEvent[];
    },
  });

  // Calculate metrics for each test/variant
  const comparisonData = useMemo(() => {
    if (!events || events.length === 0) {
      return {
        bannerTests: [] as TestMetrics[],
        modalTest: null as TestMetrics | null,
        summary: {
          totalImpressions: 0,
          totalClicks: 0,
          overallCTR: 0,
        },
      };
    }

    // Ad Banner A/B Test
    const adBannerEvents = events.filter(e => e.test_name === 'ad_banner_v1');
    const adsenseEvents = adBannerEvents.filter(e => e.variant === 'adsense');
    const internalPromoEvents = adBannerEvents.filter(e => e.variant === 'internal_promo');

    const adsenseImpressions = adsenseEvents.filter(e => e.event_type === 'impression').length;
    const adsenseClicks = adsenseEvents.filter(e => e.event_type === 'click').length;
    const adsenseCTR = adsenseImpressions > 0 ? (adsenseClicks / adsenseImpressions) * 100 : 0;

    const promoImpressions = internalPromoEvents.filter(e => e.event_type === 'impression').length;
    const promoClicks = internalPromoEvents.filter(e => e.event_type === 'click').length;
    const promoCTR = promoImpressions > 0 ? (promoClicks / promoImpressions) * 100 : 0;

    const bannerTests: TestMetrics[] = [
      {
        name: t('admin.abTest.adsense'),
        impressions: adsenseImpressions,
        clicks: adsenseClicks,
        ctr: adsenseCTR,
        color: '#3b82f6',
      },
      {
        name: t('admin.abTest.internalPromo'),
        impressions: promoImpressions,
        clicks: promoClicks,
        ctr: promoCTR,
        color: '#8b5cf6',
      },
    ];

    // Premium Banner Modal
    const modalEvents = events.filter(e => e.test_name === 'premium_banner_modal_v1');
    const modalImpressions = modalEvents.filter(e => e.event_type === 'impression').length;
    const modalGoPremium = modalEvents.filter(
      e => e.event_type === 'click' && (e.metadata as Record<string, unknown>)?.action === 'go_premium'
    ).length;

    const modalTest: TestMetrics | null = modalImpressions > 0 ? {
      name: t('admin.abTest.premiumModal'),
      impressions: modalImpressions,
      clicks: modalGoPremium,
      ctr: (modalGoPremium / modalImpressions) * 100,
      color: '#22c55e',
    } : null;

    const totalImpressions = adsenseImpressions + promoImpressions + modalImpressions;
    const totalClicks = adsenseClicks + promoClicks + modalGoPremium;

    return {
      bannerTests,
      modalTest,
      summary: {
        totalImpressions,
        totalClicks,
        overallCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      },
    };
  }, [events, t]);

  // Chart data for comparison
  const chartData = useMemo(() => {
    const data: { name: string; impressions: number; clicks: number; fill: string }[] = [];
    
    comparisonData.bannerTests.forEach(test => {
      data.push({
        name: test.name,
        impressions: test.impressions,
        clicks: test.clicks,
        fill: test.color,
      });
    });

    if (comparisonData.modalTest) {
      data.push({
        name: comparisonData.modalTest.name,
        impressions: comparisonData.modalTest.impressions,
        clicks: comparisonData.modalTest.clicks,
        fill: comparisonData.modalTest.color,
      });
    }

    return data;
  }, [comparisonData]);

  // CTR comparison data
  const ctrData = useMemo(() => {
    const data: { name: string; ctr: number; fill: string }[] = [];
    
    comparisonData.bannerTests.forEach(test => {
      data.push({
        name: test.name,
        ctr: test.ctr,
        fill: test.color,
      });
    });

    if (comparisonData.modalTest) {
      data.push({
        name: comparisonData.modalTest.name,
        ctr: comparisonData.modalTest.ctr,
        fill: comparisonData.modalTest.color,
      });
    }

    return data;
  }, [comparisonData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' && entry.name.includes('CTR') 
                ? `${entry.value.toFixed(2)}%` 
                : entry.value}
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

  const allTests = [...comparisonData.bannerTests];
  if (comparisonData.modalTest) allTests.push(comparisonData.modalTest);

  // Find the best performer
  const bestPerformer = allTests.reduce((best, current) => 
    current.ctr > best.ctr ? current : best
  , allTests[0]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          {t('admin.abTest.comparisonTitle')}
        </CardTitle>
        <CardDescription>{t('admin.abTest.comparisonDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Eye className="w-5 h-5 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-foreground">{comparisonData.summary.totalImpressions}</p>
            <p className="text-xs text-muted-foreground">{t('admin.abTest.totalImpressions')}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <MousePointer className="w-5 h-5 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-foreground">{comparisonData.summary.totalClicks}</p>
            <p className="text-xs text-muted-foreground">{t('admin.abTest.totalClicks')}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">{comparisonData.summary.overallCTR.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">{t('admin.abTest.overallCTR')}</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg border border-green-500/20">
            <div className="w-5 h-5 mx-auto mb-2 rounded-full" style={{ backgroundColor: bestPerformer?.color }} />
            <p className="text-sm font-bold text-foreground">{bestPerformer?.name}</p>
            <p className="text-xs text-muted-foreground">{t('admin.abTest.bestPerformer')}</p>
          </div>
        </div>

        {/* Impressions vs Clicks Chart */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">{t('admin.abTest.impressionsVsClicks')}</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
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
                <Legend />
                <Bar dataKey="impressions" name={t('admin.abTest.impressions')} fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="clicks" name={t('admin.abTest.clicks')} fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CTR Comparison Chart */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">{t('admin.abTest.ctrComparison')}</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ctrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'CTR']}
                />
                <Bar dataKey="ctr" name="CTR" radius={[4, 4, 0, 0]}>
                  {ctrData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Individual Test Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {allTests.map((test, index) => (
            <div 
              key={index} 
              className="p-4 rounded-lg border border-border"
              style={{ borderLeftColor: test.color, borderLeftWidth: 4 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: test.color }} />
                <span className="font-medium text-foreground text-sm">{test.name}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('admin.abTest.impressions')}</span>
                  <span className="font-medium text-foreground">{test.impressions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('admin.abTest.clicks')}</span>
                  <span className="font-medium text-foreground">{test.clicks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CTR</span>
                  <Badge 
                    variant={test === bestPerformer ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {test.ctr.toFixed(2)}%
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
