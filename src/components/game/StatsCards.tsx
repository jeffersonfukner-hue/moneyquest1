import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Profile } from '@/types/database';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useWallets } from '@/hooks/useWallets';

interface StatsCardsProps {
  profile: Profile;
}

export const StatsCards = ({ profile }: StatsCardsProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { activeWallets } = useWallets();
  
  // Calculate initial balance from all wallets
  const initialBalance = activeWallets.reduce((sum, wallet) => sum + wallet.initial_balance, 0);
  
  // Calculate current balance from actual wallet balances
  const balance = activeWallets.reduce((sum, wallet) => sum + wallet.current_balance, 0);

  return (
    <div className="bg-card rounded-xl p-2 shadow-md border border-border animate-slide-up">
      <div className="space-y-2">
        {/* Linha 1: Saldo Inicial | Receita Total */}
        <div className="grid grid-cols-2 divide-x divide-border">
          {/* Saldo Inicial */}
          <div className="flex flex-col items-center text-center px-0.5 sm:px-1">
            <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
              <PiggyBank className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-[11px] sm:text-sm font-bold text-muted-foreground truncate">
                {formatCurrency(initialBalance)}
              </p>
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">
              {t('stats.initialBalance')}
            </p>
          </div>

          {/* Receita */}
          <div className="flex flex-col items-center text-center px-0.5 sm:px-1">
            <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-success flex-shrink-0" />
              <p className="text-[11px] sm:text-sm font-bold text-success truncate">
                {formatCurrency(profile.total_income)}
              </p>
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">
              {t('stats.totalIncome')}
            </p>
          </div>
        </div>

        {/* Linha 2: Despesas Totais | Saldo */}
        <div className="grid grid-cols-2 divide-x divide-border border-t border-border pt-2">
          {/* Despesas */}
          <div className="flex flex-col items-center text-center px-0.5 sm:px-1">
            <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-destructive flex-shrink-0" />
              <p className="text-[11px] sm:text-sm font-bold text-destructive truncate">
                {formatCurrency(profile.total_expenses)}
              </p>
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">
              {t('stats.totalExpenses')}
            </p>
          </div>

          {/* Saldo */}
          <div className="flex flex-col items-center text-center px-0.5 sm:px-1">
            <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
              <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
              <p className={`text-[11px] sm:text-sm font-bold truncate ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">
              {t('stats.balance')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
