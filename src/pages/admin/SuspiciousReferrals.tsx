import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CheckCircle, XCircle, Clock, User, Shield, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FraudAnalysisWidget } from '@/components/admin/FraudAnalysisWidget';

interface SuspiciousReferral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: string;
  flagged_as_suspicious: boolean;
  suspicion_reason: string | null;
  created_at: string;
  referrer_email: string;
  referrer_name: string;
  referred_email: string;
  referred_name: string;
  transaction_count: number;
}

const SuspiciousReferrals = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedReferral, setSelectedReferral] = useState<SuspiciousReferral | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState('');

  // Fetch suspicious referrals
  const { data: referrals, isLoading, refetch } = useQuery({
    queryKey: ['admin-suspicious-referrals'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_suspicious_referrals');
      if (error) throw error;
      return data as SuspiciousReferral[];
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ referralId, note }: { referralId: string; note: string }) => {
      const { data, error } = await supabase.rpc('admin_approve_referral', {
        p_referral_id: referralId,
        p_note: note || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suspicious-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      toast.success(t('admin.referrals.approveSuccess', 'Referral aprovado com sucesso'));
      setApproveOpen(false);
      setNote('');
    },
    onError: (error) => {
      toast.error(t('admin.referrals.approveError', 'Erro ao aprovar referral'));
      console.error(error);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ referralId, note }: { referralId: string; note: string }) => {
      const { data, error } = await supabase.rpc('admin_reject_referral', {
        p_referral_id: referralId,
        p_note: note || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suspicious-referrals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
      toast.success(t('admin.referrals.rejectSuccess', 'Referral rejeitado'));
      setRejectOpen(false);
      setNote('');
    },
    onError: (error) => {
      toast.error(t('admin.referrals.rejectError', 'Erro ao rejeitar referral'));
      console.error(error);
    },
  });

  const handleApprove = (referral: SuspiciousReferral) => {
    setSelectedReferral(referral);
    setApproveOpen(true);
  };

  const handleReject = (referral: SuspiciousReferral) => {
    setSelectedReferral(referral);
    setRejectOpen(true);
  };

  const getSuspicionReasonLabel = (reason: string | null) => {
    switch (reason) {
      case 'same_device_fingerprint':
        return t('admin.referrals.reason.sameDevice', 'Mesmo dispositivo');
      case 'same_ip_within_24h':
        return t('admin.referrals.reason.sameIp', 'Mesmo IP (24h)');
      default:
        return reason || t('admin.referrals.reason.pending', 'Pendente de validação');
    }
  };

  const suspiciousCount = referrals?.filter(r => r.flagged_as_suspicious).length || 0;
  const pendingCount = referrals?.filter(r => !r.flagged_as_suspicious && r.status === 'pending').length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              {t('admin.referrals.title', 'Revisão de Referrals')}
            </h1>
            <p className="text-muted-foreground">
              {t('admin.referrals.subtitle', 'Analise e aprove referrals suspeitos ou pendentes')}
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh', 'Atualizar')}
          </Button>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Review ({suspiciousCount + pendingCount})
            </TabsTrigger>
            <TabsTrigger value="fraud-analysis">
              AI Fraud Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{suspiciousCount}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.referrals.suspicious', 'Suspeitos')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{pendingCount}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.referrals.pending', 'Pendentes')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('admin.referrals.listTitle', 'Lista de Referrals para Análise')}
            </CardTitle>
            <CardDescription>
              {t('admin.referrals.listDescription', 'Referrals marcados como suspeitos ou aguardando validação de transações')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : referrals && referrals.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.referrals.referrer', 'Indicador')}</TableHead>
                      <TableHead>{t('admin.referrals.referred', 'Indicado')}</TableHead>
                      <TableHead>{t('admin.referrals.progress', 'Progresso')}</TableHead>
                      <TableHead>{t('admin.referrals.status', 'Status')}</TableHead>
                      <TableHead>{t('admin.referrals.reason', 'Motivo')}</TableHead>
                      <TableHead>{t('admin.referrals.date', 'Data')}</TableHead>
                      <TableHead className="text-right">{t('common.actions', 'Ações')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{referral.referrer_name}</p>
                              <p className="text-xs text-muted-foreground">{referral.referrer_email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{referral.referred_name}</p>
                              <p className="text-xs text-muted-foreground">{referral.referred_email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 min-w-[100px]">
                            <Progress 
                              value={Math.min((referral.transaction_count / 5) * 100, 100)} 
                              className="h-2" 
                            />
                            <p className="text-xs text-muted-foreground">
                              {referral.transaction_count}/5 {t('admin.referrals.transactions', 'transações')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {referral.flagged_as_suspicious ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <AlertTriangle className="h-3 w-3" />
                              {t('admin.referrals.flagged', 'Suspeito')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <Clock className="h-3 w-3" />
                              {t('admin.referrals.awaitingValidation', 'Pendente')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {getSuspicionReasonLabel(referral.suspicion_reason)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(referral.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleApprove(referral)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleReject(referral)}
                            >
                              <XCircle className="h-4 w-4" />
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
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {t('admin.referrals.noItems', 'Nenhum referral pendente de análise')}
                </p>
              </div>
            )}
          </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="fraud-analysis">
            <FraudAnalysisWidget />
          </TabsContent>
        </Tabs>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {t('admin.referrals.approveTitle', 'Aprovar Referral')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.referrals.approveDescription', 'Isso irá limpar a flag de suspeito e processar a recompensa se as transações estiverem validadas.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p><strong>{t('admin.referrals.referrer', 'Indicador')}:</strong> {selectedReferral?.referrer_email}</p>
              <p><strong>{t('admin.referrals.referred', 'Indicado')}:</strong> {selectedReferral?.referred_email}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.referrals.noteLabel', 'Nota (opcional)')}</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('admin.referrals.notePlaceholder', 'Adicione uma nota sobre esta decisão...')}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancelar')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedReferral && approveMutation.mutate({ referralId: selectedReferral.id, note })}
              className="bg-green-600 hover:bg-green-700"
              disabled={approveMutation.isPending}
            >
              {t('admin.referrals.confirmApprove', 'Aprovar')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              {t('admin.referrals.rejectTitle', 'Rejeitar Referral')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.referrals.rejectDescription', 'Isso irá marcar o referral como rejeitado. Nenhuma recompensa será concedida.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p><strong>{t('admin.referrals.referrer', 'Indicador')}:</strong> {selectedReferral?.referrer_email}</p>
              <p><strong>{t('admin.referrals.referred', 'Indicado')}:</strong> {selectedReferral?.referred_email}</p>
              {selectedReferral?.suspicion_reason && (
                <p><strong>{t('admin.referrals.reason', 'Motivo')}:</strong> {getSuspicionReasonLabel(selectedReferral.suspicion_reason)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('admin.referrals.noteLabel', 'Nota (opcional)')}</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('admin.referrals.notePlaceholder', 'Adicione uma nota sobre esta decisão...')}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancelar')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedReferral && rejectMutation.mutate({ referralId: selectedReferral.id, note })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={rejectMutation.isPending}
            >
              {t('admin.referrals.confirmReject', 'Rejeitar')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default SuspiciousReferrals;
