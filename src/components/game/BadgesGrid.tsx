import { useTranslation } from 'react-i18next';
import { Badge } from '@/types/database';
import { Award, Lock } from 'lucide-react';

interface BadgesGridProps {
  badges: Badge[];
}

export const BadgesGrid = ({ badges }: BadgesGridProps) => {
  const { t } = useTranslation();
  const unlockedBadges = badges.filter(b => b.is_unlocked);

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-md animate-slide-up" style={{ animationDelay: '0.35s' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-badge rounded-lg flex items-center justify-center">
          <Award className="w-4 h-4 text-primary-foreground" />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground">{t('badges.title')}</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {unlockedBadges.length}/{badges.length}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {badges.map(badge => (
          <BadgeItem key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
};

const BadgeItem = ({ badge }: { badge: Badge }) => {
  const { t } = useTranslation();
  
  return (
    <div 
      className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all ${
        badge.is_unlocked 
          ? 'bg-gradient-xp shadow-glow-accent animate-bounce-in' 
          : 'bg-muted/50'
      }`}
      title={`${badge.name}: ${badge.description}`}
    >
      {badge.is_unlocked ? (
        <>
          <span className="text-xl sm:text-2xl">{badge.icon}</span>
          <span className="text-[9px] sm:text-[10px] font-medium text-accent-foreground text-center leading-tight mt-1 truncate w-full">
            {badge.name}
          </span>
        </>
      ) : (
        <>
          <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/50" />
          <span className="text-[9px] sm:text-[10px] text-muted-foreground text-center leading-tight mt-1">
            {t('badges.locked')}
          </span>
        </>
      )}
    </div>
  );
};
