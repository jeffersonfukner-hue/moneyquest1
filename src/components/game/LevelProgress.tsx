import { useTranslation } from 'react-i18next';
import { getXPProgress, XP_PER_LEVEL, getLevelTitleKey } from '@/lib/gameLogic';
import { Profile } from '@/types/database';
import { AvatarDisplay } from '@/components/profile/AvatarDisplay';

interface LevelProgressProps {
  profile: Profile;
}

export const LevelProgress = ({ profile }: LevelProgressProps) => {
  const { t } = useTranslation();
  const progress = getXPProgress(profile.xp);
  const xpToNextLevel = XP_PER_LEVEL - (profile.xp % XP_PER_LEVEL);
  const levelTitleKey = getLevelTitleKey(profile.level);
  const translatedTitle = t(`levels.${levelTitleKey}`);

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-md animate-slide-up border border-border">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 animate-float overflow-hidden">
            <AvatarDisplay
              avatarUrl={profile.avatar_url}
              avatarIcon={profile.avatar_icon}
              size="lg"
              className="w-full h-full border-0"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
            {t('stats.level')} {profile.level}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base sm:text-lg font-semibold text-primary truncate">
            {translatedTitle}
          </h3>
          <p className="text-sm text-muted-foreground">
            {profile.xp.toLocaleString()} {t('stats.xp')}
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('stats.level')} {profile.level + 1}</span>
          <span className="font-semibold text-accent">{xpToNextLevel} {t('stats.xp')}</span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-level-progress-bg">
          <div 
            className="h-full bg-gradient-to-r from-accent to-xp-gold-glow rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
