import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Gauge, MousePointer2, Timer, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays } from 'date-fns';

type VitalsSummary = {
  metric_name: string;
  avg_value: number;
  p75_value: number;
  min_value: number;
  max_value: number;
  sample_count: number;
  good_percentage: number;
};

type PageVitals = {
  page_url: string;
  avg_lcp: number | null;
  avg_fcp: number | null;
  avg_cls: number | null;
  avg_inp: number | null;
  avg_ttfb: number | null;
  sessions: number;
};

type WebVitalsData = {
  summary: VitalsSummary[] | null;
  by_page: PageVitals[] | null;
  trend: { date: string; avg_lcp: number; avg_fcp: number; avg_cls: number }[] | null;
  by_device: { device_type: string; avg_lcp: number; avg_fcp: number; avg_cls: number; samples: number }[] | null;
};

const metricConfig: Record<string, { 
  icon: typeof Activity; 
  unit: string; 
  goodThreshold: number; 
  poorThreshold: number;
  label: string;
}> = {
  LCP: { icon: Gauge, unit: 'ms', goodThreshold: 2500, poorThreshold: 4000, label: 'Largest Contentful Paint' },
  FCP: { icon: Zap, unit: 'ms', goodThreshold: 1800, poorThreshold: 3000, label: 'First Contentful Paint' },
  CLS: { icon: Activity, unit: '', goodThreshold: 0.1, poorThreshold: 0.25, label: 'Cumulative Layout Shift' },
  INP: { icon: MousePointer2, unit: 'ms', goodThreshold: 200, poorThreshold: 500, label: 'Interaction to Next Paint' },
  TTFB: { icon: Timer, unit: 'ms', goodThreshold: 800, poorThreshold: 1800, label: 'Time to First Byte' },
};

const getRatingColor = (value: number, metric: string): string => {
  const config = metricConfig[metric];
  if (!config) return 'text-muted-foreground';
  
  if (value <= config.goodThreshold) return 'text-green-500';
  if (value <= config.poorThreshold) return 'text-yellow-500';
  return 'text-red-500';
};

const getRatingBadge = (percentage: number) => {
  if (percentage >= 75) return <Badge variant="default" className="bg-green-500">Good</Badge>;
  if (percentage >= 50) return <Badge variant="secondary" className="bg-yellow-500 text-black">Needs Work</Badge>;
  return <Badge variant="destructive">Poor</Badge>;
};

export const WebVitalsWidget = () => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState('7');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-web-vitals', dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(dateRange)).toISOString();
      const endDate = new Date().toISOString();

      const { data, error } = await supabase.rpc('admin_get_web_vitals_summary', {
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;
      return data as WebVitalsData;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Failed to load Web Vitals data</p>
        </CardContent>
      </Card>
    );
  }

  const summary = data?.summary || [];
  const byPage = data?.by_page || [];
  const byDevice = data?.by_device || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Web Vitals
          </CardTitle>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">24h</SelectItem>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Metrics Summary */}
        {summary.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {summary.map((metric) => {
              const config = metricConfig[metric.metric_name];
              if (!config) return null;
              const Icon = config.icon;
              
              return (
                <div key={metric.metric_name} className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Icon className="w-3.5 h-3.5" />
                    {metric.metric_name}
                  </div>
                  <div className={`text-xl font-bold ${getRatingColor(metric.avg_value, metric.metric_name)}`}>
                    {metric.metric_name === 'CLS' 
                      ? metric.avg_value.toFixed(3) 
                      : `${Math.round(metric.avg_value)}${config.unit}`
                    }
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      p75: {metric.metric_name === 'CLS' ? metric.p75_value.toFixed(3) : Math.round(metric.p75_value)}
                    </span>
                    {getRatingBadge(metric.good_percentage)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metric.sample_count} samples
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No Web Vitals data yet</p>
            <p className="text-xs mt-1">Metrics will appear as users visit the site</p>
          </div>
        )}

        {/* By Device */}
        {byDevice && byDevice.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">By Device</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {byDevice.map((device) => (
                <div key={device.device_type} className="p-2 border rounded text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium capitalize">{device.device_type}</span>
                    <span className="text-xs text-muted-foreground">{device.samples} samples</span>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className={getRatingColor(device.avg_lcp || 0, 'LCP')}>
                      LCP: {Math.round(device.avg_lcp || 0)}ms
                    </span>
                    <span className={getRatingColor(device.avg_fcp || 0, 'FCP')}>
                      FCP: {Math.round(device.avg_fcp || 0)}ms
                    </span>
                    <span className={getRatingColor(device.avg_cls || 0, 'CLS')}>
                      CLS: {(device.avg_cls || 0).toFixed(3)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* By Page */}
        {byPage && byPage.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">By Page (Top 10)</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {byPage.slice(0, 10).map((page) => (
                <div key={page.page_url} className="flex items-center justify-between p-2 border rounded text-sm">
                  <span className="font-mono text-xs truncate max-w-[150px]" title={page.page_url}>
                    {page.page_url}
                  </span>
                  <div className="flex gap-3 text-xs">
                    <span className={getRatingColor(page.avg_lcp || 0, 'LCP')}>
                      LCP: {page.avg_lcp ? `${Math.round(page.avg_lcp)}ms` : '-'}
                    </span>
                    <span className={getRatingColor(page.avg_fcp || 0, 'FCP')}>
                      FCP: {page.avg_fcp ? `${Math.round(page.avg_fcp)}ms` : '-'}
                    </span>
                    <span className={getRatingColor(page.avg_cls || 0, 'CLS')}>
                      CLS: {page.avg_cls !== null ? page.avg_cls.toFixed(3) : '-'}
                    </span>
                    <span className="text-muted-foreground">{page.sessions} sess</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
