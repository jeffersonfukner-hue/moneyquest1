import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PremiumInternalBannerProps {
  onDismiss?: () => void;
}

export const PremiumInternalBanner = ({ onDismiss }: PremiumInternalBannerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/premium');
  };

  const handleNotNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Trigger the modal instead of actually dismissing
    onDismiss?.();
  };

  return (
    <div 
      onClick={handleClick}
      className="relative flex items-center justify-between w-full h-full px-4 cursor-pointer overflow-hidden bg-gradient-to-r from-accent/30 via-accent/20 to-accent/30 hover:from-accent/40 hover:via-accent/30 hover:to-accent/40 transition-colors"
    >
      {/* Shimmer animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
      
      <Crown className="w-5 h-5 text-accent shrink-0" />
      
      <div className="flex flex-col justify-center py-1 min-w-0 flex-1 ml-3">
        <span className="text-sm font-medium text-foreground truncate">
          {t('ads.premiumBannerTitle')}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {t('ads.premiumBannerDescription')}
        </span>
      </div>
      
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <Button 
          size="sm" 
          variant="ghost"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={handleNotNow}
        >
          {t('ads.notNow')}
        </Button>
        <Button 
          size="sm" 
          variant="gold" 
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          {t('ads.activatePremium')}
        </Button>
      </div>
    </div>
  );
};
