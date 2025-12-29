import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Bell, Settings, X, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface RetentionAlert {
  type: 'day1' | 'day7' | 'day30';
  severity: 'warning' | 'error';
  current: number;
  threshold: number;
}

interface RetentionData {
  alerts: RetentionAlert[];
  rates: {
    day1: number;
    day7: number;
    day30: number;
  };
  thresholds: {
    day1: number;
    day7: number;
    day30: number;
  };
}

interface ThresholdSettings {
  day1: number;
  day7: number;
  day30: number;
  enabled: boolean;
}

export const RetentionAlerts = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [data, setData] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ThresholdSettings>({
    day1: 50,
    day7: 30,
    day30: 15,
    enabled: true
  });
  const [saving, setSaving] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const fetchRetentionAlerts = async () => {
    try {
      const { data: result, error } = await supabase.rpc('admin_check_retention_alerts');
      if (error) throw error;
      
      const typedResult = result as unknown as RetentionData;
      setData(typedResult);
      
      if (typedResult?.thresholds) {
        setSettings({
          day1: typedResult.thresholds.day1 || 50,
          day7: typedResult.thresholds.day7 || 30,
          day30: typedResult.thresholds.day30 || 15,
          enabled: true
        });
      }
    } catch (error) {
      console.error('Error fetching retention alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetentionAlerts();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.rpc('admin_update_retention_thresholds', {
        _day1: settings.day1,
        _day7: settings.day7,
        _day30: settings.day30,
        _enabled: settings.enabled
      });
      
      if (error) throw error;
      
      toast({ title: t('admin.retentionAlerts.settingsSaved') });
      setSettingsOpen(false);
      fetchRetentionAlerts();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ 
        title: t('admin.retentionAlerts.settingsError'), 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const dismissAlert = (type: string) => {
    setDismissedAlerts(prev => [...prev, type]);
  };

  const activeAlerts = data?.alerts?.filter(a => !dismissedAlerts.includes(a.type)) || [];

  const getAlertLabel = (type: string) => {
    switch (type) {
      case 'day1': return t('admin.retention.day1');
      case 'day7': return t('admin.retention.day7');
      case 'day30': return t('admin.retention.day30');
      default: return type;
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-4">
      {/* Alerts Banner */}
      {activeAlerts.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <Bell className="w-5 h-5" />
                {t('admin.retentionAlerts.title')}
                <Badge variant="destructive" className="ml-2">
                  {activeAlerts.length}
                </Badge>
              </CardTitle>
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    {t('admin.retentionAlerts.configure')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('admin.retentionAlerts.settingsTitle')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enabled">{t('admin.retentionAlerts.enableAlerts')}</Label>
                      <Switch
                        id="enabled"
                        checked={settings.enabled}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="day1">{t('admin.retention.day1')} {t('admin.retentionAlerts.minThreshold')}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="day1"
                          type="number"
                          min="0"
                          max="100"
                          value={settings.day1}
                          onChange={(e) => setSettings(prev => ({ ...prev, day1: Number(e.target.value) }))}
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="day7">{t('admin.retention.day7')} {t('admin.retentionAlerts.minThreshold')}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="day7"
                          type="number"
                          min="0"
                          max="100"
                          value={settings.day7}
                          onChange={(e) => setSettings(prev => ({ ...prev, day7: Number(e.target.value) }))}
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="day30">{t('admin.retention.day30')} {t('admin.retentionAlerts.minThreshold')}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="day30"
                          type="number"
                          min="0"
                          max="100"
                          value={settings.day30}
                          onChange={(e) => setSettings(prev => ({ ...prev, day30: Number(e.target.value) }))}
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSaveSettings} disabled={saving}>
                      {saving ? t('common.saving') : t('common.save')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>{t('admin.retentionAlerts.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAlerts.map((alert) => (
              <Alert 
                key={alert.type} 
                variant={alert.severity === 'error' ? 'destructive' : 'default'}
                className={alert.severity === 'error' 
                  ? 'border-red-500/50 bg-red-500/10' 
                  : 'border-amber-500/50 bg-amber-500/10'
                }
              >
                <TrendingDown className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  <span>{getAlertLabel(alert.type)} {t('admin.retentionAlerts.belowThreshold')}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={() => dismissAlert(alert.type)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </AlertTitle>
                <AlertDescription>
                  {t('admin.retentionAlerts.currentRate')}: <strong>{alert.current}%</strong> 
                  {' '}({t('admin.retentionAlerts.threshold')}: {alert.threshold}%)
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Settings Button when no alerts */}
      {activeAlerts.length === 0 && (
        <div className="flex justify-end">
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                {t('admin.retentionAlerts.configureThresholds')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('admin.retentionAlerts.settingsTitle')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enabled2">{t('admin.retentionAlerts.enableAlerts')}</Label>
                  <Switch
                    id="enabled2"
                    checked={settings.enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day1-2">{t('admin.retention.day1')} {t('admin.retentionAlerts.minThreshold')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="day1-2"
                      type="number"
                      min="0"
                      max="100"
                      value={settings.day1}
                      onChange={(e) => setSettings(prev => ({ ...prev, day1: Number(e.target.value) }))}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day7-2">{t('admin.retention.day7')} {t('admin.retentionAlerts.minThreshold')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="day7-2"
                      type="number"
                      min="0"
                      max="100"
                      value={settings.day7}
                      onChange={(e) => setSettings(prev => ({ ...prev, day7: Number(e.target.value) }))}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day30-2">{t('admin.retention.day30')} {t('admin.retentionAlerts.minThreshold')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="day30-2"
                      type="number"
                      min="0"
                      max="100"
                      value={settings.day30}
                      onChange={(e) => setSettings(prev => ({ ...prev, day30: Number(e.target.value) }))}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving ? t('common.saving') : t('common.save')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};
