import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Profile } from '@/types/database';
import { useCurrency } from '@/contexts/CurrencyContext';

interface StatsCardsProps {
  profile: Profile;
}

export const StatsCards = ({ profile }: StatsCardsProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const balance = profile.total_income - profile.total_expenses;

  return (
    <div className="bg-card rounded-xl p-3 shadow-md border border-border animate-slide-up">
      <div className="grid grid-cols-3 divide-x divide-border">
        {/* Receita */}
        <div className="flex flex-col items-center text-center px-2">
          <TrendingUp className="w-5 h-5 text-success mb-1" />
          <p className="text-sm font-bold text-success truncate w-full">
            {formatCurrency(profile.total_income)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {t('stats.totalIncome')}
          </p>
        </div>

        {/* Despesas */}
        <div className="flex flex-col items-center text-center px-2">
          <TrendingDown className="w-5 h-5 text-destructive mb-1" />
          <p className="text-sm font-bold text-destructive truncate w-full">
            {formatCurrency(profile.total_expenses)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {t('stats.totalExpenses')}
          </p>
        </div>

        {/* Saldo */}
        <div className="flex flex-col items-center text-center px-2">
          <Wallet className="w-5 h-5 text-primary mb-1" />
          <p className={`text-sm font-bold truncate w-full ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(balance)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {t('stats.balance')}
          </p>
        </div>
      </div>
    </div>
  );
};
