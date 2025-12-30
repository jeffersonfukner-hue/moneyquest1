import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, TrendingUp, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { XPChange } from '@/hooks/useRealtimeXP';
import { getLevelTitleKey } from '@/lib/gameLogic';

interface XPNotificationProps {
  xpChange: XPChange | null;
  onDismiss: () => void;
}

export const XPNotification = ({ xpChange, onDismiss }: XPNotificationProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (xpChange) {
      setIsVisible(true);
      setIsExiting(false);
      
      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [xpChange]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
  };

  if (!isVisible || !xpChange) return null;

  return (
    <div
      className={cn(
        "fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%]",
        "animate-in fade-in-0 slide-in-from-top-4 duration-300",
        isExiting && "animate-out fade-out-0 slide-out-to-top-4 duration-300"
      )}
    >
      <div
        onClick={handleDismiss}
        className={cn(
          "relative overflow-hidden rounded-2xl cursor-pointer",
          "shadow-lg shadow-primary/20",
          xpChange.levelUp
            ? "bg-gradient-to-br from-amber-500/90 via-yellow-500/90 to-orange-500/90"
            : "bg-gradient-to-br from-primary/90 via-primary/80 to-accent/90",
          "backdrop-blur-sm border border-white/20"
        )}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative p-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              xpChange.levelUp
                ? "bg-white/20"
                : "bg-white/10"
            )}>
              {xpChange.levelUp ? (
                <Crown className="w-6 h-6 text-white" />
              ) : (
                <Sparkles className="w-6 h-6 text-white" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              {xpChange.levelUp ? (
                <>
                  <p className="text-white font-bold text-lg">
                    {t('notification.levelUp')}
                  </p>
                  <p className="text-white/90 text-sm">
                    {t('notification.nowLevel', { level: xpChange.currentLevel })}
                    {xpChange.levelUp && ` - ${t(`levels.${getLevelTitleKey(xpChange.currentLevel)}`)}`}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-white font-bold text-lg flex items-center gap-2">
                    +{xpChange.xpGained} XP
                    <TrendingUp className="w-4 h-4" />
                  </p>
                  <p className="text-white/80 text-sm">
                    {t('notification.totalXP', { total: xpChange.currentXP.toLocaleString() })}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Progress indicator for level up */}
          {xpChange.levelUp && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full animate-pulse"
                  style={{ width: '100%' }}
                />
              </div>
              <span className="text-white/90 text-xs font-medium">
                Lv.{xpChange.currentLevel}
              </span>
            </div>
          )}
        </div>

        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
      </div>
    </div>
  );
};
