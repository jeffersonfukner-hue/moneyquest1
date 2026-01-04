import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Eye, MousePointer, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Cell, PieChart, Pie
} from 'recharts';

interface CampaignStats {
  campaign_id: string;
  campaign_name: string;
  campaign_type: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface CampaignAnalyticsWidgetProps {
  campaigns: Array<{
    id: string;
    name: string;
    campaign_type: string;
    is_active: boolean;
  }>;
}

export const CampaignAnalyticsWidget = ({ campaigns }: CampaignAnalyticsWidgetProps) => {
  const { t } = useTranslation();

  // Fetch campaign events
  const { data: events, isLoading } = useQuery({
    queryKey: ['campaign-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ab_test_events')
        .select('*')
        .eq('test_name', 'campaign')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Calculate stats per campaign
  const campaignStats = useMemo((): CampaignStats[] => {
    if (!events || !campaigns) return [];

    const statsMap = new Map<string, { impressions: number; clicks: number }>();
    
    events.forEach((event) => {
      const campaignId = event.variant;
      if (!statsMap.has(campaignId)) {
        statsMap.set(campaignId, { impressions: 0, clicks: 0 });
      }
      const stats = statsMap.get(campaignId)!;
      if (event.event_type === 'impression') {
        stats.impressions++;
      } else if (event.event_type === 'click') {
        stats.clicks++;
      }
    });

    return campaigns
      .map((campaign) => {
        const stats = statsMap.get(campaign.id) || { impressions: 0, clicks: 0 };
        return {
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          campaign_type: campaign.campaign_type,
          impressions: stats.impressions,
          clicks: stats.clicks,
          ctr: stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0,
        };
      })
      .filter(s => s.impressions > 0 || s.clicks > 0)
      .sort((a, b) => b.impressions - a.impressions);
  }, [events, campaigns]);

  // Totals
  const totals = useMemo(() => {
    return campaignStats.reduce(
      (acc, s) => ({
        impressions: acc.impressions + s.impressions,
        clicks: acc.clicks + s.clicks,
      }),
      { impressions: 0, clicks: 0 }
    );
  }, [campaignStats]);

  const overallCtr = totals.impressions > 0 
    ? ((totals.clicks / totals.impressions) * 100).toFixed(2) 
    : '0.00';

  // Chart data
  const chartData = campaignStats.slice(0, 10).map(s => ({
    name: s.campaign_name.length > 12 ? s.campaign_name.slice(0, 12) + '...' : s.campaign_name,
    fullName: s.campaign_name,
    impressions: s.impressions,
    clicks: s.clicks,
    ctr: s.ctr,
  }));

  // Type distribution for pie chart
  const typeDistribution = useMemo(() => {
    const typeMap = new Map<string, number>();
    campaignStats.forEach(s => {
      typeMap.set(s.campaign_type, (typeMap.get(s.campaign_type) || 0) + s.impressions);
    });
    return Array.from(typeMap.entries()).map(([type, value]) => ({
      name: type,
      value,
    }));
  }, [campaignStats]);

  const COLORS = ['#8b5cf6', '#22c55e', '#f59e0b', '#3b82f6'];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('admin.campaignAnalytics.impressions')}</span>
            </div>
            <div className="text-2xl font-bold mt-1">{totals.impressions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('admin.campaignAnalytics.clicks')}</span>
            </div>
            <div className="text-2xl font-bold mt-1">{totals.clicks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('admin.campaignAnalytics.ctrOverall')}</span>
            </div>
            <div className="text-2xl font-bold mt-1">{overallCtr}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('admin.campaignAnalytics.activeCampaigns')}</span>
            </div>
            <div className="text-2xl font-bold mt-1">{campaignStats.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Impressions & Clicks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.campaignAnalytics.performanceByCampaign')}</CardTitle>
            <CardDescription>{t('admin.campaignAnalytics.last30Days')}</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={10}
                      width={80}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload?.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                              <p className="font-medium">{data.fullName}</p>
                              <p className="text-sm">{t('admin.campaignAnalytics.impressions')}: {data.impressions}</p>
                              <p className="text-sm">{t('admin.campaignAnalytics.clicks')}: {data.clicks}</p>
                              <p className="text-sm text-primary">CTR: {data.ctr.toFixed(2)}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="impressions" fill="hsl(var(--muted-foreground))" name={t('admin.campaignAnalytics.impressions')} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="clicks" fill="hsl(var(--primary))" name={t('admin.campaignAnalytics.clicks')} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                {t('admin.campaignAnalytics.noCampaignData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.campaignAnalytics.typeDistribution')}</CardTitle>
            <CardDescription>{t('admin.campaignAnalytics.impressionsByType')}</CardDescription>
          </CardHeader>
          <CardContent>
            {typeDistribution.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {typeDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                {t('admin.campaignAnalytics.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.campaignAnalytics.breakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          {campaignStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">{t('admin.campaignAnalytics.campaign')}</th>
                    <th className="text-left py-2 px-2">{t('admin.campaignAnalytics.type')}</th>
                    <th className="text-right py-2 px-2">{t('admin.campaignAnalytics.impressions')}</th>
                    <th className="text-right py-2 px-2">{t('admin.campaignAnalytics.clicks')}</th>
                    <th className="text-right py-2 px-2">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignStats.map((stat) => (
                    <tr key={stat.campaign_id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">{stat.campaign_name}</td>
                      <td className="py-2 px-2">
                        <Badge variant="outline" className="text-xs">
                          {stat.campaign_type}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 text-right">{stat.impressions.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right">{stat.clicks.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right">
                        <span className={stat.ctr >= 2 ? 'text-green-500' : stat.ctr >= 1 ? 'text-yellow-500' : 'text-muted-foreground'}>
                          {stat.ctr.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {t('admin.campaignAnalytics.noAnalyticsYet')}
              <br />
              <span className="text-xs">{t('admin.campaignAnalytics.activateToCollect')}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
