import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, TrendingUp, TrendingDown, Loader2, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSound } from '@/contexts/SoundContext';
import { getNarrativeSound } from '@/lib/soundEffects';
import { calculateImpact } from '@/lib/narrativeConfig';
import { useProfile } from '@/hooks/useProfile';
import type { SupportedCurrency } from '@/i18n';
import { getCategoryTranslationKey } from '@/lib/gameLogic';

interface TransactionFeedbackProps {
  message: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  currency: string;
  narrative?: string | null;
  isLoadingNarrative?: boolean;
  onDismiss: () => void;
}

export const TransactionFeedback = ({
  message,
  type,
  category,
  amount,
  currency,
  narrative,
  isLoadingNarrative = false,
  onDismiss,
}: TransactionFeedbackProps) => {
  const { t } = useTranslation();
  const { formatConverted, formatCurrency } = useCurrency();
  const { playSound } = useSound();
  const { profile } = useProfile();
  const [isVisible, setIsVisible] = useState(false);
  const [displayedNarrative, setDisplayedNarrative] = useState('');
  const [isTypewriterComplete, setIsTypewriterComplete] = useState(false);
  
  // Translate category name if it's a default category
  const translationKey = getCategoryTranslationKey(category, type);
  const displayCategory = translationKey ? t(`transactions.categories.${translationKey}`) : category;

  // Calculate impact for sound effect
  const monthlyAverage = type === 'EXPENSE' 
    ? (profile?.total_expenses || 1000) / Math.max(1, 3)
    : (profile?.total_income || 5000) / Math.max(1, 3);
  const impact = calculateImpact(amount, monthlyAverage);

  // Generate fallback narrative if none provided
  const getFallbackNarrative = useCallback(() => {
    const formattedValue = formatCurrency(amount);
    if (type === 'INCOME') {
      if (amount >= 1000) return t('narrative.fallback.incomeLarge', { value: formattedValue });
      if (amount >= 100) return t('narrative.fallback.incomeMedium', { value: formattedValue });
      return t('narrative.fallback.incomeSmall', { value: formattedValue });
    } else {
      if (impact === 'critical') return t('narrative.fallback.expenseCritical', { value: formattedValue });
      if (impact === 'high') return t('narrative.fallback.expenseLarge', { value: formattedValue });
      if (impact === 'medium') return t('narrative.fallback.expenseMedium', { value: formattedValue });
      return t('narrative.fallback.expenseSmall', { value: formattedValue });
    }
  }, [amount, type, impact, formatCurrency, t]);

  const finalNarrative = narrative || getFallbackNarrative();

  // Typewriter effect for narrative
  useEffect(() => {
    if (isLoadingNarrative || !finalNarrative) return;
    
    let index = 0;
    const speed = 15; // ms per character
    
    setDisplayedNarrative('');
    setIsTypewriterComplete(false);

    const timer = setInterval(() => {
      if (index < finalNarrative.length) {
        setDisplayedNarrative(finalNarrative.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsTypewriterComplete(true);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [finalNarrative, isLoadingNarrative]);

  // Play sound on mount
  useEffect(() => {
    const soundType = getNarrativeSound(type, impact, category, amount);
    playSound(soundType);
  }, [playSound, type, impact, category, amount]);

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Auto-dismiss after narrative is read (longer for narratives)
    const dismissTime = finalNarrative ? Math.max(8000, finalNarrative.length * 40) : 8000;
    const dismissTimer = setTimeout(() => {
      if (isTypewriterComplete) {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }
    }, dismissTime);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss, finalNarrative, isTypewriterComplete]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const handleClick = () => {
    if (!isTypewriterComplete) {
      // Skip to end of typewriter
      setDisplayedNarrative(finalNarrative);
      setIsTypewriterComplete(true);
    }
  };

  const isIncome = type === 'INCOME';
  
  return (
    <Card
      className={`
        relative overflow-hidden transition-all duration-300 ease-out cursor-pointer
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        ${isIncome 
          ? 'bg-gradient-to-br from-emerald-500/15 via-green-500/10 to-teal-500/5 border-emerald-500/40' 
          : impact === 'critical'
            ? 'bg-gradient-to-br from-red-500/15 via-orange-500/10 to-amber-500/5 border-red-500/40'
            : impact === 'high'
              ? 'bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-yellow-500/5 border-orange-500/40'
              : 'bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-orange-500/5 border-amber-500/40'
        }
      `}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon with animation */}
          <div className={`
            flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
            ${isIncome 
              ? 'bg-emerald-500/20 text-emerald-500' 
              : impact === 'critical' || impact === 'high'
                ? 'bg-orange-500/20 text-orange-500'
                : 'bg-amber-500/20 text-amber-500'
            }
            animate-pulse
          `}>
            {isLoadingNarrative ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isIncome ? (
              <Sparkles className="w-6 h-6" />
            ) : (
              <TrendingDown className="w-6 h-6" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`
                text-base font-bold
                ${isIncome ? 'text-emerald-500' : 'text-orange-500'}
              `}>
                {isIncome ? '+' : '-'}{formatConverted(amount, currency as SupportedCurrency)}
              </span>
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted/50 rounded-full">
                {displayCategory}
              </span>
            </div>
            
            {/* Narrative with typewriter effect */}
            <div className="text-sm text-foreground/90 leading-relaxed min-h-[60px]">
              {isLoadingNarrative ? (
                <span className="text-muted-foreground italic">
                  {t('narrative.generatingNarrative')}
                </span>
              ) : (
                <>
                  {displayedNarrative}
                  {!isTypewriterComplete && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary animate-pulse" />
                  )}
                </>
              )}
            </div>

            {/* Tap to continue hint */}
            {isTypewriterComplete && (
              <p className="mt-2 text-xs text-muted-foreground animate-pulse">
                {t('narrative.tapToContinue')}
              </p>
            )}
          </div>

          {/* Dismiss button */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress bar for auto-dismiss */}
        {isTypewriterComplete && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30">
            <div 
              className={`h-full ${isIncome ? 'bg-emerald-500/50' : 'bg-orange-500/50'} animate-[shrink_8s_linear_forwards]`}
              style={{ width: '100%' }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};
