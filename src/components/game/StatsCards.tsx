import { Flame, TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { Profile } from '@/types/database';

interface StatsCardsProps {
  profile: Profile;
}

export const StatsCards = ({ profile }: StatsCardsProps) => {
  const totalSaved = profile.total_income - profile.total_expenses;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-card rounded-xl p-4 shadow-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-streak rounded-lg flex items-center justify-center shadow-glow-streak">
            <Flame className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-foreground">{profile.streak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 shadow-md animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-level rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-income">
              ${profile.total_income.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total Income</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 shadow-md animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-expense" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-expense">
              ${profile.total_expenses.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total Expenses</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 shadow-md animate-slide-up" style={{ animationDelay: '0.25s' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-xp rounded-lg flex items-center justify-center shadow-glow-accent">
            <Coins className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <p className={`text-2xl font-display font-bold ${totalSaved >= 0 ? 'text-income' : 'text-expense'}`}>
              ${Math.abs(totalSaved).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalSaved >= 0 ? 'Total Saved' : 'Net Loss'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
