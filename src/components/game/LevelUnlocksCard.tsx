import { useTranslation } from 'react-i18next';
import { Lock, Unlock, Sparkles, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  getUnlockedFeatures, 
  getNextUnlock, 
  getFeaturesAtLevel,
  getMilestoneLevels,
  FEATURE_UNLOCKS,
  FeatureUnlock 
} from '@/lib/levelUnlocks';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { XP_PER_LEVEL, getLevelFromXP } from '@/lib/gameLogic';
import { cn } from '@/lib/utils';

export const LevelUnlocksCard = () => {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { isPremium } = useSubscription();

  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const xpInCurrentLevel = xp % XP_PER_LEVEL;
  const progressToNextLevel = (xpInCurrentLevel / XP_PER_LEVEL) * 100;

  const unlockedFeatures = getUnlockedFeatures(level, isPremium);
  const nextUnlock = getNextUnlock(level, isPremium);
  const milestoneLevels = getMilestoneLevels();

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <Unlock className="w-4 h-4 text-white" />
          </div>
          <CardTitle className="text-lg">Desbloqueios por Nível</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Progress */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Nível {level}</span>
            <span className="text-xs text-muted-foreground">
              {xpInCurrentLevel.toLocaleString()} / {XP_PER_LEVEL.toLocaleString()} XP
            </span>
          </div>
          <Progress value={progressToNextLevel} className="h-2" />
          
          {nextUnlock && (
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>
                Próximo desbloqueio no nível {nextUnlock.level}: 
                <span className="font-medium text-foreground ml-1">{nextUnlock.icon} {nextUnlock.name}</span>
              </span>
            </div>
          )}
        </div>

        {/* Milestone Timeline */}
        <div className="space-y-2">
          {milestoneLevels.map((milestoneLevel) => {
            const features = getFeaturesAtLevel(milestoneLevel);
            const isUnlocked = level >= milestoneLevel;
            const isCurrent = level === milestoneLevel || 
              (level < milestoneLevel && milestoneLevels.indexOf(milestoneLevel) === milestoneLevels.findIndex(l => l > level));

            return (
              <div
                key={milestoneLevel}
                className={cn(
                  'relative pl-6 pb-3 border-l-2 transition-all',
                  isUnlocked 
                    ? 'border-primary' 
                    : isCurrent 
                    ? 'border-amber-500/50' 
                    : 'border-muted'
                )}
              >
                {/* Level marker */}
                <div
                  className={cn(
                    'absolute -left-[9px] w-4 h-4 rounded-full flex items-center justify-center',
                    isUnlocked
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'bg-amber-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isUnlocked ? (
                    <Unlock className="w-2.5 h-2.5" />
                  ) : (
                    <Lock className="w-2.5 h-2.5" />
                  )}
                </div>

                {/* Level label */}
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'text-xs font-bold',
                      isUnlocked ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    NÍVEL {milestoneLevel}
                  </span>
                  {isUnlocked && (
                    <Badge variant="outline" className="text-[10px] h-4 bg-primary/10 text-primary border-primary/30">
                      Desbloqueado
                    </Badge>
                  )}
                </div>

                {/* Features at this level */}
                <div className="space-y-1">
                  {features.map((feature) => {
                    const featureUnlocked = isUnlocked || (isPremium && feature.isPremiumOverride);

                    return (
                      <div
                        key={feature.key}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-md transition-all',
                          featureUnlocked
                            ? 'bg-primary/10'
                            : 'bg-muted/30 opacity-60'
                        )}
                      >
                        <span className="text-lg">{feature.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                'text-sm font-medium truncate',
                                featureUnlocked ? 'text-foreground' : 'text-muted-foreground'
                              )}
                            >
                              {feature.name}
                            </span>
                            {feature.isPremiumOverride && (
                              <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {feature.description}
                          </p>
                        </div>
                        {featureUnlocked ? (
                          <Unlock className="w-4 h-4 text-primary flex-shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-3 text-center">
          <p className="text-sm font-medium">
            {unlockedFeatures.length} de {FEATURE_UNLOCKS.length} recursos desbloqueados
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Continue ganhando XP para desbloquear mais!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
