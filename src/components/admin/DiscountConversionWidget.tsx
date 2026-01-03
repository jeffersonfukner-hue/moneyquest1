import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Percent, Users, CreditCard, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DiscountStats {
  totalTrialExpired: number;
  discountOffersShown: number;
  discountOffersActive: number;
  discountOffersExpired: number;
  conversions: number;
  conversionRate: number;
}

export const DiscountConversionWidget = () => {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-discount-stats'],
    queryFn: async (): Promise<DiscountStats> => {
      // Get all profiles with trial data
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, has_used_trial, trial_end_date, discount_offer_shown, discount_offer_expires_at, subscription_plan, stripe_subscription_status');

      if (error) throw error;

      const now = new Date();

      // Users with expired trial
      const trialExpiredUsers = profiles?.filter(p => {
        if (!p.trial_end_date || !p.has_used_trial) return false;
        return new Date(p.trial_end_date) < now;
      }) || [];

      // Users who saw the discount offer
      const discountShown = trialExpiredUsers.filter(p => p.discount_offer_shown);

      // Users with active discount offer
      const activeOffers = discountShown.filter(p => {
        if (!p.discount_offer_expires_at) return false;
        return new Date(p.discount_offer_expires_at) > now;
      });

      // Users with expired discount offer
      const expiredOffers = discountShown.filter(p => {
        if (!p.discount_offer_expires_at) return true;
        return new Date(p.discount_offer_expires_at) <= now;
      });

      // Users who converted (saw discount and now have premium)
      const conversions = discountShown.filter(p => 
        p.subscription_plan === 'PREMIUM' || 
        p.stripe_subscription_status === 'active'
      );

      const conversionRate = discountShown.length > 0 
        ? (conversions.length / discountShown.length) * 100 
        : 0;

      return {
        totalTrialExpired: trialExpiredUsers.length,
        discountOffersShown: discountShown.length,
        discountOffersActive: activeOffers.length,
        discountOffersExpired: expiredOffers.length,
        conversions: conversions.length,
        conversionRate: Math.round(conversionRate * 10) / 10,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const funnelData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: t('admin.discount.trialExpired', 'Trial Expired'), value: stats.totalTrialExpired, fill: '#ef4444' },
      { name: t('admin.discount.offerShown', 'Offer Shown'), value: stats.discountOffersShown, fill: '#f59e0b' },
      { name: t('admin.discount.converted', 'Converted'), value: stats.conversions, fill: '#22c55e' },
    ];
  }, [stats, t]);

  const offerStatusData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: t('admin.discount.active', 'Active'), value: stats.discountOffersActive, fill: '#22c55e' },
      { name: t('admin.discount.expired', 'Expired'), value: stats.discountOffersExpired, fill: '#6b7280' },
      { name: t('admin.discount.notShown', 'Not Shown'), value: stats.totalTrialExpired - stats.discountOffersShown, fill: '#3b82f6' },
    ].filter(d => d.value > 0);
  }, [stats, t]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-accent" />
              {t('admin.discount.title', 'Discount Offer Analytics')}
            </CardTitle>
            <CardDescription>
              {t('admin.discount.description', 'Track conversion rates for the 30% trial expiration discount')}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
            30% OFF
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground uppercase">
                {t('admin.discount.trialExpired', 'Trial Expired')}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.totalTrialExpired || 0}</p>
          </div>
          
          <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground uppercase">
                {t('admin.discount.offerShown', 'Offer Shown')}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.discountOffersShown || 0}</p>
          </div>
          
          <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground uppercase">
                {t('admin.discount.converted', 'Converted')}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.conversions || 0}</p>
          </div>
          
          <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground uppercase">
                {t('admin.discount.conversionRate', 'Conversion Rate')}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.conversionRate || 0}%</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Conversion Funnel */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">
              {t('admin.discount.funnel', 'Conversion Funnel')}
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Offer Status Distribution */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-4">
              {t('admin.discount.offerStatus', 'Offer Status')}
            </h4>
            <div className="h-48">
              {offerStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={offerStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {offerStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  {t('common.noData', 'No data available')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Offers Alert */}
        {stats && stats.discountOffersActive > 0 && (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
            <Clock className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-medium text-foreground">
                {stats.discountOffersActive} {t('admin.discount.activeOffers', 'active discount offers')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('admin.discount.activeOffersDesc', 'Users with pending 48h discount window')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
