import { Badge } from '@/types/database';
import { Award, Lock } from 'lucide-react';

interface BadgesGridProps {
  badges: Badge[];
}

export const BadgesGrid = ({ badges }: BadgesGridProps) => {
  const unlockedBadges = badges.filter(b => b.is_unlocked);
  const lockedBadges = badges.filter(b => !b.is_unlocked);

  return (
    <div className="bg-card rounded-2xl p-6 shadow-md animate-slide-up" style={{ animationDelay: '0.35s' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-badge rounded-lg flex items-center justify-center">
          <Award className="w-4 h-4 text-primary-foreground" />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground">Badges</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {unlockedBadges.length}/{badges.length}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {badges.map(badge => (
          <BadgeItem key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
};

const BadgeItem = ({ badge }: { badge: Badge }) => (
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
        <span className="text-2xl">{badge.icon}</span>
        <span className="text-[10px] font-medium text-accent-foreground text-center leading-tight mt-1 truncate w-full">
          {badge.name}
        </span>
      </>
    ) : (
      <>
        <Lock className="w-6 h-6 text-muted-foreground/50" />
        <span className="text-[10px] text-muted-foreground text-center leading-tight mt-1">
          ???
        </span>
      </>
    )}
  </div>
);
