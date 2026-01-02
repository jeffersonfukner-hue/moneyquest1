import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReferral } from '@/hooks/useReferral';
import { ReferralShareDialog } from './ReferralShareDialog';

interface ReferralBannerProps {
  onDismiss?: () => void;
}

export const ReferralBanner = ({ onDismiss }: ReferralBannerProps) => {
  const { t } = useTranslation();
  const { referralLink } = useReferral();
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleClick = () => {
    setShowShareDialog(true);
  };

  return (
    <>
      <div 
        onClick={handleClick}
        className="relative flex items-center justify-between w-full h-full px-4 cursor-pointer overflow-hidden bg-gradient-to-r from-primary/20 via-primary/15 to-primary/20 hover:from-primary/30 hover:via-primary/25 hover:to-primary/30 transition-colors"
      >
        <Gift className="w-5 h-5 text-primary shrink-0" />
        
        <div className="flex flex-col justify-center py-1 min-w-0 flex-1 ml-3">
          <span className="text-sm font-medium text-foreground truncate">
            {t('referral.bannerTitle')}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {t('referral.bannerDescription')}
          </span>
        </div>
        
        <Button 
          size="sm" 
          variant="outline" 
          className="shrink-0 ml-2 border-primary/50 text-primary hover:bg-primary/10"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          {t('referral.inviteNow')}
        </Button>
      </div>
      
      <ReferralShareDialog 
        open={showShareDialog} 
        onOpenChange={setShowShareDialog}
        referralLink={referralLink}
      />
    </>
  );
};
