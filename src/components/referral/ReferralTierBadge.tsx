import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

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

// Tier-based rewards
const tierRewards = {
  none: { xp: 500, days: 7 },
  bronze: { xp: 500, days: 7 },
  silver: { xp: 600, days: 8 },
  gold: { xp: 750, days: 10 },
};

// Generate random particles for Gold tier
const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 2,
    size: 3 + Math.random() * 4,
  }));
};

export const ReferralTierBadge = ({ tierInfo, isLoading }: ReferralTierBadgeProps) => {
  const { t } = useTranslation();
  const [hasAnimated, setHasAnimated] = useState(false);
  const [particles] = useState(() => generateParticles(8));

  useEffect(() => {
    if (tierInfo?.tier === 'gold' && !hasAnimated) {
      // Trigger entrance animation
      const timer = setTimeout(() => setHasAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [tierInfo?.tier, hasAnimated]);

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
    <Card className={cn(
      `bg-gradient-to-br ${tierGradients[tier]} border-2 relative overflow-hidden`,
      tier === 'gold' ? 'border-yellow-500/50 gold-glow hover:scale-[1.02] transition-all duration-300' : 
      tier === 'silver' ? 'border-slate-400/30' : 
      tier === 'bronze' ? 'border-amber-700/30' : 'border-border',
      // Entrance animation for Gold
      tier === 'gold' && !hasAnimated && 'opacity-0 scale-95',
      tier === 'gold' && hasAnimated && 'opacity-100 scale-100 animate-gold-entrance'
    )}>
      {/* Floating particles for Gold tier */}
      {tier === 'gold' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute rounded-full bg-yellow-400"
              style={{
                width: particle.size,
                height: particle.size,
                left: `${particle.left}%`,
                bottom: '-10px',
                opacity: 0.6,
                boxShadow: '0 0 6px rgba(250, 204, 21, 0.8)',
                animation: `gold-particle-float ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
              }}
            />
          ))}
        </div>
      )}
      {/* Shimmer overlay for Gold tier */}
      {tier === 'gold' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent"
            style={{ animation: 'shimmer-sweep-gold 3s ease-in-out infinite' }}
          />
        </div>
      )}
      <CardHeader className="pb-2 relative z-10">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className={cn("h-4 w-4", tier === 'gold' && "text-yellow-500")} />
            {t('referral.tier.title', 'Seu Nível')}
          </span>
          <Badge 
            variant="outline" 
            className={cn(
              tierColors[tier],
              tier === 'gold' && 'animate-shimmer-gold gold-glow border-yellow-500'
            )}
          >
            <span className="mr-1">{tierInfo.tier_icon}</span>
            {t(`referral.tier.${tier}`, tier.charAt(0).toUpperCase() + tier.slice(1))}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 relative z-10">
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
              <span className="font-bold text-primary">+{tierRewards[tier].xp}</span>
              <span className="text-muted-foreground ml-1">XP</span>
            </div>
            <div className="text-center p-2 rounded bg-background/50">
              <span className="font-bold text-accent">+{tierRewards[tier].days}</span>
              <span className="text-muted-foreground ml-1">{t('referral.tier.premiumDays', 'dias Premium')}</span>
            </div>
          </div>
          {tier !== 'gold' && tierInfo.next_tier && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              {t('referral.tier.nextTierRewards', '{{tier}}: +{{xp}} XP, +{{days}} dias', {
                tier: t(`referral.tier.${tierInfo.next_tier}`, tierInfo.next_tier),
                xp: tierRewards[tierInfo.next_tier as keyof typeof tierRewards]?.xp || 600,
                days: tierRewards[tierInfo.next_tier as keyof typeof tierRewards]?.days || 8,
              })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
