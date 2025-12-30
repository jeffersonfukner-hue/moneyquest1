import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface FallbackPromoProps {
  onDismiss?: () => void;
  onUpgradeClick?: () => void;
}

export const FallbackPromo = ({ onDismiss, onUpgradeClick }: FallbackPromoProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBannerClick = () => {
    onUpgradeClick?.();
    navigate('/premium');
  };

  const handleDismissClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.();
  };

  return (
    <div 
      onClick={handleBannerClick}
      className="flex items-center justify-between w-full h-full px-4 cursor-pointer bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/20 dark:from-amber-500/10 dark:via-amber-400/5 dark:to-amber-500/10 hover:from-amber-500/30 hover:via-amber-400/25 hover:to-amber-500/30 dark:hover:from-amber-500/20 dark:hover:via-amber-400/15 dark:hover:to-amber-500/20 transition-colors"
    >
      <div className="flex flex-col justify-center py-1 min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground truncate">
          {t('ads.bannerTitle')}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {t('ads.bannerDescription')}
        </span>
      </div>
      {onDismiss && (
        <button 
          onClick={handleDismissClick} 
          className="p-1.5 hover:bg-foreground/10 rounded-full transition-colors shrink-0 ml-2"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};
