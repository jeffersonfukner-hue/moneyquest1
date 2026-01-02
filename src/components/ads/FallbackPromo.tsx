import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useABTest } from '@/hooks/useABTest';

interface FallbackPromoProps {
  onDismiss?: () => void;
  onUpgradeClick?: () => void;
}

export const FallbackPromo = ({ onDismiss, onUpgradeClick }: FallbackPromoProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { variant, trackImpression, trackClick } = useABTest('bannerCopy');

  useEffect(() => {
    trackImpression();
  }, [trackImpression]);

  const handleBannerClick = () => {
    trackClick({ action: 'banner_click', variant });
    onUpgradeClick?.();
    navigate('/premium');
  };

  const handleDismissClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackClick({ action: 'dismiss_click', variant });
    onDismiss?.();
  };

  const isTwoLine = variant === 'two_line';

  return (
    <div 
      onClick={handleBannerClick}
      className="relative flex items-center justify-between w-full h-full px-4 cursor-pointer overflow-hidden bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/20 dark:from-amber-500/10 dark:via-amber-400/5 dark:to-amber-500/10 hover:from-amber-500/30 hover:via-amber-400/25 hover:to-amber-500/30 dark:hover:from-amber-500/20 dark:hover:via-amber-400/15 dark:hover:to-amber-500/20 transition-colors"
    >
      {/* Shimmer overlay */}
      <div 
        className="absolute inset-0 animate-shimmer pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
      />
      
      <div className="flex flex-col justify-center py-1 min-w-0 flex-1 relative z-10">
        {isTwoLine ? (
          <>
            <span className="text-sm font-medium text-foreground truncate">
              {t('ads.premiumBannerTitle')}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {t('ads.premiumBannerDescription')}
            </span>
          </>
        ) : (
          <span className="text-sm font-medium text-foreground">
            ✨ {t('ads.goPremiumRemoveAds')}
          </span>
        )}
      </div>
      {onDismiss && (
        <button 
          onClick={handleDismissClick} 
          className="p-1.5 hover:bg-foreground/10 rounded-full transition-colors shrink-0 ml-2 relative z-10"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};
