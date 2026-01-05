import { useState, useMemo } from 'react';
import { 
  Landmark, 
  Calendar, 
  TrendingDown, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Percent,
  Wallet,
  Target,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { format, parseISO, addMonths, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loan } from '@/hooks/useLoans';
import { LoanInstallmentsPanel } from './LoanInstallmentsPanel';
import { PayOffLoanDialog } from './PayOffLoanDialog';
import { LoanProjectionWidget } from './LoanProjectionWidget';
import { LockedFeature } from '@/components/subscription/LockedFeature';

interface LoanDetailsPanelProps {
  loan: Loan;
  onBack: () => void;
  onPayInstallment: (loanId: string, installmentNumber: number) => Promise<boolean>;
  onPrepay: (loanId: string, numberOfInstallments: number) => Promise<boolean>;
  onPayOff: (loanId: string) => Promise<boolean>;
}

// Format currency with specific currency code
const formatLoanCurrency = (amount: number, currencyCode: string): string => {
  const localeMap: Record<string, string> = {
    BRL: 'pt-BR',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
  };
  return new Intl.NumberFormat(localeMap[currencyCode] || 'pt-BR', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};

const LOAN_TYPE_LABELS: Record<Loan['tipo_emprestimo'], { label: string; icon: string }> = {
  pessoal: { label: 'Empréstimo Pessoal', icon: '💰' },
  financiamento: { label: 'Financiamento', icon: '🏠' },
  consignado: { label: 'Consignado', icon: '💳' },
  informal: { label: 'Empréstimo Informal', icon: '🤝' },
  parcelamento: { label: 'Parcelamento', icon: '🛒' },
};

export function LoanDetailsPanel({ loan, onBack, onPayInstallment, onPrepay, onPayOff }: LoanDetailsPanelProps) {
  const [showInstallments, setShowInstallments] = useState(false);
  const [showPayOffDialog, setShowPayOffDialog] = useState(false);

  const typeInfo = LOAN_TYPE_LABELS[loan.tipo_emprestimo];
  const progressPercent = loan.quantidade_parcelas > 0 
    ? (loan.parcelas_pagas / loan.quantidade_parcelas) * 100 
    : 0;

  // Calculate next due date
  const proximoVencimento = useMemo(() => {
    const primeiroVenc = parseISO(loan.primeiro_vencimento);
    const nextDue = addMonths(primeiroVenc, loan.parcelas_pagas);
    return nextDue;
  }, [loan.primeiro_vencimento, loan.parcelas_pagas]);

  const isOverdue = isPast(proximoVencimento) && !isToday(proximoVencimento) && loan.status === 'ativo';
  const isDueToday = isToday(proximoVencimento) && loan.status === 'ativo';

  // Calculate total interest paid (estimated)
  const totalPagoEmParcelas = loan.parcelas_pagas * loan.valor_parcela;
  const principalPago = (loan.valor_total / loan.quantidade_parcelas) * loan.parcelas_pagas;
  const jurosPagos = loan.taxa_juros ? Math.max(0, totalPagoEmParcelas - principalPago) : 0;

  // Calculate total interest to pay
  const totalAPagar = loan.quantidade_parcelas * loan.valor_parcela;
  const jurosTotal = totalAPagar - loan.valor_total;

  if (showInstallments) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setShowInstallments(false)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar aos detalhes
        </Button>
        <LoanInstallmentsPanel
          loan={loan}
          onPayInstallment={onPayInstallment}
          onClose={() => setShowInstallments(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">{typeInfo.icon}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">{loan.instituicao_pessoa}</h2>
            <p className="text-sm text-muted-foreground">{typeInfo.label}</p>
          </div>
        </div>
        {loan.status === 'quitado' && (
          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Quitado
          </Badge>
        )}
        {isOverdue && (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Atrasado
          </Badge>
        )}
      </div>

      {/* Progress Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso de Quitação</span>
            <span className="text-2xl font-bold text-primary">{progressPercent.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercent} className="h-3 mb-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Você já quitou {loan.parcelas_pagas} parcelas</span>
            <span>Faltam {loan.quantidade_parcelas - loan.parcelas_pagas}</span>
          </div>
          {progressPercent > 0 && progressPercent < 100 && (
            <p className="text-xs text-center mt-2 text-primary">Continue assim, você está no caminho certo! 💪</p>
          )}
        </CardContent>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase">Valor Contratado</span>
            </div>
            <p className="text-lg font-bold">{formatLoanCurrency(loan.valor_total, loan.currency)}</p>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase">Saldo Devedor</span>
            </div>
            <p className="text-lg font-bold text-primary">{formatLoanCurrency(loan.saldo_devedor, loan.currency)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase">Próximo Vencimento</span>
            </div>
            <p className={`text-lg font-bold ${isOverdue ? 'text-destructive' : isDueToday ? 'text-yellow-600' : ''}`}>
              {loan.status === 'quitado' 
                ? 'Quitado 🎉' 
                : format(proximoVencimento, "dd/MM/yyyy", { locale: ptBR })
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase">Valor da Parcela</span>
            </div>
            <p className="text-lg font-bold">{formatLoanCurrency(loan.valor_parcela, loan.currency)}</p>
            <p className="text-[10px] text-muted-foreground">pago mensalmente</p>
          </CardContent>
        </Card>
      </div>

      {/* Interest Info (if applicable) */}
      {loan.taxa_juros && loan.taxa_juros > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Informações de Juros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Taxa de Juros</span>
              <span className="font-medium">{loan.taxa_juros.toFixed(2)}% ao mês</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Juros Pagos até agora</span>
              <span className="font-medium text-orange-600">{formatLoanCurrency(jurosPagos, loan.currency)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Juros Total Estimado</span>
              <span className="font-medium">{formatLoanCurrency(jurosTotal > 0 ? jurosTotal : 0, loan.currency)}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              💡 Acompanhar de perto ajuda a evitar juros desnecessários.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Additional Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Detalhes do Contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Data de Contratação</span>
            <span>{format(parseISO(loan.data_contratacao), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Primeiro Vencimento</span>
            <span>{format(parseISO(loan.primeiro_vencimento), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total de Parcelas</span>
            <span>{loan.quantidade_parcelas}x de {formatLoanCurrency(loan.valor_parcela, loan.currency)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Total a Pagar</span>
            <span className="font-medium">{formatLoanCurrency(totalAPagar, loan.currency)}</span>
          </div>
          
          {/* Settings badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {loan.debitar_automaticamente && (
              <Badge variant="secondary" className="text-xs">Débito Automático</Badge>
            )}
            {loan.enviar_lembrete && (
              <Badge variant="secondary" className="text-xs">Lembretes Ativos</Badge>
            )}
            {loan.considerar_orcamento && (
              <Badge variant="secondary" className="text-xs">No Orçamento</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Premium: Loan Projections */}
      {loan.status === 'ativo' && (
        <LockedFeature feature="loan_projections">
          <LoanProjectionWidget loan={loan} />
        </LockedFeature>
      )}

      {/* Notes */}
      {loan.notas && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{loan.notas}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {loan.status === 'ativo' && (
          <Button 
            className="w-full" 
            variant="default"
            onClick={() => setShowPayOffDialog(true)}
          >
            <Zap className="h-4 w-4 mr-2" />
            Antecipar ou Quitar
          </Button>
        )}
        
        <Button 
          className="w-full" 
          variant={loan.status === 'quitado' ? 'default' : 'outline'}
          onClick={() => setShowInstallments(true)}
        >
          <Clock className="h-4 w-4 mr-2" />
          Ver Parcelas
        </Button>
      </div>

      {/* Pay Off Dialog */}
      <PayOffLoanDialog
        loan={loan}
        open={showPayOffDialog}
        onOpenChange={setShowPayOffDialog}
        onPayOff={onPayOff}
        onPrepay={onPrepay}
      />
    </div>
  );
}