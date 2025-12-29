import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, Flame, Sparkles, X, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDailyReward, ClaimResult } from '@/hooks/useDailyReward';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface DailyRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STREAK_DAYS = [
  { day: 1, multiplier: 1.0, icon: '🎁' },
  { day: 2, multiplier: 1.2, icon: '🎁' },
  { day: 3, multiplier: 1.5, icon: '🎁' },
  { day: 4, multiplier: 1.8, icon: '🎁' },
  { day: 5, multiplier: 2.0, icon: '🎁' },
  { day: 6, multiplier: 2.3, icon: '🎁' },
  { day: 7, multiplier: 2.5, icon: '🏆' },
];

export const DailyRewardDialog = ({ open, onOpenChange }: DailyRewardDialogProps) => {
  const { t } = useTranslation();
  const { status, claiming, claimReward } = useDailyReward();
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleClaim = async () => {
    const result = await claimReward();
    if (result?.success) {
      setClaimResult(result);
      setShowResult(true);
      
      // Trigger confetti for streak milestones
      if (result.streak_day && result.streak_day >= 3) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  };

  const handleClose = () => {
    setShowResult(false);
    setClaimResult(null);
    onOpenChange(false);
  };

  if (!status) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden bg-gradient-to-b from-card to-background border-border/50">
        <DialogTitle className="sr-only">
          {t('dailyReward.title', 'Daily Reward')}
        </DialogTitle>
        
        {!showResult ? (
          <>
            {/* Header */}
            <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-6 text-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
              
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/30">
                <Gift className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold">{t('dailyReward.title', 'Daily Reward')}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {status.can_claim 
                  ? t('dailyReward.claimNow', 'Claim your reward!')
                  : t('dailyReward.comeBackTomorrow', 'Come back tomorrow!')
                }
              </p>
            </div>

            {/* Streak Display */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-bold text-lg">
                  {status.current_streak} {t('dailyReward.dayStreak', 'Day Streak')}
                </span>
              </div>

              {/* Streak Calendar */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {STREAK_DAYS.map((day) => {
                  const isPast = day.day <= status.current_streak;
                  const isCurrent = day.day === status.potential_streak && status.can_claim;
                  const isFuture = day.day > status.potential_streak;
                  
                  return (
                    <div 
                      key={day.day}
                      className={cn(
                        "flex flex-col items-center p-2 rounded-lg transition-all",
                        isPast && "bg-primary/20",
                        isCurrent && "bg-primary/30 ring-2 ring-primary animate-pulse",
                        isFuture && "bg-muted/30 opacity-50"
                      )}
                    >
                      <span className="text-lg">{day.icon}</span>
                      <span className="text-[10px] font-medium mt-0.5">
                        {day.multiplier}x
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        Day {day.day}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Current Reward Info */}
              <div className="bg-muted/30 rounded-lg p-3 text-center mb-4">
                <p className="text-sm text-muted-foreground mb-1">
                  {t('dailyReward.todayReward', "Today's Reward")}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold text-primary">
                    +{Math.floor(25 * status.multiplier)} XP
                  </span>
                </div>
                {status.multiplier > 1 && (
                  <p className="text-xs text-primary mt-1">
                    ({status.multiplier}x {t('dailyReward.streakBonus', 'Streak Bonus!')})
                  </p>
                )}
              </div>
            </div>

            {/* Claim Button */}
            <div className="p-4 pt-0">
              <Button 
                className="w-full h-12 text-lg gap-2"
                onClick={handleClaim}
                disabled={!status.can_claim || claiming}
              >
                {claiming ? (
                  t('common.loading')
                ) : status.can_claim ? (
                  <>
                    <Gift className="w-5 h-5" />
                    {t('dailyReward.claim', 'Claim Reward')}
                  </>
                ) : (
                  t('dailyReward.claimed', 'Already Claimed')
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Claim Result */}
            <div className="p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">
                {t('dailyReward.congratulations', 'Congratulations!')}
              </h2>
              
              <div className="space-y-3 my-6">
                <div className="bg-primary/10 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    {t('dailyReward.youEarned', 'You earned')}
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    +{claimResult?.total_xp} XP
                  </p>
                  {claimResult?.bonus_xp && claimResult.bonus_xp > 0 && (
                    <p className="text-sm text-primary mt-1">
                      (+{claimResult.bonus_xp} {t('dailyReward.bonusXP', 'bonus XP')})
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="font-bold">
                    {claimResult?.streak_day} {t('dailyReward.dayStreak', 'Day Streak')}
                  </span>
                </div>

                {claimResult?.next_multiplier && claimResult.next_multiplier > (claimResult.multiplier || 1) && (
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    {t('dailyReward.tomorrowMultiplier', 'Tomorrow:')} 
                    <span className="font-bold text-primary">{claimResult.next_multiplier}x XP</span>
                    <ChevronRight className="w-4 h-4" />
                  </p>
                )}

                {claimResult?.streak_broken && (
                  <p className="text-sm text-orange-500">
                    {t('dailyReward.streakReset', 'Streak was reset - keep it going!')}
                  </p>
                )}
              </div>

              <Button className="w-full" onClick={handleClose}>
                {t('common.awesome', 'Awesome!')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
