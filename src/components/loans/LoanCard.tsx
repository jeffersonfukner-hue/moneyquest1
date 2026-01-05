import { Landmark, Calendar, TrendingDown, MoreVertical, Pencil, Trash2, List, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loan } from '@/hooks/useLoans';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format, parseISO, isPast, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LoanCardProps {
  loan: Loan;
  onEdit: (loan: Loan) => void;
  onDelete: (id: string) => void;
  onViewInstallments: (loan: Loan) => void;
  onViewDetails: (loan: Loan) => void;
}

const LOAN_TYPE_LABELS: Record<Loan['tipo_emprestimo'], { label: string; icon: string }> = {
  pessoal: { label: 'Pessoal', icon: '💰' },
  financiamento: { label: 'Financiamento', icon: '🏠' },
  consignado: { label: 'Consignado', icon: '💳' },
  informal: { label: 'Informal', icon: '🤝' },
  parcelamento: { label: 'Parcelamento', icon: '🛒' },
};

export const LoanCard = ({ loan, onEdit, onDelete, onViewInstallments, onViewDetails }: LoanCardProps) => {
  const { formatCurrency, currency: userCurrency } = useCurrency();

  // Helper para formatar com moeda específica
  const formatAmount = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const progressPercent = loan.quantidade_parcelas > 0 
    ? (loan.parcelas_pagas / loan.quantidade_parcelas) * 100 
    : 0;

  const typeInfo = LOAN_TYPE_LABELS[loan.tipo_emprestimo];
  
  // Calcular próximo vencimento baseado nas parcelas pagas
  const primeiroVenc = parseISO(loan.primeiro_vencimento);
  const proximoVencimento = new Date(primeiroVenc);
  proximoVencimento.setMonth(proximoVencimento.getMonth() + loan.parcelas_pagas);
  
  const isOverdue = isPast(proximoVencimento) && loan.status === 'ativo';
  const isNearDue = !isOverdue && isPast(addDays(proximoVencimento, -3)) && loan.status === 'ativo';

  return (
    <Card className={`overflow-hidden transition-all ${
      loan.status === 'quitado' 
        ? 'opacity-70 border-green-500/30' 
        : isOverdue 
          ? 'border-destructive/50' 
          : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg">{typeInfo.icon}</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm">{loan.instituicao_pessoa}</h3>
              <p className="text-xs text-muted-foreground">{typeInfo.label}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {loan.status === 'quitado' && (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px]">
                Quitado
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive" className="text-[10px]">
                Atrasado
              </Badge>
            )}
            {isNearDue && !isOverdue && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 text-[10px]">
                Vence em breve
              </Badge>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(loan)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalhes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewInstallments(loan)}>
                  <List className="mr-2 h-4 w-4" />
                  Ver Parcelas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(loan)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(loan.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Valores */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Valor Total</p>
            <p className="font-semibold text-sm">{formatAmount(loan.valor_total, loan.currency)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Saldo Devedor</p>
            <p className="font-semibold text-sm text-primary">
              {formatAmount(loan.saldo_devedor, loan.currency)}
            </p>
          </div>
        </div>

        {/* Progresso */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {loan.parcelas_pagas} de {loan.quantidade_parcelas} parcelas
            </span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              {loan.status === 'quitado' 
                ? 'Quitado' 
                : `Próx: ${format(proximoVencimento, "dd/MM/yy", { locale: ptBR })}`
              }
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            <span>{formatAmount(loan.valor_parcela, loan.currency)}/mês</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};