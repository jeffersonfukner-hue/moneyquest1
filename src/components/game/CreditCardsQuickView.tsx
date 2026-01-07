import { CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCreditCards } from '@/hooks/useCreditCards';

export const CreditCardsQuickView = () => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { activeCards, loading } = useCreditCards();

  if (loading || activeCards.length === 0) return null;

  return (
    <div className="bg-card rounded-xl p-2 shadow-md border border-border animate-slide-up">
      <div className="flex items-center gap-1.5 mb-1.5 px-1">
        <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
          {t('creditCards.available', 'Limite disponível')}
        </span>
      </div>
      <div className={`grid gap-1 ${activeCards.length === 1 ? 'grid-cols-1' : activeCards.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {activeCards.slice(0, 3).map((card) => (
          <div key={card.id} className="flex flex-col items-center text-center px-0.5 sm:px-1 py-1 bg-muted/30 rounded-lg">
            <p className="text-[10px] sm:text-xs font-medium text-foreground truncate w-full">
              {card.name}
            </p>
            <p className="text-[11px] sm:text-sm font-bold text-primary truncate w-full">
              {formatCurrency(card.available_limit)}
            </p>
          </div>
        ))}
      </div>
      {activeCards.length > 3 && (
        <p className="text-[9px] text-muted-foreground text-center mt-1">
          +{activeCards.length - 3} {t('common.more', 'mais')}
        </p>
      )}
    </div>
  );
};
