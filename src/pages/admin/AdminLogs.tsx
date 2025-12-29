import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const AdminLogs = () => {
  const { t } = useTranslation();
  const { logs, logsLoading } = useAdminData();

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'PREMIUM_GRANT':
        return <Badge className="bg-green-500">{t('admin.log.premiumGrant')}</Badge>;
      case 'PREMIUM_REVOKE':
        return <Badge variant="secondary">{t('admin.log.premiumRevoke')}</Badge>;
      case 'BLOCK_USER':
        return <Badge variant="destructive">{t('admin.log.blockUser')}</Badge>;
      case 'UNBLOCK_USER':
        return <Badge className="bg-blue-500">{t('admin.log.unblockUser')}</Badge>;
      case 'GRANT_BONUS':
        return <Badge className="bg-purple-500">{t('admin.log.grantBonus')}</Badge>;
      case 'SEND_MESSAGE':
        return <Badge className="bg-cyan-500">{t('admin.log.sendMessage')}</Badge>;
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
          <h1 className="text-2xl lg:text-3xl font-display font-bold">{t('admin.logs.title')}</h1>
          <p className="text-muted-foreground">{t('admin.logs.subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.logs.recentActions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.logs.date')}</TableHead>
                  <TableHead>{t('admin.logs.action')}</TableHead>
                  <TableHead>{t('admin.logs.details')}</TableHead>
                  <TableHead>{t('admin.logs.note')}</TableHead>
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
              <p className="text-center py-8 text-muted-foreground">{t('admin.logs.noLogs')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;
