import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Crown, Sparkles, Trophy } from 'lucide-react';

interface TierUpgradeCelebrationProps {
  newTier: 'bronze' | 'silver' | 'gold' | null;
  onClose: () => void;
}

const tierConfig = {
  bronze: {
    icon: '🥉',
    colors: ['#CD7F32', '#8B4513', '#D2691E', '#F4A460'],
    gradient: 'from-amber-700/30 via-amber-600/20 to-transparent',
    xp: 500,
    days: 7,
  },
  silver: {
    icon: '🥈',
    colors: ['#C0C0C0', '#A8A8A8', '#D3D3D3', '#E8E8E8'],
    gradient: 'from-slate-400/30 via-slate-300/20 to-transparent',
    xp: 600,
    days: 8,
  },
  gold: {
    icon: '🥇',
    colors: ['#FFD700', '#FFC107', '#FFEB3B', '#F4B400'],
    gradient: 'from-yellow-500/30 via-yellow-400/20 to-transparent',
    xp: 750,
    days: 10,
  },
};

const triggerTierConfetti = (tier: 'bronze' | 'silver' | 'gold') => {
  const config = tierConfig[tier];
  const duration = 4000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 35, spread: 360, ticks: 80, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  // Initial big burst from center
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { x: 0.5, y: 0.5 },
    colors: config.colors,
    zIndex: 9999,
  });

  // Continuous confetti rain
  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 60 * (timeLeft / duration);

    // Confetti from left
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: config.colors,
    });

    // Confetti from right
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: config.colors,
    });
  }, 200);

  // Special gold burst for gold tier
  if (tier === 'gold') {
    setTimeout(() => {
      confetti({
        particleCount: 200,
        spread: 180,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFC107', '#FFEB3B', '#FFD700'],
        shapes: ['star'],
        scalar: 1.5,
        zIndex: 9999,
      });
    }, 800);
  }
};

export const TierUpgradeCelebration = ({ newTier, onClose }: TierUpgradeCelebrationProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (newTier) {
      setIsOpen(true);
      triggerTierConfetti(newTier);
    }
  }, [newTier]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (!newTier) return null;

  const config = tierConfig[newTier];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
        <div className="relative flex flex-col items-center justify-center py-8 px-4">
          {/* Animated background glow */}
          <div className={`pointer-events-none absolute inset-0 bg-gradient-radial ${config.gradient} animate-pulse`} />
          
          {/* Trophy icon */}
          <div className="relative z-10 flex flex-col items-center text-center animate-scale-in">
            <div className="relative">
              <div className={`absolute inset-0 rounded-full blur-2xl animate-pulse ${
                newTier === 'gold' ? 'bg-yellow-400/40' : 
                newTier === 'silver' ? 'bg-slate-300/40' : 
                'bg-amber-600/40'
              }`} />
              <div className="relative text-8xl mb-4 animate-bounce">
                {config.icon}
              </div>
            </div>

            {/* Title */}
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className={`h-5 w-5 ${
                newTier === 'gold' ? 'text-yellow-500' : 
                newTier === 'silver' ? 'text-slate-400' : 
                'text-amber-600'
              }`} />
              <h2 className="text-2xl font-display font-bold text-foreground">
                {t('referral.tierCelebration.title', 'Novo Nível Desbloqueado!')}
              </h2>
              <Sparkles className={`h-5 w-5 ${
                newTier === 'gold' ? 'text-yellow-500' : 
                newTier === 'silver' ? 'text-slate-400' : 
                'text-amber-600'
              }`} />
            </div>

            {/* Tier name */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
              newTier === 'gold' ? 'bg-yellow-500/20 text-yellow-600' : 
              newTier === 'silver' ? 'bg-slate-400/20 text-slate-500' : 
              'bg-amber-700/20 text-amber-700'
            }`}>
              <Trophy className="h-5 w-5" />
              <span className="text-xl font-bold">
                {t(`referral.tier.${newTier}`, newTier.charAt(0).toUpperCase() + newTier.slice(1))}
              </span>
            </div>

            {/* Description */}
            <p className="text-muted-foreground mb-6 text-center max-w-xs">
              {t('referral.tierCelebration.description', 'Parabéns! Você subiu de nível no programa de indicação e desbloqueou novas recompensas!')}
            </p>

            {/* New rewards */}
            <div className="w-full p-4 rounded-lg bg-muted/50 mb-6">
              <p className="text-sm text-muted-foreground mb-3 text-center">
                {t('referral.tierCelebration.newRewards', 'Suas novas recompensas por indicação:')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-background">
                  <span className="text-2xl font-bold text-primary">+{config.xp}</span>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background">
                  <span className="text-2xl font-bold text-accent">+{config.days}</span>
                  <p className="text-xs text-muted-foreground">
                    {t('referral.tier.premiumDays', 'dias Premium')}
                  </p>
                </div>
              </div>
            </div>

            {/* Badge unlocked notification */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Crown className="h-4 w-4 text-primary" />
              <span>{t('referral.tierCelebration.badgeUnlocked', 'Badge de tier desbloqueado!')}</span>
            </div>
          </div>

          {/* Continue button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className={`relative z-10 px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 ${
              newTier === 'gold' 
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {t('common.continue', 'Continuar')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
