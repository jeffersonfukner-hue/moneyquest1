import { format } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

// Labels fixos em pt-BR para SuperAdmin
const LABELS = {
  title: 'Logs de Atividade',
  subtitle: 'Histórico de ações administrativas',
  recentActions: 'Ações Recentes',
  date: 'Data',
  action: 'Ação',
  details: 'Detalhes',
  note: 'Observação',
  noLogs: 'Nenhum log encontrado',
  log: {
    premiumGrant: 'Premium Concedido',
    premiumRevoke: 'Premium Revogado',
    blockUser: 'Usuário Bloqueado',
    unblockUser: 'Usuário Desbloqueado',
    grantBonus: 'Bônus Concedido',
    sendMessage: 'Mensagem Enviada',
  },
};

const AdminLogs = () => {
  const { logs, logsLoading } = useAdminData();

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'PREMIUM_GRANT':
        return <Badge className="bg-green-500">{LABELS.log.premiumGrant}</Badge>;
      case 'PREMIUM_REVOKE':
        return <Badge variant="secondary">{LABELS.log.premiumRevoke}</Badge>;
      case 'BLOCK_USER':
        return <Badge variant="destructive">{LABELS.log.blockUser}</Badge>;
      case 'UNBLOCK_USER':
        return <Badge className="bg-blue-500">{LABELS.log.unblockUser}</Badge>;
      case 'GRANT_BONUS':
        return <Badge className="bg-purple-500">{LABELS.log.grantBonus}</Badge>;
      case 'SEND_MESSAGE':
        return <Badge className="bg-cyan-500">{LABELS.log.sendMessage}</Badge>;
      default:
        return <Badge variant="outline">{actionType}</Badge>;
    }
  };

  if (logsLoading) {
    return (
      <AdminLayout>
        <Skeleton className="h-96" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">{LABELS.title}</h1>
          <p className="text-muted-foreground">{LABELS.subtitle}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{LABELS.recentActions}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{LABELS.date}</TableHead>
                  <TableHead>{LABELS.action}</TableHead>
                  <TableHead>{LABELS.details}</TableHead>
                  <TableHead>{LABELS.note}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action_type)}</TableCell>
                    <TableCell className="text-sm">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.note || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(!logs || logs.length === 0) && (
              <p className="text-center py-8 text-muted-foreground">{LABELS.noLogs}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;
