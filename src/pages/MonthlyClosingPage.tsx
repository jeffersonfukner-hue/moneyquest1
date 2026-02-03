import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, Unlock, Calendar, CheckCircle2, AlertCircle, 
  ArrowLeft, Loader2, FileText, Clock, RefreshCw,
  ChevronRight, Shield, History
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useMonthlyClosures, ClosingChecklist, ClosureSnapshot } from '@/hooks/useMonthlyClosures';
import { useCurrency } from '@/contexts/CurrencyContext';
import { APP_ROUTES } from '@/routes/routes';
import { cn } from '@/lib/utils';

export default function MonthlyClosingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  
  const {
    closures,
    loading,
    processing,
    availableMonths,
    getClosureForMonth,
    generateChecklist,
    generateSnapshot,
    closeMonth,
    reopenMonth,
  } = useMonthlyClosures();

  const [selectedPeriod, setSelectedPeriod] = useState<{ year: number; month: number } | null>(null);
  const [checklist, setChecklist] = useState<ClosingChecklist | null>(null);
  const [snapshot, setSnapshot] = useState<ClosureSnapshot | null>(null);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  
  // Dialogs
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [closingNotes, setClosingNotes] = useState('');
  const [reopenReason, setReopenReason] = useState('');

  // Load checklist when period changes
  useEffect(() => {
    if (!selectedPeriod) {
      setChecklist(null);
      setSnapshot(null);
      return;
    }

    const load = async () => {
      setLoadingChecklist(true);
      const [checklistData, snapshotData] = await Promise.all([
        generateChecklist(selectedPeriod.year, selectedPeriod.month),
        generateSnapshot(selectedPeriod.year, selectedPeriod.month),
      ]);
      setChecklist(checklistData);
      setSnapshot(snapshotData);
      setLoadingChecklist(false);
    };

    load();
  }, [selectedPeriod, generateChecklist, generateSnapshot]);

  const handlePeriodChange = (value: string) => {
    const [year, month] = value.split('-').map(Number);
    setSelectedPeriod({ year, month });
  };

  const selectedClosure = selectedPeriod 
    ? getClosureForMonth(selectedPeriod.year, selectedPeriod.month)
    : null;

  const getStatusBadge = (status: 'open' | 'closed' | 'reopened' | undefined) => {
    switch (status) {
      case 'closed':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30"><Lock className="w-3 h-3 mr-1" /> {t('closing.status.closed', 'Fechado')}</Badge>;
      case 'reopened':
        return <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30"><Unlock className="w-3 h-3 mr-1" /> {t('closing.status.reopened', 'Reaberto')}</Badge>;
      default:
        return <Badge variant="outline"><Calendar className="w-3 h-3 mr-1" /> {t('closing.status.open', 'Aberto')}</Badge>;
    }
  };

  const handleClose = async () => {
    if (!selectedPeriod) return;
    const success = await closeMonth(selectedPeriod.year, selectedPeriod.month, closingNotes);
    if (success) {
      setCloseDialogOpen(false);
      setClosingNotes('');
    }
  };

  const handleReopen = async () => {
    if (!selectedPeriod || !reopenReason.trim()) return;
    const success = await reopenMonth(selectedPeriod.year, selectedPeriod.month, reopenReason);
    if (success) {
      setReopenDialogOpen(false);
      setReopenReason('');
    }
  };

  const checklistProgress = checklist 
    ? Math.round((checklist.items.filter(i => i.status === 'ok').length / checklist.items.length) * 100)
    : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(APP_ROUTES.REPORTS)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6" />
                {t('closing.title', 'Fechamento Mensal')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('closing.subtitle', 'Congele os dados do mês para garantir integridade')}
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('closing.selectPeriod', 'Selecionar Período')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label>{t('closing.month', 'Mês')}</Label>
                <Select
                  value={selectedPeriod ? `${selectedPeriod.year}-${selectedPeriod.month}` : ''}
                  onValueChange={handlePeriodChange}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder={t('closing.selectMonth', 'Selecione um mês...')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(({ year, month, label }) => {
                      const closure = getClosureForMonth(year, month);
                      return (
                        <SelectItem key={`${year}-${month}`} value={`${year}-${month}`}>
                          <div className="flex items-center justify-between gap-4 w-full">
                            <span className="capitalize">{label}</span>
                            {closure?.status === 'closed' && (
                              <Lock className="w-3 h-3 text-green-600" />
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedPeriod && (
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedClosure?.status)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loadingChecklist && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Content when period selected */}
        {selectedPeriod && !loadingChecklist && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Checklist Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {t('closing.checklist.title', 'Checklist de Fechamento')}
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">{checklistProgress}%</span>
                </div>
                <Progress value={checklistProgress} className="h-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                {checklist?.items.map((item) => (
                  <div 
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border",
                      item.status === 'ok' && "bg-green-500/5 border-green-500/20",
                      item.status === 'pending' && "bg-amber-500/5 border-amber-500/20",
                      item.status === 'warning' && "bg-yellow-500/5 border-yellow-500/20"
                    )}
                  >
                    {item.status === 'ok' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className={cn(
                        "w-5 h-5 shrink-0 mt-0.5",
                        item.critical ? "text-amber-600" : "text-yellow-600"
                      )} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.label}</p>
                      {item.message && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.message}</p>
                      )}
                    </div>
                    {item.actionLink && item.status !== 'ok' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(item.actionLink!)}
                      >
                        {t('closing.checklist.fix', 'Corrigir')}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                {selectedClosure?.status === 'closed' ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setReopenDialogOpen(true)}
                    disabled={processing}
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    {t('closing.reopenMonth', 'Reabrir Mês')}
                  </Button>
                ) : (
                  <Button 
                    className="w-full"
                    onClick={() => setCloseDialogOpen(true)}
                    disabled={processing || !checklist?.canClose}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {t('closing.closeMonth', 'Fechar Mês')}
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Snapshot Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {selectedClosure?.status === 'closed' 
                    ? t('closing.snapshot.title', 'Snapshot do Fechamento')
                    : t('closing.snapshot.preview', 'Prévia do Snapshot')
                  }
                </CardTitle>
                <CardDescription>
                  {selectedClosure?.status === 'closed' 
                    ? t('closing.snapshot.closedAt', 'Fechado em {{date}}', { 
                        date: new Date(selectedClosure.closedAt!).toLocaleDateString('pt-BR', { 
                          dateStyle: 'long' 
                        }) 
                      })
                    : t('closing.snapshot.liveData', 'Dados em tempo real')
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <p className="text-xs text-muted-foreground">{t('closing.income', 'Entradas')}</p>
                    <p className="text-lg font-bold text-green-600 tabular-nums">
                      {formatCurrency(selectedClosure?.status === 'closed' ? selectedClosure.totalIncome : snapshot?.totalIncome || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10">
                    <p className="text-xs text-muted-foreground">{t('closing.expenses', 'Saídas')}</p>
                    <p className="text-lg font-bold text-red-600 tabular-nums">
                      {formatCurrency(selectedClosure?.status === 'closed' ? selectedClosure.totalExpenses : snapshot?.totalExpenses || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">{t('closing.netResult', 'Resultado')}</p>
                    <p className={cn(
                      "text-lg font-bold tabular-nums",
                      (selectedClosure?.status === 'closed' ? selectedClosure.netResult : snapshot?.netResult || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    )}>
                      {formatCurrency(selectedClosure?.status === 'closed' ? selectedClosure.netResult : snapshot?.netResult || 0)}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Transaction Count */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('closing.transactionCount', 'Transações')}</span>
                  <span className="font-medium">
                    {selectedClosure?.status === 'closed' ? selectedClosure.transactionCount : snapshot?.transactionCount || 0}
                  </span>
                </div>

                {/* Wallet Balances */}
                <Accordion type="single" collapsible>
                  <AccordionItem value="wallets">
                    <AccordionTrigger className="text-sm">
                      {t('closing.walletBalances', 'Saldos das Carteiras')}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {(selectedClosure?.status === 'closed' 
                          ? selectedClosure.walletBalances 
                          : snapshot?.walletBalances || []
                        ).map(wallet => (
                          <div key={wallet.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{wallet.name}</span>
                            <span className="font-medium tabular-nums">
                              {formatCurrency(wallet.balance)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Reopening History */}
                {selectedClosure?.reopenedAt && (
                  <Alert>
                    <History className="h-4 w-4" />
                    <AlertTitle>{t('closing.reopenHistory', 'Histórico de Reabertura')}</AlertTitle>
                    <AlertDescription className="text-xs">
                      {t('closing.reopenedOn', 'Reaberto em {{date}}: {{reason}}', {
                        date: new Date(selectedClosure.reopenedAt).toLocaleDateString('pt-BR'),
                        reason: selectedClosure.reopenReason,
                      })}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!selectedPeriod && !loading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">{t('closing.selectPeriodHint', 'Selecione um período')}</p>
              <p className="text-sm mt-1">
                {t('closing.selectPeriodDescription', 'Escolha um mês para visualizar o status e fechar')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Close Dialog */}
        <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                {t('closing.closeDialog.title', 'Fechar Mês')}
              </DialogTitle>
              <DialogDescription>
                {t('closing.closeDialog.description', 'Ao fechar o mês, os dados serão congelados. Você poderá reabrir se necessário.')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('closing.closeDialog.notes', 'Observações (opcional)')}</Label>
                <Textarea
                  placeholder={t('closing.closeDialog.notesPlaceholder', 'Adicione notas sobre este fechamento...')}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
                {t('common.cancel', 'Cancelar')}
              </Button>
              <Button onClick={handleClose} disabled={processing}>
                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('closing.closeDialog.confirm', 'Confirmar Fechamento')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reopen Dialog */}
        <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Unlock className="w-5 h-5" />
                {t('closing.reopenDialog.title', 'Reabrir Mês')}
              </DialogTitle>
              <DialogDescription>
                {t('closing.reopenDialog.description', 'Ao reabrir, você poderá editar transações novamente. O motivo será registrado.')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('closing.reopenDialog.warning', 'Esta ação será auditada. O snapshot anterior será preservado.')}
                </AlertDescription>
              </Alert>
              <div>
                <Label>{t('closing.reopenDialog.reason', 'Motivo da reabertura')} *</Label>
                <Textarea
                  placeholder={t('closing.reopenDialog.reasonPlaceholder', 'Explique o motivo da reabertura...')}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReopenDialogOpen(false)}>
                {t('common.cancel', 'Cancelar')}
              </Button>
              <Button 
                variant="destructive"
                onClick={handleReopen} 
                disabled={processing || !reopenReason.trim()}
              >
                {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('closing.reopenDialog.confirm', 'Confirmar Reabertura')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
