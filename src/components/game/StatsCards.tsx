import { Flame, TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Profile } from '@/types/database';
import { useCurrency } from '@/contexts/CurrencyContext';

interface StatsCardsProps {
  profile: Profile;
}

export const StatsCards = ({ profile }: StatsCardsProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const totalSaved = profile.total_income - profile.total_expenses;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-card rounded-xl p-4 shadow-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-streak rounded-lg flex items-center justify-center shadow-glow-streak">
            <Flame className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xl font-display font-bold text-foreground">{profile.streak}</p>
            <p className="text-xs text-muted-foreground">{t('stats.dayStreak')}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 shadow-md animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-level rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-income truncate">
              {formatCurrency(profile.total_income)}
            </p>
            <p className="text-xs text-muted-foreground">{t('stats.totalIncome')}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 shadow-md animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-expense" />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-expense truncate">
              {formatCurrency(profile.total_expenses)}
            </p>
            <p className="text-xs text-muted-foreground">{t('stats.totalExpenses')}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 shadow-md animate-slide-up" style={{ animationDelay: '0.25s' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-xp rounded-lg flex items-center justify-center shadow-glow-accent">
            <Coins className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <p className={`text-lg font-display font-bold truncate ${totalSaved >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(Math.abs(totalSaved))}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalSaved >= 0 ? t('stats.totalSaved') : t('stats.netLoss')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
