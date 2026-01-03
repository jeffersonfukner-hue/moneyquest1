import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReferral } from '@/hooks/useReferral';
import { ReferralShareDialog } from './ReferralShareDialog';
import { PremiumInternalBanner } from './PremiumInternalBanner';

interface ReferralBannerProps {
  onDismiss?: () => void;
}

export const ReferralBanner = ({ onDismiss }: ReferralBannerProps) => {
  const { t } = useTranslation();
  const { referralLink, stats, isLoading } = useReferral();
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Show PremiumInternalBanner as fallback during loading to prevent empty container
  if (isLoading) {
    return <PremiumInternalBanner onDismiss={onDismiss} />;
  }

  const handleClick = () => {
    setShowShareDialog(true);
  };

  // Show progress if there are pending referrals
  const hasPendingReferrals = stats?.pending_referrals && stats.pending_referrals > 0;

  return (
    <>
      <div 
        onClick={handleClick}
        className="relative flex items-center justify-between w-full h-full px-4 cursor-pointer overflow-hidden bg-gradient-to-r from-purple-100 via-purple-50 to-purple-100 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 hover:from-purple-200 hover:via-purple-100 hover:to-purple-200 dark:hover:from-purple-800 dark:hover:via-purple-700 dark:hover:to-purple-800 transition-colors"
      >
        <Gift className="w-5 h-5 text-primary shrink-0" />
        
        <div className="flex flex-col justify-center py-1 min-w-0 flex-1 ml-3">
          <span className="text-sm font-medium text-foreground truncate">
            {t('referral.bannerTitleReward')}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {hasPendingReferrals 
              ? t('referral.bannerPendingProgress', { count: stats.pending_referrals })
              : t('referral.bannerDescriptionReward')
            }
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
