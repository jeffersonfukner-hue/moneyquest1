import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, TrendingUp, CreditCard, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useWallets } from '@/hooks/useWallets';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useLoans } from '@/hooks/useLoans';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  tooltip: string;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  onClick?: () => void;
}

const KPICard = ({ title, value, icon, tooltip, variant = 'default', onClick }: KPICardProps) => {
  const { formatCurrency } = useCurrency();
  
  const variantStyles = {
    default: 'border-border hover:border-primary/50',
    success: 'border-success/30 hover:border-success/60 bg-success/5',
    danger: 'border-destructive/30 hover:border-destructive/60 bg-destructive/5',
    warning: 'border-warning/30 hover:border-warning/60 bg-warning/5',
  };
  
  const valueStyles = {
    default: 'text-foreground',
    success: 'text-success',
    danger: 'text-destructive',
    warning: 'text-warning',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98]",
              variantStyles[variant]
            )}
            onClick={onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium truncate mb-1">
                    {title}
                  </p>
                  <p className={cn(
                    "text-lg lg:text-xl font-bold tabular-nums truncate",
                    valueStyles[variant]
                  )}>
                    {formatCurrency(value)}
                  </p>
                </div>
                <div className={cn(
                  "p-2 rounded-lg shrink-0",
                  variant === 'default' && "bg-muted",
                  variant === 'success' && "bg-success/10 text-success",
                  variant === 'danger' && "bg-destructive/10 text-destructive",
                  variant === 'warning' && "bg-warning/10 text-warning",
                )}>
                  {icon}
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const FinancialKPICards = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeWallets } = useWallets();
  const { activeCards } = useCreditCards();
  const { activeLoans, totalSaldoDevedor } = useLoans();

  // Calculate total balance from wallets
  const totalBalance = activeWallets.reduce((sum, wallet) => sum + wallet.current_balance, 0);
  
  // Calculate available credit from credit cards
  const availableCredit = activeCards.reduce((sum, card) => sum + card.available_limit, 0);
  const totalCreditLimit = activeCards.reduce((sum, card) => sum + card.total_limit, 0);
  const usedCredit = totalCreditLimit - availableCredit;
  
  // Calculate total debt (loans + used credit cards)
  const totalDebt = totalSaldoDevedor + usedCredit;
  
  // Simple cash projection (balance - upcoming expenses from loans)
  // For now, just show current balance - scheduled payments for 30 days
  const monthlyLoanPayments = activeLoans.reduce((sum, loan) => sum + loan.valor_parcela, 0);
  const cashProjection30Days = totalBalance - monthlyLoanPayments;

  // Determine variants based on financial health
  const balanceVariant = totalBalance >= 0 ? 'success' : 'danger';
  const projectionVariant = cashProjection30Days >= 0 ? 'default' : 'warning';
  const debtVariant = totalDebt > 0 ? 'danger' : 'default';
  const creditVariant = availableCredit < (totalCreditLimit * 0.2) && totalCreditLimit > 0 ? 'warning' : 'default';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <KPICard
        title={t('dashboard.totalBalance', 'Saldo Total')}
        value={totalBalance}
        icon={<Wallet className="w-5 h-5" />}
        tooltip={t('dashboard.totalBalanceTooltip', 'Soma de todos os saldos das suas contas ativas')}
        variant={balanceVariant}
        onClick={() => navigate('/wallets')}
      />
      
      <KPICard
        title={t('dashboard.cashProjection', 'Projeção 30 dias')}
        value={cashProjection30Days}
        icon={<TrendingUp className="w-5 h-5" />}
        tooltip={t('dashboard.cashProjectionTooltip', 'Saldo atual menos pagamentos programados para os próximos 30 dias')}
        variant={projectionVariant}
        onClick={() => navigate('/cash-flow')}
      />
      
      <KPICard
        title={t('dashboard.totalDebt', 'Dívida Total')}
        value={totalDebt}
        icon={<AlertTriangle className="w-5 h-5" />}
        tooltip={t('dashboard.totalDebtTooltip', 'Soma de empréstimos ativos e crédito utilizado nos cartões')}
        variant={debtVariant}
        onClick={() => navigate('/wallets?tab=loans')}
      />
      
      <KPICard
        title={t('dashboard.availableCredit', 'Crédito Disponível')}
        value={availableCredit}
        icon={<CreditCard className="w-5 h-5" />}
        tooltip={t('dashboard.availableCreditTooltip', 'Limite disponível em todos os seus cartões de crédito')}
        variant={creditVariant}
        onClick={() => navigate('/wallets?tab=cards')}
      />
    </div>
  );
};
