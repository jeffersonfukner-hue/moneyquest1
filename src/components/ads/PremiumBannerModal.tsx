import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useABTest } from '@/hooks/useABTest';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PremiumBannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PremiumBannerModal = ({ open, onOpenChange }: PremiumBannerModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trackImpression, trackClick } = useABTest('premiumBannerModal');

  // Track modal impression when opened
  useEffect(() => {
    if (open) {
      trackImpression();
    }
  }, [open, trackImpression]);

  const handleGoPremium = () => {
    trackClick({ action: 'go_premium' });
    onOpenChange(false);
    navigate('/premium');
  };

  const handleStayFree = () => {
    trackClick({ action: 'stay_free' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('ads.removeAdTitle')}</DialogTitle>
          <DialogDescription>
            {t('ads.removeAdDescriptionClean')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={handleGoPremium} className="w-full">
            {t('ads.activatePremium')}
          </Button>
          <Button variant="ghost" onClick={handleStayFree} className="w-full">
            {t('ads.notNow')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
