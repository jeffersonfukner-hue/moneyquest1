import { useMemo } from 'react';
import { TrendingUp, Calendar, Coins, Zap, LineChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, addMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loan } from '@/hooks/useLoans';

interface LoanProjectionWidgetProps {
  loan: Loan;
}

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

export function LoanProjectionWidget({ loan }: LoanProjectionWidgetProps) {
  const projections = useMemo(() => {
    if (loan.status !== 'ativo') return null;

    const parcelasRestantes = loan.quantidade_parcelas - loan.parcelas_pagas;
    const primeiroVenc = parseISO(loan.primeiro_vencimento);
    
    // Estimated end date at normal pace
    const dataNormalQuitacao = addMonths(primeiroVenc, loan.quantidade_parcelas - 1);
    
    // Calculate early payoff scenarios
    const taxaMensal = loan.taxa_juros || 0;
    
    // Scenario 1: Pay 1 extra installment per quarter
    const parcelasComAntecipaçãoTrimestral = Math.ceil(parcelasRestantes * 0.75);
    const dataAntecipadaTrimestral = addMonths(primeiroVenc, loan.parcelas_pagas + parcelasComAntecipaçãoTrimestral - 1);
    
    // Scenario 2: Pay 2 extra installments per quarter (aggressive)
    const parcelasComAntecipaçãoAgressiva = Math.ceil(parcelasRestantes * 0.60);
    const dataAntecipadaAgressiva = addMonths(primeiroVenc, loan.parcelas_pagas + parcelasComAntecipaçãoAgressiva - 1);
    
    // Interest savings estimation
    const jurosRestantesNormal = parcelasRestantes * loan.valor_parcela - loan.saldo_devedor;
    const jurosPoupadosTrimestral = jurosRestantesNormal * 0.15;
    const jurosPoupadosAgressivo = jurosRestantesNormal * 0.30;

    return {
      parcelasRestantes,
      dataNormalQuitacao,
      dataAntecipadaTrimestral,
      dataAntecipadaAgressiva,
      jurosPoupadosTrimestral: Math.max(0, jurosPoupadosTrimestral),
      jurosPoupadosAgressivo: Math.max(0, jurosPoupadosAgressivo),
      mesesEconomizadosTrimestral: parcelasRestantes - parcelasComAntecipaçãoTrimestral,
      mesesEconomizadosAgressivo: parcelasRestantes - parcelasComAntecipaçãoAgressiva,
    };
  }, [loan]);

  if (!projections) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">🎉 Este empréstimo já foi quitado! Menos uma dívida, mais liberdade financeira.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <LineChart className="h-4 w-4 text-primary" />
          Simulador de Quitação
          <Badge variant="secondary" className="ml-auto text-xs">Premium</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Simule a quitação antecipada e veja quanto você pode economizar em juros.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Normal Timeline */}
        <div className="p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Ritmo Atual</span>
          </div>
          <p className="text-lg font-bold">
            {format(projections.dataNormalQuitacao, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <p className="text-xs text-muted-foreground">
            Faltam {projections.parcelasRestantes} parcelas para a quitação
          </p>
        </div>

        {/* Quarterly Prepayment */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">+1 parcela por trimestre</span>
          </div>
          <p className="text-lg font-bold text-primary">
            {format(projections.dataAntecipadaTrimestral, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {projections.mesesEconomizadosTrimestral} meses a menos
            </span>
            {projections.jurosPoupadosTrimestral > 0 && (
              <span className="flex items-center gap-1 text-green-600">
                <Coins className="h-3 w-3" />
                ~{formatLoanCurrency(projections.jurosPoupadosTrimestral, loan.currency)} de economia
              </span>
            )}
          </div>
        </div>

        {/* Aggressive Prepayment */}
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">+2 parcelas por trimestre</span>
          </div>
          <p className="text-lg font-bold text-green-600">
            {format(projections.dataAntecipadaAgressiva, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {projections.mesesEconomizadosAgressivo} meses a menos
            </span>
            {projections.jurosPoupadosAgressivo > 0 && (
              <span className="flex items-center gap-1 text-green-600">
                <Coins className="h-3 w-3" />
                ~{formatLoanCurrency(projections.jurosPoupadosAgressivo, loan.currency)} de economia
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          * Valores estimados com base na taxa de juros informada
        </p>
      </CardContent>
    </Card>
  );
}
