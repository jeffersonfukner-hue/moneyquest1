import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Share2, Users, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

interface ShareStats {
  variant: string;
  clicks: number;
}

interface ReferralStats {
  total_referrals: number;
  completed_referrals: number;
  pending_referrals: number;
}

export const ReferralConversionWidget = () => {
  const { t } = useTranslation();

  // Fetch share events from ab_test_events
  const { data: shareData, isLoading: sharesLoading } = useQuery({
    queryKey: ['admin-referral-shares'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ab_test_events')
        .select('variant, metadata, created_at')
        .eq('test_name', 'referral_share')
        .eq('event_type', 'click');

      if (error) throw error;

      // Group by variant
      const variantCounts: Record<string, number> = {};
      data?.forEach((event) => {
        const variant = event.variant || 'unknown';
        variantCounts[variant] = (variantCounts[variant] || 0) + 1;
      });

      return {
        total: data?.length || 0,
        byVariant: Object.entries(variantCounts).map(([variant, clicks]) => ({
          variant,
          clicks,
        })) as ShareStats[],
        raw: data || [],
      };
    },
  });

  // Fetch WhatsApp support clicks
  const { data: whatsappSupportData, isLoading: whatsappLoading } = useQuery({
    queryKey: ['admin-whatsapp-support-clicks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ab_test_events')
        .select('variant, created_at')
        .eq('test_name', 'whatsapp_click')
        .eq('event_type', 'click');

      if (error) throw error;

      // Group by variant
      const variantCounts: Record<string, number> = {};
      data?.forEach((event) => {
        const variant = event.variant || 'unknown';
        variantCounts[variant] = (variantCounts[variant] || 0) + 1;
      });

      return {
        total: data?.length || 0,
        byVariant: Object.entries(variantCounts).map(([variant, clicks]) => ({
          variant,
          clicks,
        })),
      };
    },
  });

  // Fetch referral stats
  const { data: referralStats, isLoading: referralsLoading } = useQuery({
    queryKey: ['admin-referral-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('status');

      if (error) throw error;

      const total = data?.length || 0;
      const completed = data?.filter((r) => r.status === 'completed').length || 0;
      const pending = data?.filter((r) => r.status === 'pending').length || 0;

      return {
        total_referrals: total,
        completed_referrals: completed,
        pending_referrals: pending,
      } as ReferralStats;
    },
  });

  const isLoading = sharesLoading || referralsLoading || whatsappLoading;

  // Calculate conversion rate
  const totalShares = shareData?.total || 0;
  const totalReferrals = referralStats?.total_referrals || 0;
  const conversionRate = totalShares > 0 ? ((totalReferrals / totalShares) * 100).toFixed(1) : '0.0';

  // Prepare chart data for share methods
  const shareMethodData = shareData?.byVariant.map((item) => ({
    name: getVariantLabel(item.variant),
    value: item.clicks,
  })) || [];

  // Funnel data
  const funnelData = [
    { name: 'Compartilhamentos', value: totalShares, fill: '#3b82f6' },
    { name: 'Cadastros', value: totalReferrals, fill: '#22c55e' },
    { name: 'Convertidos', value: referralStats?.completed_referrals || 0, fill: '#8b5cf6' },
  ];

  const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
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
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          Conversão de Compartilhamentos
        </CardTitle>
        <CardDescription>
          Análise de compartilhamentos de referral e taxa de conversão em cadastros
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Share2 className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalShares}</p>
            <p className="text-xs text-muted-foreground">Compartilhamentos</p>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <Users className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Cadastros via Referral</p>
          </div>
          <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <CheckCircle className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{referralStats?.completed_referrals || 0}</p>
            <p className="text-xs text-muted-foreground">Referrals Convertidos</p>
          </div>
          <div className="text-center p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <TrendingUp className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
            <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel Visualization */}
          <div>
            <h4 className="text-sm font-medium mb-4">Funil de Conversão</h4>
            <div className="space-y-3">
              {funnelData.map((item, index) => {
                const maxValue = Math.max(...funnelData.map(d => d.value)) || 1;
                const width = (item.value / maxValue) * 100;
                const nextItem = funnelData[index + 1];
                const dropRate = nextItem && item.value > 0 
                  ? ((item.value - nextItem.value) / item.value * 100).toFixed(1)
                  : null;

                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">{item.value}</span>
                    </div>
                    <div className="h-8 bg-muted rounded-lg overflow-hidden">
                      <div 
                        className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ 
                          width: `${Math.max(width, 5)}%`, 
                          backgroundColor: item.fill 
                        }}
                      >
                        {width > 20 && (
                          <span className="text-xs text-white font-medium">
                            {((item.value / (funnelData[0]?.value || 1)) * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                    {dropRate && (
                      <div className="flex items-center justify-center text-xs text-muted-foreground mt-1">
                        <ArrowRight className="w-3 h-3 mr-1" />
                        {dropRate}% drop-off
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Share Methods Distribution */}
          <div>
            <h4 className="text-sm font-medium mb-4">Métodos de Compartilhamento</h4>
            {shareMethodData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={shareMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {shareMethodData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} cliques`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Sem dados de compartilhamento
              </div>
            )}
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {shareMethodData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-1 text-xs">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* WhatsApp Support Clicks */}
        {whatsappSupportData && whatsappSupportData.total > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Cliques WhatsApp Suporte</h4>
            <div className="flex flex-wrap gap-3">
              {whatsappSupportData.byVariant.map((item, index) => (
                <div 
                  key={item.variant}
                  className="px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/20"
                >
                  <span className="text-sm font-medium text-foreground">{item.clicks}</span>
                  <span className="text-xs text-muted-foreground ml-2">{getVariantLabel(item.variant)}</span>
                </div>
              ))}
              <div className="px-3 py-2 bg-muted rounded-lg">
                <span className="text-sm font-medium text-foreground">{whatsappSupportData.total}</span>
                <span className="text-xs text-muted-foreground ml-2">Total</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

function getVariantLabel(variant: string): string {
  const labels: Record<string, string> = {
    'whatsapp': 'WhatsApp',
    'copy_link': 'Copiar Link',
    'native_share': 'Compartilhar Nativo',
    'copy_whatsapp_message': 'Copiar Msg WhatsApp',
    'floating_button': 'Botão Flutuante',
    'support_page': 'Página Suporte',
    'referral_share': 'Referral Share',
  };
  return labels[variant] || variant;
}
