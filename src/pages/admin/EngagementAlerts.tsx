import { format } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Clock } from 'lucide-react';

// Labels fixos em pt-BR para SuperAdmin
const LABELS = {
  title: 'Alertas de Engajamento',
  subtitle: 'Usuários em risco de abandono',
  highRisk: 'Alto Risco',
  mediumRisk: 'Risco Médio',
  lowRisk: 'Baixo Risco',
  highDesc: 'Usuários inativos há mais de 30 dias',
  mediumDesc: 'Usuários inativos há 7-30 dias',
  lowDesc: 'Usuários inativos há 3-7 dias',
  atRiskList: 'Usuários em Risco',
  lastSeen: 'Último acesso',
  neverActive: 'Nunca acessou',
  daysInactive: 'dias inativo',
  noName: 'Sem nome',
};

const EngagementAlerts = () => {
  const { atRiskUsers, atRiskLoading } = useAdminData();

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge variant="destructive">{LABELS.highRisk}</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">{LABELS.mediumRisk}</Badge>;
      default:
        return <Badge variant="secondary">{LABELS.lowRisk}</Badge>;
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
          <h1 className="text-2xl lg:text-3xl font-display font-bold">{LABELS.title}</h1>
          <p className="text-muted-foreground">{LABELS.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {LABELS.highRisk} ({highRisk.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{LABELS.highDesc}</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-yellow-600 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {LABELS.mediumRisk} ({mediumRisk.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{LABELS.mediumDesc}</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-600 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {LABELS.lowRisk} ({lowRisk.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{LABELS.lowDesc}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{LABELS.atRiskList}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {atRiskUsers?.map(user => (
                  <div key={user.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{user.display_name || LABELS.noName}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.last_active_date 
                          ? `${LABELS.lastSeen}: ${format(new Date(user.last_active_date), 'dd/MM/yyyy')}`
                          : LABELS.neverActive
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{user.days_inactive} {LABELS.daysInactive}</span>
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
