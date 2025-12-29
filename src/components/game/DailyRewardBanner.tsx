import { useTranslation } from 'react-i18next';
import { Gift, Flame, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDailyReward } from '@/hooks/useDailyReward';
import { cn } from '@/lib/utils';

interface DailyRewardBannerProps {
  onClaimClick: () => void;
}

export const DailyRewardBanner = ({ onClaimClick }: DailyRewardBannerProps) => {
  const { t } = useTranslation();
  const { status, loading } = useDailyReward();

  if (loading || !status) return null;

  // Only show if reward is claimable
  if (!status.can_claim) {
    // Show small streak indicator instead
    if (status.current_streak > 0) {
      return (
        <Card className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/20">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-sm">
                {status.current_streak} {t('dailyReward.dayStreak', 'Day Streak')}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span>{status.multiplier}x {t('dailyReward.multiplier', 'Multiplier')}</span>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  return (
    <Card className={cn(
      "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20",
      "animate-pulse hover:animate-none transition-all cursor-pointer"
    )} onClick={onClaimClick}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
              <Gift className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm">{t('dailyReward.available', 'Daily Reward Available!')}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>+{Math.floor(25 * status.multiplier)} XP</span>
                {status.multiplier > 1 && (
                  <span className="text-primary font-medium">({status.multiplier}x)</span>
                )}
                {status.current_streak > 0 && (
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    {status.current_streak + 1}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button size="sm" className="gap-1">
            <Gift className="w-4 h-4" />
            {t('dailyReward.claim', 'Claim')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
