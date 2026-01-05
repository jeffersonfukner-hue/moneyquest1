import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, X, CheckCircle2, Gauge, Zap, MousePointer2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface WebVitalsAlertMetadata {
  metric?: string;
  value?: number;
  threshold?: number;
}

interface WebVitalsAlert {
  id: string;
  title: string;
  message: string;
  severity: string;
  created_at: string;
  metadata: WebVitalsAlertMetadata | null;
}

const metricIcons: Record<string, typeof Activity> = {
  LCP: Gauge,
  FCP: Zap,
  CLS: Activity,
  INP: MousePointer2,
};

export const WebVitalsAlerts = () => {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const { data: alerts = [], refetch } = useQuery({
    queryKey: ['admin-web-vitals-alerts'],
    queryFn: async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('notification_type', 'web_vitals_alert')
        .eq('is_read', false)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        metadata: item.metadata as WebVitalsAlertMetadata | null,
      })) as WebVitalsAlert[];
    },
    refetchInterval: 60000,
  });

  const dismissAlert = async (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
    
    // Mark as read in database
    await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', alertId);
  };

  const dismissAllAlerts = async () => {
    const alertIds = activeAlerts.map(a => a.id);
    setDismissedAlerts(prev => [...prev, ...alertIds]);
    
    // Mark all as read
    await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .in('id', alertIds);
  };

  const activeAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id));

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <Card className="border-red-500/50 bg-red-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Activity className="w-5 h-5" />
            Web Vitals Alerts
            <Badge variant="destructive" className="ml-2">
              {activeAlerts.length}
            </Badge>
          </CardTitle>
          {activeAlerts.length > 1 && (
            <Button variant="outline" size="sm" onClick={dismissAllAlerts}>
              Dismiss All
            </Button>
          )}
        </div>
        <CardDescription>Performance metrics below Google's recommended thresholds</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeAlerts.map((alert) => {
          const Icon = metricIcons[alert.metadata?.metric || ''] || AlertTriangle;
          const isError = alert.severity === 'error';
          
          return (
            <Alert 
              key={alert.id} 
              variant={isError ? 'destructive' : 'default'}
              className={isError 
                ? 'border-red-500/50 bg-red-500/10' 
                : 'border-yellow-500/50 bg-yellow-500/10'
              }
            >
              <Icon className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {alert.title}
                  {isError && <Badge variant="destructive" className="text-xs">Critical</Badge>}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => dismissAlert(alert.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertTitle>
              <AlertDescription className="text-sm">
                {alert.message}
              </AlertDescription>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
};
