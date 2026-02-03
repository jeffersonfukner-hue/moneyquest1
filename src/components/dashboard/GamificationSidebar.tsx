import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flame, Trophy, Store, Star, ChevronRight } from 'lucide-react';
import { Profile } from '@/types/database';
import { AvatarDisplay } from '@/components/profile/AvatarDisplay';
import { getXPProgress, XP_PER_LEVEL, getLevelTitleKey } from '@/lib/gameLogic';
import { cn } from '@/lib/utils';

interface GamificationSidebarProps {
  profile: Profile;
}

export const GamificationSidebar = ({ profile }: GamificationSidebarProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const progress = getXPProgress(profile.xp);
  const xpToNextLevel = XP_PER_LEVEL - (profile.xp % XP_PER_LEVEL);
  const levelTitleKey = getLevelTitleKey(profile.level);
  const translatedTitle = t(`levels.${levelTitleKey}`);

  // Calculate multiplier based on streak
  const getMultiplier = (streak: number): number => {
    if (streak >= 30) return 2.0;
    if (streak >= 14) return 1.5;
    if (streak >= 7) return 1.25;
    if (streak >= 3) return 1.1;
    return 1.0;
  };

  const multiplier = getMultiplier(profile.streak);

  return (
    <Card className="border-border bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          {t('gamification.title', 'Sua Jornada')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level & Avatar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md overflow-hidden">
              <AvatarDisplay
                avatarUrl={profile.avatar_url}
                avatarIcon={profile.avatar_icon}
                size="md"
                className="w-full h-full border-0"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-accent text-accent-foreground text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm">
              {profile.level}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {translatedTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile.xp.toLocaleString()} XP
            </p>
          </div>
        </div>

        {/* XP Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">
              {t('gamification.nextLevel', 'Próximo nível')}
            </span>
            <span className="font-medium text-accent">
              {xpToNextLevel} XP
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Streak */}
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-lg">{profile.streak}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('gamification.streak', 'Dias seguidos')}
            </p>
          </div>

          {/* Multiplier */}
          <div className="bg-muted/50 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-bold text-lg">{multiplier.toFixed(1)}x</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('gamification.multiplier', 'Multiplicador')}
            </p>
          </div>
        </div>

        {/* Coins */}
        <div className="flex items-center justify-between bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-lg p-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">🪙</span>
            <span className="font-bold">{profile.mq_coins}</span>
            <span className="text-xs text-muted-foreground">MQ Coins</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs h-8"
            onClick={() => navigate('/leaderboard')}
          >
            <span className="flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5" />
              {t('gamification.ranking', 'Ver Ranking')}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs h-8"
            onClick={() => navigate('/shop')}
          >
            <span className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5" />
              {t('gamification.shop', 'Loja')}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
