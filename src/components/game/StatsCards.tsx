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
    <div className="grid grid-cols-2 gap-2">
      <div className="bg-card rounded-xl p-3 shadow-md border border-border animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-accent to-xp-gold-glow rounded-lg flex items-center justify-center shadow-md">
            <Flame className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-xl font-display font-bold text-foreground">{profile.streak}</p>
            <p className="text-xs text-muted-foreground">{t('stats.dayStreak')}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-3 shadow-md border border-border animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-success/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-success truncate">
              {formatCurrency(profile.total_income)}
            </p>
            <p className="text-xs text-muted-foreground">{t('stats.totalIncome')}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-3 shadow-md border border-border animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-destructive/20 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-destructive truncate">
              {formatCurrency(profile.total_expenses)}
            </p>
            <p className="text-xs text-muted-foreground">{t('stats.totalExpenses')}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-3 shadow-md border border-border animate-slide-up" style={{ animationDelay: '0.25s' }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-accent to-xp-gold-glow rounded-lg flex items-center justify-center shadow-md">
            <Coins className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <p className={`text-lg font-display font-bold truncate ${totalSaved >= 0 ? 'text-success' : 'text-destructive'}`}>
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
