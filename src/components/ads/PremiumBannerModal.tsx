import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

  const handleGoPremium = () => {
    onOpenChange(false);
    navigate('/premium');
  };

  const handleStayFree = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('ads.removeAdTitle')}</DialogTitle>
          <DialogDescription>
            {t('ads.removeAdDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={handleGoPremium} className="w-full">
            {t('ads.goPremium')}
          </Button>
          <Button variant="ghost" onClick={handleStayFree} className="w-full">
            {t('ads.stayFree')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
