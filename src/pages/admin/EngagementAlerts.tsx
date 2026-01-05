import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
};

interface AtRiskUserWithEmail {
  user_id: string;
  display_name: string | null;
  email: string;
  last_active_date: string | null;
  days_inactive: number;
  risk_level: string;
}

const EngagementAlerts = () => {
  const { atRiskUsers, atRiskLoading } = useAdminData();
  const [usersWithEmail, setUsersWithEmail] = useState<AtRiskUserWithEmail[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);

  useEffect(() => {
    const fetchEmails = async () => {
      if (!atRiskUsers || atRiskUsers.length === 0) {
        setUsersWithEmail([]);
        return;
      }

      setLoadingEmails(true);
      try {
        const enriched = await Promise.all(
          atRiskUsers.map(async (user) => {
            let email = '';
            if (!user.display_name) {
              const { data } = await supabase.rpc('admin_get_user_email', {
                _user_id: user.user_id,
              });
              email = (data as string) || '';
            }
            return { ...user, email };
          })
        );
        setUsersWithEmail(enriched);
      } catch (error) {
        console.error('Error fetching emails:', error);
        setUsersWithEmail(atRiskUsers.map((u) => ({ ...u, email: '' })));
      } finally {
        setLoadingEmails(false);
      }
    };

    fetchEmails();
  }, [atRiskUsers]);

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

  const isLoading = atRiskLoading || loadingEmails;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  const highRisk = usersWithEmail?.filter((u) => u.risk_level === 'high') || [];
  const mediumRisk = usersWithEmail?.filter((u) => u.risk_level === 'medium') || [];
  const lowRisk = usersWithEmail?.filter((u) => u.risk_level === 'low') || [];

  const getUserDisplayName = (user: AtRiskUserWithEmail) => {
    if (user.display_name) return user.display_name;
    if (user.email) return user.email;
    return user.user_id.slice(0, 8) + '...';
  };

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
                {usersWithEmail?.map((user) => (
                  <div key={user.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{getUserDisplayName(user)}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.last_active_date
                          ? `${LABELS.lastSeen}: ${format(new Date(user.last_active_date), 'dd/MM/yyyy')}`
                          : LABELS.neverActive}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {user.days_inactive} {LABELS.daysInactive}
                      </span>
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
