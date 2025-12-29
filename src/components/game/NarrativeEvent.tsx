import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { IMPACT_COLORS, IMPACT_ICONS, INCOME_ICONS } from '@/lib/narrativeConfig';
import { useSound } from '@/contexts/SoundContext';

interface NarrativeEventProps {
  narrative: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  eventType: 'INCOME' | 'EXPENSE';
  category?: string;
  onClose: () => void;
}

export const NarrativeEvent = ({ 
  narrative, 
  impact, 
  eventType, 
  category,
  onClose 
}: NarrativeEventProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const { playSound } = useSound();

  // Typewriter effect
  useEffect(() => {
    if (!narrative) return;

    let index = 0;
    const speed = 20; // ms per character

    const timer = setInterval(() => {
      if (index < narrative.length) {
        setDisplayedText(narrative.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsComplete(true);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [narrative]);

  // Play sound on mount
  useEffect(() => {
    playSound('click');
  }, [playSound]);

  // Auto-close after reading time
  useEffect(() => {
    if (!isComplete) return;

    const readingTime = Math.max(3000, narrative.length * 50);
    const timer = setTimeout(onClose, readingTime);

    return () => clearTimeout(timer);
  }, [isComplete, narrative, onClose]);

  const handleClick = useCallback(() => {
    if (!isComplete) {
      // Skip to end
      setDisplayedText(narrative);
      setIsComplete(true);
    } else {
      onClose();
    }
  }, [isComplete, narrative, onClose]);

  const icon = eventType === 'INCOME' 
    ? (category && INCOME_ICONS[category as keyof typeof INCOME_ICONS]) || '💰'
    : IMPACT_ICONS[impact];

  const gradientClass = eventType === 'INCOME'
    ? 'from-emerald-500/30 to-emerald-600/20'
    : IMPACT_COLORS[impact];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
      onClick={handleClick}
    >
      <div 
        className={`
          relative max-w-md w-full p-6 rounded-2xl border border-border/50
          bg-gradient-to-br ${gradientClass}
          shadow-2xl backdrop-blur-md
          animate-scale-in
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-background/20 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Icon */}
        <div className="text-4xl mb-4 animate-bounce">
          {icon}
        </div>

        {/* Narrative text */}
        <div className="text-foreground font-medium leading-relaxed whitespace-pre-line min-h-[100px]">
          {displayedText}
          {!isComplete && (
            <span className="inline-block w-2 h-5 ml-1 bg-primary animate-pulse" />
          )}
        </div>

        {/* Tap to continue hint */}
        {isComplete && (
          <p className="mt-4 text-xs text-muted-foreground text-center animate-pulse">
            Tap to continue
          </p>
        )}
      </div>
    </div>
  );
};
