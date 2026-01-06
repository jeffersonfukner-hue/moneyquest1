import { useState } from 'react';
import { Landmark, Calendar, Percent } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { CreateLoanData, Loan } from '@/hooks/useLoans';
import { useCurrency } from '@/contexts/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '@/i18n';
import { SupportedCurrency } from '@/types/database';
import { cn } from '@/lib/utils';
import { format, addMonths } from 'date-fns';

interface AddLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: CreateLoanData) => Promise<Loan | null>;
}

const LOAN_TYPES: { value: Loan['tipo_emprestimo']; label: string; icon: string }[] = [
  { value: 'pessoal', label: 'Empréstimo Pessoal', icon: '💰' },
  { value: 'financiamento', label: 'Financiamento', icon: '🏠' },
  { value: 'consignado', label: 'Consignado', icon: '💳' },
  { value: 'informal', label: 'Empréstimo Informal', icon: '🤝' },
  { value: 'parcelamento', label: 'Parcelamento de Compra', icon: '🛒' },
];

const INSTITUTIONS = [
  'Nubank', 'Itaú', 'Bradesco', 'Santander', 'Banco do Brasil', 
  'Caixa', 'Inter', 'C6 Bank', 'BTG Pactual', 'Creditas',
  'BV Financeira', 'Losango', 'Cetelem', 'Pan', 'Safra',
  'Financeira Pessoa Física', 'Outro'
];

