import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, Lock, Zap } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useTrialStatus } from '@/hooks/useTrialStatus';

const TRIAL_EXPIRED_SHOWN_KEY = 'moneyquest_trial_expired_shown';

export const TrialExpiredDialog = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { phase, hasUsedTrial, hasPaidSubscription } = useTrialStatus();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only show dialog once when trial expires
    if (
      phase === 'expired' && 
      hasUsedTrial && 
      !hasPaidSubscription
    ) {
      const hasBeenShown = localStorage.getItem(TRIAL_EXPIRED_SHOWN_KEY);
      if (!hasBeenShown) {
        // Small delay to let the page load
        const timer = setTimeout(() => {
          setOpen(true);
          localStorage.setItem(TRIAL_EXPIRED_SHOWN_KEY, 'true');
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, hasUsedTrial, hasPaidSubscription]);

  const handleUpgrade = () => {
    setOpen(false);
    navigate('/premium');
  };

  const handleContinueFree = () => {
    setOpen(false);
  };

  const premiumFeatures = [
    t('trial.expiredFeature1'),
    t('trial.expiredFeature2'),
    t('trial.expiredFeature3'),
    t('trial.expiredFeature4'),
  ];

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader className="text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <AlertDialogTitle className="text-xl">
            {t('trial.expiredTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {t('trial.expiredMessage')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <p className="text-sm font-medium text-foreground mb-3">
            {t('trial.expiredFeaturesLost')}
          </p>
          {premiumFeatures.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Crown className="w-4 h-4 text-accent shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button 
            onClick={handleUpgrade}
            className="w-full gap-2 bg-accent hover:bg-accent/90"
          >
            <Zap className="w-4 h-4" />
            {t('trial.ctaButton')}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleContinueFree}
            className="w-full text-muted-foreground"
          >
            {t('trial.continueFreePlan')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
