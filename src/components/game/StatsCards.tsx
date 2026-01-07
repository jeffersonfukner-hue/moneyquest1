import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
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
  
  // Calculate balance from actual wallet balances
  const balance = activeWallets.reduce((sum, wallet) => sum + wallet.current_balance, 0);

  return (
    <div className="bg-card rounded-xl p-2 shadow-md border border-border animate-slide-up">
      <div className="grid grid-cols-3 divide-x divide-border">
        {/* Receita */}
        <div className="flex flex-col items-center text-center px-1">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-success flex-shrink-0" />
            <p className="text-sm font-bold text-success truncate">
              {formatCurrency(profile.total_income)}
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {t('stats.totalIncome')}
          </p>
        </div>

        {/* Despesas */}
        <div className="flex flex-col items-center text-center px-1">
          <div className="flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm font-bold text-destructive truncate">
              {formatCurrency(profile.total_expenses)}
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {t('stats.totalExpenses')}
          </p>
        </div>

        {/* Saldo */}
        <div className="flex flex-col items-center text-center px-1">
          <div className="flex items-center gap-1">
            <Wallet className="w-4 h-4 text-primary flex-shrink-0" />
            <p className={`text-sm font-bold truncate ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {t('stats.balance')}
          </p>
        </div>
      </div>
    </div>
  );
};
