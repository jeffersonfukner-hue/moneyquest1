import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Quest, Badge } from '@/types/database';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { QUEST_TYPE_CONFIG } from '@/lib/gameLogic';

interface QuestCelebrationProps {
  completedQuest: Quest | null;
  unlockedBadge: Badge | null;
  onClose: () => void;
}

export const QuestCelebration = ({ completedQuest, unlockedBadge, onClose }: QuestCelebrationProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (completedQuest || unlockedBadge) {
      setIsOpen(true);
      triggerCelebration();
    }
  }, [completedQuest, unlockedBadge]);

  const triggerCelebration = () => {
    // Fire confetti from both sides
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti from left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB']
      });

      // Confetti from right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB']
      });
    }, 250);

    // Badge unlock special burst
    if (unlockedBadge) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFC107', '#FFEB3B'],
          zIndex: 9999
        });
      }, 500);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (!completedQuest && !unlockedBadge) return null;

  const questConfig = completedQuest ? QUEST_TYPE_CONFIG[completedQuest.type] : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
        <div className="relative flex flex-col items-center justify-center py-8 px-4">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent animate-pulse" />
          
          {/* Quest completion */}
          {completedQuest && (
            <div className="relative z-10 flex flex-col items-center text-center animate-scale-in">
              <div className="text-6xl mb-4 animate-bounce">
                {questConfig?.icon || '🎉'}
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Quest Complete!
              </h2>
              <p className="text-lg text-muted-foreground mb-4">
                {completedQuest.title}
              </p>
              <div className="flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
                <span className="text-primary font-bold">+{completedQuest.xp_reward} XP</span>
              </div>
            </div>
          )}

          {/* Badge unlock */}
          {unlockedBadge && (
            <div className={`relative z-10 flex flex-col items-center text-center ${completedQuest ? 'mt-8 pt-6 border-t border-border' : ''} animate-scale-in`} style={{ animationDelay: completedQuest ? '0.3s' : '0s' }}>
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl animate-pulse" />
                <div className="relative text-7xl mb-4 animate-bounce" style={{ animationDelay: '0.2s' }}>
                  {unlockedBadge.icon}
                </div>
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-1">
                Badge Unlocked!
              </h3>
              <p className="text-lg font-semibold text-primary mb-2">
                {unlockedBadge.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {unlockedBadge.description}
              </p>
            </div>
          )}

          {/* Continue button */}
          <button
            onClick={handleClose}
            className="mt-8 px-8 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
          >
            Continue
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
