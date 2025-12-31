import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { SupportedCurrency } from '@/i18n';
import { getCategoryTranslationKey } from '@/lib/gameLogic';

interface TransactionFeedbackProps {
  message: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  currency: string;
  onDismiss: () => void;
}

export const TransactionFeedback = ({
  message,
  type,
  category,
  amount,
  currency,
  onDismiss,
}: TransactionFeedbackProps) => {
  const { t } = useTranslation();
  const { formatConverted } = useCurrency();
  const [isVisible, setIsVisible] = useState(false);
  
  // Translate category name if it's a default category
  const translationKey = getCategoryTranslationKey(category, type);
  const displayCategory = translationKey ? t(`transactions.categories.${translationKey}`) : category;

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Auto-dismiss after 8 seconds
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 8000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const isIncome = type === 'INCOME';
  
  return (
    <Card
      className={`
        relative overflow-hidden transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        ${isIncome 
          ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30' 
          : 'bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30'
        }
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`
            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            ${isIncome ? 'bg-emerald-500/20 text-emerald-500' : 'bg-orange-500/20 text-orange-500'}
          `}>
            {isIncome ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`
                text-sm font-semibold
                ${isIncome ? 'text-emerald-500' : 'text-orange-500'}
              `}>
                {isIncome ? '+' : '-'}{formatConverted(amount, currency as SupportedCurrency)}
              </span>
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted/50 rounded-full">
                {displayCategory}
              </span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Dismiss button */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress bar for auto-dismiss */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30">
          <div 
            className={`h-full ${isIncome ? 'bg-emerald-500/50' : 'bg-orange-500/50'} animate-[shrink_8s_linear_forwards]`}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </Card>
  );
};