export const AddLoanDialog = ({ open, onOpenChange, onAdd }: AddLoanDialogProps) => {
  const { currency } = useCurrency();
  
  const [valorTotal, setValorTotal] = useState('');
  const [tipoEmprestimo, setTipoEmprestimo] = useState<Loan['tipo_emprestimo'] | ''>('');
  const [instituicaoPessoa, setInstituicaoPessoa] = useState('');
  const [instituicaoCustom, setInstituicaoCustom] = useState('');
  const [quantidadeParcelas, setQuantidadeParcelas] = useState('');
  const [valorParcela, setValorParcela] = useState('');
  const [taxaJuros, setTaxaJuros] = useState('');
  const [primeiroVencimento, setPrimeiroVencimento] = useState(
    format(addMonths(new Date(), 1), 'yyyy-MM-dd')
  );
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [debitarAutomaticamente, setDebitarAutomaticamente] = useState(false);
  const [enviarLembrete, setEnviarLembrete] = useState(true);
  const [considerarOrcamento, setConsiderarOrcamento] = useState(true);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setValorTotal('');
    setTipoEmprestimo('');
    setInstituicaoPessoa('');
    setInstituicaoCustom('');
    setQuantidadeParcelas('');
    setValorParcela('');
    setTaxaJuros('');
    setPrimeiroVencimento(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
    setSelectedCurrency(currency);
    setDebitarAutomaticamente(false);
    setEnviarLembrete(true);
    setConsiderarOrcamento(true);
    setNotas('');
  };

  // Calcula valor da parcela automaticamente
  const handleValorTotalChange = (value: string) => {
    setValorTotal(value);
    if (value && quantidadeParcelas) {
      const total = parseFloat(value);
      const parcelas = parseInt(quantidadeParcelas);
      if (total > 0 && parcelas > 0) {
        const valorCalc = total / parcelas;
        setValorParcela(valorCalc.toFixed(2));
      }
    }
  };

  const handleParcelasChange = (value: string) => {
    setQuantidadeParcelas(value);
    if (valorTotal && value) {
      const total = parseFloat(valorTotal);
      const parcelas = parseInt(value);
      if (total > 0 && parcelas > 0) {
        const valorCalc = total / parcelas;
        setValorParcela(valorCalc.toFixed(2));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!valorTotal || !tipoEmprestimo || !quantidadeParcelas || !valorParcela || !primeiroVencimento) {
      console.warn('[AddLoanDialog] Form inválido (campos obrigatórios faltando)', {
        valorTotal,
        tipoEmprestimo,
        quantidadeParcelas,
        valorParcela,
        primeiroVencimento,
      });
      return;
    }

    const finalInstituicao = instituicaoPessoa === 'Outro' ? instituicaoCustom : instituicaoPessoa;
    if (!finalInstituicao.trim()) {
      console.warn('[AddLoanDialog] Form inválido (instituição vazia)', {
        instituicaoPessoa,
        instituicaoCustom,
      });
      return;
    }

    setLoading(true);
    
    const result = await onAdd({
      valor_total: parseFloat(valorTotal),
      tipo_emprestimo: tipoEmprestimo,
      instituicao_pessoa: finalInstituicao.trim(),
      quantidade_parcelas: parseInt(quantidadeParcelas),
      valor_parcela: parseFloat(valorParcela),
      taxa_juros: taxaJuros ? parseFloat(taxaJuros) : null,
      primeiro_vencimento: primeiroVencimento,
      debitar_automaticamente: debitarAutomaticamente,
      enviar_lembrete: enviarLembrete,
      considerar_orcamento: considerarOrcamento,
      currency: selectedCurrency,
      notas: notas.trim() || null,
    });

    setLoading(false);

    if (result) {
      resetForm();
      onOpenChange(false);
    }
  };

  const isFormValid = valorTotal && tipoEmprestimo && quantidadeParcelas && valorParcela && primeiroVencimento && 
    (instituicaoPessoa === 'Outro' ? instituicaoCustom.trim() : instituicaoPessoa);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            Novo Empréstimo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Empréstimo */}
          <div className="space-y-2">
            <Label>Tipo de Empréstimo</Label>
            <select
              value={tipoEmprestimo}
              onChange={(e) => setTipoEmprestimo(e.target.value as Loan['tipo_emprestimo'])}
              className={cn(
                'flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background'
              )}
            >
              <option value="" disabled>
                Selecione o tipo
              </option>
              {LOAN_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Instituição/Pessoa */}
          <div className="space-y-2">
            <Label>Instituição ou Pessoa</Label>
            <select
              value={instituicaoPessoa}
              onChange={(e) => setInstituicaoPessoa(e.target.value)}
              className={cn(
                'flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background'
              )}
            >
              <option value="" disabled>
                Selecione a instituição
              </option>
              {INSTITUTIONS.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
            {instituicaoPessoa === 'Outro' && (
              <Input
                placeholder="Digite o nome da instituição ou pessoa"
                value={instituicaoCustom}
                onChange={(e) => setInstituicaoCustom(e.target.value)}
                className="min-h-[44px] mt-2"
              />
            )}
          </div>

          {/* Valor Total */}
          <div className="space-y-2">
            <Label>Valor Total do Empréstimo</Label>
            <p className="text-xs text-muted-foreground -mt-1">Valor total contratado, sem descontar parcelas já pagas.</p>
            <div className="flex gap-2">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as SupportedCurrency)}
                className={cn(
                  'h-11 w-24 rounded-md border border-input bg-background px-3 text-sm text-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background'
                )}
              >
                {Object.entries(SUPPORTED_CURRENCIES).map(([code, config]) => (
                  <option key={code} value={code}>
                    {config.symbol}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={valorTotal}
                onChange={(e) => handleValorTotalChange(e.target.value)}
                className="flex-1 min-h-[44px]"
              />
            </div>
          </div>

          {/* Parcelas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nº de Parcelas</Label>
              <Input
                type="number"
                min="1"
                placeholder="12"
                value={quantidadeParcelas}
                onChange={(e) => handleParcelasChange(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor da Parcela</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={valorParcela}
                onChange={(e) => setValorParcela(e.target.value)}
                className="min-h-[44px]"
              />
              <p className="text-[10px] text-muted-foreground">Valor pago mensalmente</p>
            </div>
          </div>

          {/* Primeiro Vencimento e Taxa */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                1º Vencimento
              </Label>
              <Input
                type="date"
                value={primeiroVencimento}
                onChange={(e) => setPrimeiroVencimento(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Percent className="w-3.5 h-3.5" />
                Taxa de Juros (%)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="2.5"
                value={taxaJuros}
                onChange={(e) => setTaxaJuros(e.target.value)}
                className="min-h-[44px]"
              />
              <p className="text-[10px] text-muted-foreground">Ajuda a ver o custo real</p>
            </div>
          </div>

          {/* Opções */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Debitar parcelas automaticamente</Label>
                <p className="text-xs text-muted-foreground">Lança a despesa no dia do vencimento</p>
              </div>
              <Switch
                checked={debitarAutomaticamente}
                onCheckedChange={setDebitarAutomaticamente}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Lembrete antes do vencimento</Label>
                <p className="text-xs text-muted-foreground">Receba um aviso 3 dias antes</p>
              </div>
              <Switch
                checked={enviarLembrete}
                onCheckedChange={setEnviarLembrete}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Considerar no orçamento mensal</Label>
                <p className="text-xs text-muted-foreground">As parcelas serão incluídas nas suas metas de gastos</p>
              </div>
              <Switch
                checked={considerarOrcamento}
                onCheckedChange={setConsiderarOrcamento}
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              placeholder="Anotações sobre o empréstimo..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="min-h-[60px] resize-none"
            />
          </div>

          {!isFormValid && (
            <p className="text-xs text-muted-foreground">
              Preencha: tipo, instituição, valor total, parcelas, valor da parcela e 1º vencimento.
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="gold"
              disabled={loading || !isFormValid}
            >
              {loading ? 'Salvando...' : 'Cadastrar Empréstimo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};