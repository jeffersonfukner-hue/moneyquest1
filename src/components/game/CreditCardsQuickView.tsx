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
      {/* Header row */}
      <div className="grid grid-cols-3 text-[9px] sm:text-[10px] text-muted-foreground mb-1 px-1">
        <span>{t('creditCards.card', 'Cartão')}</span>
        <span className="text-center">{t('creditCards.available', 'Disponível')}</span>
        <span className="text-right">{t('creditCards.used', 'Usado')}</span>
      </div>
      {/* Card rows */}
      <div className="space-y-1">
        {activeCards.map((card) => {
          const usedLimit = card.total_limit - card.available_limit;
          return (
            <div key={card.id} className="grid grid-cols-3 items-center px-1 py-0.5 bg-muted/30 rounded">
              <div className="flex items-center gap-1 min-w-0">
                <CreditCard className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium truncate">{card.name}</span>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-success text-center">
                {formatCurrency(card.available_limit)}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-destructive text-right">
                {formatCurrency(usedLimit)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
