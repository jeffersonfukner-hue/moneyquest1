import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FallbackPromoProps {
  onDismiss?: () => void;
}

export const FallbackPromo = ({ onDismiss }: FallbackPromoProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between w-full px-4 py-2 bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/20 dark:from-amber-500/10 dark:via-amber-400/5 dark:to-amber-500/10">
      <div className="flex items-center gap-2 min-w-0">
        <Crown className="w-5 h-5 text-amber-500 shrink-0" />
        <span className="text-sm font-medium truncate">
          {t('ads.goPremiumRemoveAds')}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          onClick={() => navigate('/upgrade')}
          className="h-8 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 border-0"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          {t('subscription.upgrade')}
        </Button>
        {onDismiss && (
          <button 
            onClick={onDismiss} 
            className="p-1.5 hover:bg-foreground/10 rounded-full transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};
