import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Gauge, MousePointer2, Timer, Zap, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

type TrendData = {
  date: string;
  avg_lcp: number | null;
  avg_fcp: number | null;
  avg_cls: number | null;
};

type WebVitalsData = {
  summary: VitalsSummary[] | null;
  by_page: PageVitals[] | null;
  trend: TrendData[] | null;
  by_device: { device_type: string; avg_lcp: number; avg_fcp: number; avg_cls: number; samples: number }[] | null;
};

// Google's Core Web Vitals thresholds
const thresholds = {
  LCP: { good: 2500, poor: 4000, unit: 'ms', label: 'Largest Contentful Paint' },
  FCP: { good: 1800, poor: 3000, unit: 'ms', label: 'First Contentful Paint' },
  CLS: { good: 0.1, poor: 0.25, unit: '', label: 'Cumulative Layout Shift' },
  INP: { good: 200, poor: 500, unit: 'ms', label: 'Interaction to Next Paint' },
  TTFB: { good: 800, poor: 1800, unit: 'ms', label: 'Time to First Byte' },
};

const metricIcons: Record<string, typeof Activity> = {
  LCP: Gauge,
  FCP: Zap,
  CLS: Activity,
  INP: MousePointer2,
  TTFB: Timer,
};

const getRatingColor = (value: number, metric: string): string => {
  const config = thresholds[metric as keyof typeof thresholds];
  if (!config) return 'text-muted-foreground';
  
  if (value <= config.good) return 'text-green-500';
  if (value <= config.poor) return 'text-yellow-500';
  return 'text-red-500';
};

const getRatingBadge = (percentage: number) => {
  if (percentage >= 75) return <Badge variant="default" className="bg-green-500 text-xs">Good</Badge>;
  if (percentage >= 50) return <Badge variant="secondary" className="bg-yellow-500 text-black text-xs">Needs Work</Badge>;
  return <Badge variant="destructive" className="text-xs">Poor</Badge>;
};

const isAboveThreshold = (value: number, metric: string): boolean => {
  const config = thresholds[metric as keyof typeof thresholds];
  return config ? value > config.good : false;
};

export const WebVitalsWidget = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState('7');

  const { data, isLoading, error, refetch } = useQuery({
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
    refetchInterval: 60000,
  });

  // Check alerts mutation
  const checkAlertsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('admin_check_web_vitals_alerts');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  // Check for threshold violations
  const violations = (data?.summary || []).filter(m => isAboveThreshold(m.avg_value, m.metric_name));

  // Format trend data for chart
  const trendChartData = (data?.trend || []).map(d => ({
    date: format(new Date(d.date), 'dd/MM'),
    LCP: d.avg_lcp ? Math.round(d.avg_lcp) : null,
    FCP: d.avg_fcp ? Math.round(d.avg_fcp) : null,
    CLS: d.avg_cls ? Number((d.avg_cls * 1000).toFixed(1)) : null, // Scale CLS for visibility
  }));

  const summary = data?.summary || [];
  const byPage = data?.by_page || [];
  const byDevice = data?.by_device || [];

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
            <Skeleton className="h-48 w-full" />
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Web Vitals Performance
            </CardTitle>
            <CardDescription className="mt-1">Core Web Vitals monitoring based on Google thresholds</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => checkAlertsMutation.mutate()}
              disabled={checkAlertsMutation.isPending}
            >
              {checkAlertsMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span className="ml-1 hidden sm:inline">Check Alerts</span>
            </Button>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">24h</SelectItem>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Threshold Violation Alerts */}
        {violations.length > 0 && (
          <Alert variant="destructive" className="border-yellow-500 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Performance Issues Detected</AlertTitle>
            <AlertDescription>
              {violations.map(v => {
                const config = thresholds[v.metric_name as keyof typeof thresholds];
                return (
                  <span key={v.metric_name} className="block text-sm">
                    <strong>{v.metric_name}</strong>: {v.metric_name === 'CLS' ? v.avg_value.toFixed(3) : `${Math.round(v.avg_value)}ms`} 
                    {' '}(threshold: {v.metric_name === 'CLS' ? config?.good : `${config?.good}ms`})
                  </span>
                );
              })}
            </AlertDescription>
          </Alert>
        )}

        {violations.length === 0 && summary.length > 0 && (
          <Alert className="border-green-500 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-600">All Metrics Within Thresholds</AlertTitle>
            <AlertDescription className="text-green-600/80">
              Core Web Vitals are performing well.
            </AlertDescription>
          </Alert>
        )}

        {/* Core Metrics Summary */}
        {summary.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {summary.map((metric) => {
              const config = thresholds[metric.metric_name as keyof typeof thresholds];
              if (!config) return null;
              const Icon = metricIcons[metric.metric_name] || Activity;
              const isViolation = isAboveThreshold(metric.avg_value, metric.metric_name);
              
              return (
                <div 
                  key={metric.metric_name} 
                  className={`p-3 rounded-lg space-y-1 ${isViolation ? 'bg-red-500/10 border border-red-500/30' : 'bg-muted/50'}`}
                >
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Icon className="w-3.5 h-3.5" />
                    {metric.metric_name}
                    {isViolation && <AlertTriangle className="w-3 h-3 text-red-500" />}
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
                    {metric.sample_count} samples • threshold: {metric.metric_name === 'CLS' ? config.good : `${config.good}ms`}
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

        {/* Trend Chart */}
        {trendChartData.length > 1 && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Performance Trend</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'CLS') return [(value / 1000).toFixed(3), 'CLS'];
                      return [`${value}ms`, name];
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="LCP" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                  <Line 
                    type="monotone" 
                    dataKey="FCP" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                  <Line 
                    type="monotone" 
                    dataKey="CLS" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1">
              LCP/FCP in ms • CLS scaled ×1000 for visibility
            </p>
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
              {byPage.slice(0, 10).map((page) => {
                const hasIssue = (page.avg_lcp && page.avg_lcp > 2500) || 
                                 (page.avg_cls !== null && page.avg_cls > 0.1);
                return (
                  <div 
                    key={page.page_url} 
                    className={`flex items-center justify-between p-2 border rounded text-sm ${hasIssue ? 'border-yellow-500/50 bg-yellow-500/5' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {hasIssue && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                      <span className="font-mono text-xs truncate max-w-[120px]" title={page.page_url}>
                        {page.page_url}
                      </span>
                    </div>
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
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
