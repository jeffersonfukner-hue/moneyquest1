import { ReactNode } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLevelAccess } from '@/hooks/useLevelAccess';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LevelLockedFeatureProps {
  featureKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  showLockOverlay?: boolean;
  className?: string;
}

/**
 * Wrapper component that locks features based on user level
 * Shows unlock requirements when locked
 */
export const LevelLockedFeature = ({ 
  featureKey, 
  children, 
  fallback,
  showLockOverlay = true,
  className 
}: LevelLockedFeatureProps) => {
  const { t } = useTranslation();
  const { canAccess, getFeatureStatus, level } = useLevelAccess();

  const hasAccess = canAccess(featureKey);
  const { requiredLevel, levelsAway, feature } = getFeatureStatus(featureKey);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showLockOverlay) {
    return (
      <div className={cn('relative', className)}>
        <div className="pointer-events-none opacity-40 blur-[1px]">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[2px] rounded-lg">
          <div className="text-center p-4 max-w-xs">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-primary/30">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold text-foreground mb-1">
              {feature?.name || t('levelLock.featureLocked')}
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              {t('levelLock.unlockAtLevel', { level: requiredLevel })}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="font-medium text-primary">
                  {t('levelLock.currentLevel', { level })}
                </span>
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="flex items-center gap-1 px-2 py-1 bg-accent/20 rounded-full">
                <span className="font-medium text-accent-foreground">
                  {t('levelLock.needLevel', { level: requiredLevel })}
                </span>
              </div>
            </div>
            {levelsAway > 0 && (
              <p className="text-[10px] text-muted-foreground mt-2">
                {t('levelLock.levelsAway', { count: levelsAway })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('text-center p-4', className)}>
      <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">
        {t('levelLock.unlockAtLevel', { level: requiredLevel })}
      </p>
    </div>
  );
};
