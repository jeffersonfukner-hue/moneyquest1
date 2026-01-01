import { useTranslation } from 'react-i18next';
import { Flame } from 'lucide-react';
import { getXPProgress, XP_PER_LEVEL, getLevelTitleKey } from '@/lib/gameLogic';
import { Profile } from '@/types/database';
import { AvatarDisplay } from '@/components/profile/AvatarDisplay';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
    <div className="bg-card rounded-xl p-2 shadow-md animate-slide-up border border-border">
      <div className="flex items-center gap-2">
        {/* Avatar compacto */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-md shadow-primary/30 overflow-hidden">
            <AvatarDisplay
              avatarUrl={profile.avatar_url}
              avatarIcon={profile.avatar_icon}
              size="md"
              className="w-full h-full border-0"
            />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 rounded-full shadow-sm">
            {profile.level}
          </div>
        </div>

        {/* Título */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm font-semibold text-primary leading-tight">
            {translatedTitle}
          </h3>
          <div className="flex items-center gap-1.5">
            {/* Streak badge */}
            <div className="flex items-center gap-0.5 bg-accent/20 text-accent px-1 py-0.5 rounded-full">
              <Flame className="w-3 h-3" />
              <span className="text-xs font-bold">{profile.streak}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {profile.xp.toLocaleString()} XP
            </span>
            <span className="text-muted-foreground/50">|</span>
            {/* Barra de progresso inline */}
            <span className="text-xs text-muted-foreground">
              Lv{profile.level + 1}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative h-1.5 flex-1 min-w-8 overflow-hidden rounded-full bg-level-progress-bg cursor-pointer">
                    <div 
                      className="h-full bg-gradient-to-r from-accent to-xp-gold-glow rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-semibold">{progress.toFixed(1)}% {t('stats.xpToNextLevel')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-xs font-semibold text-accent whitespace-nowrap">
              {xpToNextLevel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
