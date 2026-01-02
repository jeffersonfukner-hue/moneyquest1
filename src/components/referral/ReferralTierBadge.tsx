import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';

interface TierInfo {
  tier: 'none' | 'bronze' | 'silver' | 'gold';
  tier_icon: string;
  next_tier: string | null;
  next_tier_icon: string | null;
  progress_to_next: number;
  remaining: number;
  completed_count: number;
}

interface ReferralTierBadgeProps {
  tierInfo: TierInfo | null;
  isLoading: boolean;
}

const tierColors = {
  none: 'bg-muted text-muted-foreground',
  bronze: 'bg-amber-700/20 text-amber-700 border-amber-700/30',
  silver: 'bg-slate-400/20 text-slate-500 border-slate-400/30',
  gold: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
};

const tierGradients = {
  none: 'from-muted/30 via-muted/10 to-transparent',
  bronze: 'from-amber-700/20 via-amber-700/10 to-transparent',
  silver: 'from-slate-400/20 via-slate-400/10 to-transparent',
  gold: 'from-yellow-500/20 via-yellow-500/10 to-transparent',
};

export const ReferralTierBadge = ({ tierInfo, isLoading }: ReferralTierBadgeProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!tierInfo) return null;

  const tier = tierInfo.tier as keyof typeof tierColors;

  return (
    <Card className={`bg-gradient-to-br ${tierGradients[tier]} border-2 ${tier === 'gold' ? 'border-yellow-500/30' : tier === 'silver' ? 'border-slate-400/30' : tier === 'bronze' ? 'border-amber-700/30' : 'border-border'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            {t('referral.tier.title', 'Seu Nível')}
          </span>
          <Badge variant="outline" className={tierColors[tier]}>
            <span className="mr-1">{tierInfo.tier_icon}</span>
            {t(`referral.tier.${tier}`, tier.charAt(0).toUpperCase() + tier.slice(1))}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t('referral.tier.completedReferrals', 'Indicações válidas:')}
          </span>
          <span className="font-bold">{tierInfo.completed_count}</span>
        </div>

        {tierInfo.next_tier && (
          <>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {t('referral.tier.progressTo', 'Progresso para')} {tierInfo.next_tier_icon} {t(`referral.tier.${tierInfo.next_tier}`, tierInfo.next_tier)}
                </span>
                <span className="font-medium">{tierInfo.progress_to_next}%</span>
              </div>
              <Progress value={tierInfo.progress_to_next} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {t('referral.tier.remaining', 'Faltam {{count}} indicações', { count: tierInfo.remaining })}
            </p>
          </>
        )}

        {tier === 'gold' && (
          <p className="text-xs text-center text-yellow-600 font-medium">
            🏆 {t('referral.tier.maxLevel', 'Você atingiu o nível máximo!')}
          </p>
        )}

        {/* Tier benefits */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">
            {t('referral.tier.benefits', 'Recompensas por indicação:')}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 rounded bg-background/50">
              <span className="font-bold text-primary">+500</span>
              <span className="text-muted-foreground ml-1">XP</span>
            </div>
            <div className="text-center p-2 rounded bg-background/50">
              <span className="font-bold text-accent">+7</span>
              <span className="text-muted-foreground ml-1">{t('referral.tier.premiumDays', 'dias Premium')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
