import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Clock } from 'lucide-react';

const EngagementAlerts = () => {
  const { t } = useTranslation();
  const { atRiskUsers, atRiskLoading } = useAdminData();

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge variant="destructive">{t('admin.risk.high')}</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">{t('admin.risk.medium')}</Badge>;
      default:
        return <Badge variant="secondary">{t('admin.risk.low')}</Badge>;
    }
  };

  if (atRiskLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </AdminLayout>
    );
  }

  const highRisk = atRiskUsers?.filter(u => u.risk_level === 'high') || [];
  const mediumRisk = atRiskUsers?.filter(u => u.risk_level === 'medium') || [];
  const lowRisk = atRiskUsers?.filter(u => u.risk_level === 'low') || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">{t('admin.engagement.title')}</h1>
          <p className="text-muted-foreground">{t('admin.engagement.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {t('admin.risk.high')} ({highRisk.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t('admin.engagement.highDesc')}</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-yellow-600 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {t('admin.risk.medium')} ({mediumRisk.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t('admin.engagement.mediumDesc')}</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-600 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {t('admin.risk.low')} ({lowRisk.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t('admin.engagement.lowDesc')}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.engagement.atRiskList')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {atRiskUsers?.map(user => (
                  <div key={user.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{user.display_name || t('common.noName')}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.last_active_date 
                          ? `${t('admin.engagement.lastSeen')}: ${format(new Date(user.last_active_date), 'dd/MM/yyyy')}`
                          : t('admin.engagement.neverActive')
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{user.days_inactive} {t('admin.engagement.daysInactive')}</span>
                      {getRiskBadge(user.risk_level)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default EngagementAlerts;
