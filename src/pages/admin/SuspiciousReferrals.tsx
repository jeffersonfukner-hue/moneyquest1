import { useState } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FraudAnalysisWidget } from '@/components/admin/FraudAnalysisWidget';
import { IPWhitelistWidget } from '@/components/admin/IPWhitelistWidget';

const LABELS = {
  pageTitle: 'Revisão de Indicações',
  subtitle: 'Analise e aprove indicações suspeitas ou pendentes',
  refresh: 'Atualizar',
  tabs: {
    pending: 'Revisão Pendente',
    fraud: 'Análise de Fraude (IA)',
    whitelist: 'Lista de IPs Permitidos',
  },
  stats: {
    suspicious: 'Suspeitos',
    pending: 'Pendentes',
  },
  table: {
    title: 'Lista de Indicações para Análise',
    description: 'Indicações marcadas como suspeitas ou aguardando validação de transações',
    referrer: 'Indicador',
    referred: 'Indicado',
    progress: 'Progresso',
    status: 'Status',
    reason: 'Motivo',
    date: 'Data',
    actions: 'Ações',
    transactions: 'transações',
  },
  status: {
    flagged: 'Suspeito',
    awaitingValidation: 'Pendente',
  },
  empty: {
    title: 'Nenhuma indicação pendente de análise',
  },
  reason: {
    sameDevice: 'Mesmo dispositivo',
    sameIp: 'Mesmo IP (24h)',
    pending: 'Pendente de validação',
  },
  approve: {
    title: 'Aprovar Indicação',
    description: 'Isso irá remover a marcação de suspeito e processar a recompensa quando as transações estiverem validadas.',
    success: 'Indicação aprovada com sucesso',
    error: 'Erro ao aprovar indicação',
    confirm: 'Aprovar',
  },
  reject: {
    title: 'Rejeitar Indicação',
    description: 'Isso irá marcar a indicação como rejeitada. Nenhuma recompensa será concedida.',
    success: 'Indicação rejeitada',
    error: 'Erro ao rejeitar indicação',
    confirm: 'Rejeitar',
  },
  note: {
    label: 'Nota (opcional)',
    placeholder: 'Adicione uma nota sobre esta decisão...',
  },
  common: {
    cancel: 'Cancelar',
  },
};

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
  const queryClient = useQueryClient();
  const [selectedReferral, setSelectedReferral] = useState<SuspiciousReferral | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState('');

  const { data: referrals, isLoading, refetch } = useQuery({
    queryKey: ['admin-suspicious-referrals'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_suspicious_referrals');
      if (error) throw error;
      return data as SuspiciousReferral[];
    },
  });

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
      toast.success(LABELS.approve.success);
      setApproveOpen(false);
      setNote('');
    },
    onError: (error) => {
      toast.error(LABELS.approve.error);
      console.error(error);
    },
  });

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
      toast.success(LABELS.reject.success);
      setRejectOpen(false);
      setNote('');
    },
    onError: (error) => {
      toast.error(LABELS.reject.error);
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
        return LABELS.reason.sameDevice;
      case 'same_ip_within_24h':
        return LABELS.reason.sameIp;
      default:
        return reason || LABELS.reason.pending;
    }
  };

  const suspiciousCount = referrals?.filter((r) => r.flagged_as_suspicious).length || 0;
  const pendingCount = referrals?.filter((r) => !r.flagged_as_suspicious && r.status === 'pending').length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              {LABELS.pageTitle}
            </h1>
            <p className="text-muted-foreground">{LABELS.subtitle}</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {LABELS.refresh}
          </Button>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              {LABELS.tabs.pending} ({suspiciousCount + pendingCount})
            </TabsTrigger>
            <TabsTrigger value="fraud-analysis">{LABELS.tabs.fraud}</TabsTrigger>
            <TabsTrigger value="whitelist">{LABELS.tabs.whitelist}</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{suspiciousCount}</p>
                      <p className="text-xs text-muted-foreground">{LABELS.stats.suspicious}</p>
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
                      <p className="text-xs text-muted-foreground">{LABELS.stats.pending}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{LABELS.table.title}</CardTitle>
                <CardDescription>{LABELS.table.description}</CardDescription>
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
                          <TableHead>{LABELS.table.referrer}</TableHead>
                          <TableHead>{LABELS.table.referred}</TableHead>
                          <TableHead>{LABELS.table.progress}</TableHead>
                          <TableHead>{LABELS.table.status}</TableHead>
                          <TableHead>{LABELS.table.reason}</TableHead>
                          <TableHead>{LABELS.table.date}</TableHead>
                          <TableHead className="text-right">{LABELS.table.actions}</TableHead>
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
                                <Progress value={Math.min((referral.transaction_count / 5) * 100, 100)} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                  {referral.transaction_count}/5 {LABELS.table.transactions}
                                </p>
                              </div>
                            </TableCell>

                            <TableCell>
                              {referral.flagged_as_suspicious ? (
                                <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                  <AlertTriangle className="h-3 w-3" />
                                  {LABELS.status.flagged}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                  <Clock className="h-3 w-3" />
                                  {LABELS.status.awaitingValidation}
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell>
                              <span className="text-sm">{getSuspicionReasonLabel(referral.suspicion_reason)}</span>
                            </TableCell>

                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(referral.created_at), 'dd/MM/yyyy', { locale: ptBR })}
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
                    <p className="text-muted-foreground">{LABELS.empty.title}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fraud-analysis">
            <FraudAnalysisWidget />
          </TabsContent>

          <TabsContent value="whitelist">
            <IPWhitelistWidget />
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {LABELS.approve.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{LABELS.approve.description}</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-4">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p>
                <strong>{LABELS.table.referrer}:</strong> {selectedReferral?.referrer_email}
              </p>
              <p>
                <strong>{LABELS.table.referred}:</strong> {selectedReferral?.referred_email}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{LABELS.note.label}</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={LABELS.note.placeholder} />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>{LABELS.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedReferral && approveMutation.mutate({ referralId: selectedReferral.id, note })}
              className="bg-green-600 hover:bg-green-700"
              disabled={approveMutation.isPending}
            >
              {LABELS.approve.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              {LABELS.reject.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{LABELS.reject.description}</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-4">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p>
                <strong>{LABELS.table.referrer}:</strong> {selectedReferral?.referrer_email}
              </p>
              <p>
                <strong>{LABELS.table.referred}:</strong> {selectedReferral?.referred_email}
              </p>
              {selectedReferral?.suspicion_reason && (
                <p>
                  <strong>{LABELS.table.reason}:</strong> {getSuspicionReasonLabel(selectedReferral.suspicion_reason)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{LABELS.note.label}</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={LABELS.note.placeholder} />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>{LABELS.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedReferral && rejectMutation.mutate({ referralId: selectedReferral.id, note })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={rejectMutation.isPending}
            >
              {LABELS.reject.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default SuspiciousReferrals;
