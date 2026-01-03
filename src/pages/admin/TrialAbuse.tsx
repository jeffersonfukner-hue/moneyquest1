import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Shield, 
  AlertTriangle, 
  Fingerprint, 
  User, 
  CheckCircle, 
  RefreshCw,
  Monitor,
  Globe,
  Clock,
  Eye,
  Users
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrialAbuseAttempt {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  severity: string;
  created_at: string;
  blocked_user_id: string;
  blocked_user_email: string;
  blocked_user_name: string;
  reason: string;
  fingerprint_hash: string;
  fingerprint_user_agent: string;
  fingerprint_ip: string;
  fingerprint_timezone: string;
  other_users_with_fingerprint: number;
}

interface FingerprintUser {
  user_id: string;
  email: string;
  display_name: string;
  subscription_plan: string;
  has_used_trial: boolean;
  trial_start_date: string | null;
  trial_end_date: string | null;
  created_at: string;
  fingerprint_created_at: string;
}

const TrialAbuse = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedFingerprint, setSelectedFingerprint] = useState<string | null>(null);
  const [fingerprintDialogOpen, setFingerprintDialogOpen] = useState(false);

  // Fetch trial abuse attempts
  const { data: attempts, isLoading, refetch } = useQuery({
    queryKey: ['admin-trial-abuse'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_trial_abuse_attempts');
      if (error) throw error;
      return data as TrialAbuseAttempt[];
    },
  });

  // Fetch users with specific fingerprint
  const { data: fingerprintUsers, isLoading: loadingFingerprintUsers } = useQuery({
    queryKey: ['admin-fingerprint-users', selectedFingerprint],
    queryFn: async () => {
      if (!selectedFingerprint) return [];
      const { data, error } = await supabase.rpc('admin_get_users_by_fingerprint', {
        p_fingerprint_hash: selectedFingerprint,
      });
      if (error) throw error;
      return data as FingerprintUser[];
    },
    enabled: !!selectedFingerprint,
  });

  // Mark as reviewed mutation
  const markReviewedMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('admin_mark_trial_abuse_reviewed', {
        p_notification_id: notificationId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trial-abuse'] });
      toast.success(t('admin.trialAbuse.markedReviewed', 'Marcado como revisado'));
    },
    onError: () => {
      toast.error(t('admin.trialAbuse.reviewError', 'Erro ao marcar como revisado'));
    },
  });

  const handleViewFingerprint = (fingerprintHash: string) => {
    setSelectedFingerprint(fingerprintHash);
    setFingerprintDialogOpen(true);
  };

  const truncateFingerprint = (hash: string) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 8)}...${hash.slice(-4)}`;
  };

  const totalAttempts = attempts?.length || 0;
  const uniqueFingerprints = new Set(attempts?.map(a => a.fingerprint_hash).filter(Boolean)).size;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold flex items-center gap-2">
              <Fingerprint className="h-7 w-7 text-primary" />
              {t('admin.trialAbuse.title', 'Abuso de Trial')}
            </h1>
            <p className="text-muted-foreground">
              {t('admin.trialAbuse.subtitle', 'Monitore tentativas de abuso do período trial por fingerprint')}
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh', 'Atualizar')}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalAttempts}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.trialAbuse.totalAttempts', 'Tentativas bloqueadas')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Fingerprint className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{uniqueFingerprints}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.trialAbuse.uniqueFingerprints', 'Fingerprints únicos')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attempts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('admin.trialAbuse.listTitle', 'Tentativas de Abuso Detectadas')}
            </CardTitle>
            <CardDescription>
              {t('admin.trialAbuse.listDescription', 'Usuários que tentaram criar múltiplas contas para obter trial gratuito')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : attempts && attempts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.trialAbuse.user', 'Usuário')}</TableHead>
                      <TableHead>{t('admin.trialAbuse.fingerprint', 'Fingerprint')}</TableHead>
                      <TableHead>{t('admin.trialAbuse.device', 'Dispositivo')}</TableHead>
                      <TableHead>{t('admin.trialAbuse.sharedWith', 'Compartilhado')}</TableHead>
                      <TableHead>{t('admin.trialAbuse.date', 'Data')}</TableHead>
                      <TableHead className="text-right">{t('common.actions', 'Ações')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{attempt.blocked_user_name}</p>
                              <p className="text-xs text-muted-foreground">{attempt.blocked_user_email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Fingerprint className="h-4 w-4 text-muted-foreground" />
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {truncateFingerprint(attempt.fingerprint_hash)}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Monitor className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">
                                {attempt.fingerprint_user_agent?.split(' ')[0] || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              <span>{attempt.fingerprint_timezone || 'N/A'}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {attempt.other_users_with_fingerprint > 0 ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <Users className="h-3 w-3" />
                              +{attempt.other_users_with_fingerprint} {t('admin.trialAbuse.users', 'usuários')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="w-fit">
                              {t('admin.trialAbuse.unique', 'Único')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(attempt.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewFingerprint(attempt.fingerprint_hash)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => markReviewedMutation.mutate(attempt.id)}
                              disabled={markReviewedMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {t('admin.trialAbuse.noAttempts', 'Nenhuma tentativa de abuso detectada')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fingerprint Details Dialog */}
      <Dialog open={fingerprintDialogOpen} onOpenChange={setFingerprintDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" />
              {t('admin.trialAbuse.fingerprintDetails', 'Detalhes do Fingerprint')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.trialAbuse.fingerprintDescription', 'Todos os usuários que compartilham este fingerprint')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Fingerprint Hash</p>
              <code className="text-sm font-mono break-all">{selectedFingerprint}</code>
            </div>

            <ScrollArea className="h-[300px]">
              {loadingFingerprintUsers ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : fingerprintUsers && fingerprintUsers.length > 0 ? (
                <div className="space-y-3">
                  {fingerprintUsers.map((user, index) => (
                    <Card key={user.user_id} className={index === 0 ? 'border-green-500/50' : ''}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${index === 0 ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                              <User className={`h-4 w-4 ${index === 0 ? 'text-green-500' : 'text-destructive'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{user.display_name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {index === 0 ? (
                              <Badge variant="outline" className="text-green-600 border-green-500/50">
                                {t('admin.trialAbuse.original', 'Original')}
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                {t('admin.trialAbuse.duplicate', 'Duplicado')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">{t('admin.trialAbuse.plan', 'Plano')}:</span>{' '}
                            <Badge variant="secondary" className="ml-1">
                              {user.subscription_plan}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium">{t('admin.trialAbuse.trialUsed', 'Trial usado')}:</span>{' '}
                            {user.has_used_trial ? '✅' : '❌'}
                          </div>
                          <div>
                            <span className="font-medium">{t('admin.trialAbuse.accountCreated', 'Conta criada')}:</span>{' '}
                            {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                          <div>
                            <span className="font-medium">{t('admin.trialAbuse.fingerprintDetected', 'FP detectado')}:</span>{' '}
                            {format(new Date(user.fingerprint_created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('admin.trialAbuse.noUsers', 'Nenhum usuário encontrado')}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default TrialAbuse;
