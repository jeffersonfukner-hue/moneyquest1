import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, Zap, Clock, Sparkles } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TRIAL_EXPIRED_SHOWN_KEY = 'moneyquest_trial_expired_shown';
const TRIAL_EXPIRED_SHOWN_DATE_KEY = 'moneyquest_trial_expired_shown_date';
const DISCOUNT_COUPON_CODE = 'TRIAL30';

export const TrialExpiredDialog = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { phase, hasUsedTrial, hasPaidSubscription } = useTrialStatus();
  const { profile, refetch } = useProfile();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isOfferExpired, setIsOfferExpired] = useState(false);

  // Calculate countdown
  useEffect(() => {
    if (!profile?.discount_offer_expires_at) return;

    const updateCountdown = () => {
      const now = new Date();
      const expiresAt = new Date(profile.discount_offer_expires_at);
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setIsOfferExpired(true);
        setCountdown({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [profile?.discount_offer_expires_at]);

  // Mark offer as shown
  const markOfferShown = useCallback(async () => {
    if (!profile?.id || profile?.discount_offer_shown) return;

    try {
      const { error } = await supabase.rpc('mark_discount_offer_shown', {
        p_user_id: profile.id
      });

      if (error) throw error;
      refetch();
    } catch (err) {
      console.error('Error marking discount offer shown:', err);
    }
  }, [profile?.id, profile?.discount_offer_shown, refetch]);

  useEffect(() => {
    // Only show dialog when trial has expired
    if (
      phase === 'expired' && 
      hasUsedTrial && 
      !hasPaidSubscription &&
      profile
    ) {
      // Check if offer already expired
      if (profile.discount_offer_expires_at) {
        const expiresAt = new Date(profile.discount_offer_expires_at);
        if (expiresAt <= new Date()) {
          setIsOfferExpired(true);
        }
      }

      // Check if dialog was shown today (limit to once per day)
      const lastShownDate = localStorage.getItem(TRIAL_EXPIRED_SHOWN_DATE_KEY);
      const today = new Date().toISOString().split('T')[0];
      const alreadyShownToday = lastShownDate === today;

      // Only show if not shown today
      if (!alreadyShownToday) {
        const timer = setTimeout(() => {
          setOpen(true);
          localStorage.setItem(TRIAL_EXPIRED_SHOWN_KEY, 'true');
          localStorage.setItem(TRIAL_EXPIRED_SHOWN_DATE_KEY, today);
          markOfferShown();
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, hasUsedTrial, hasPaidSubscription, profile, isOfferExpired, markOfferShown]);

  const handleUpgradeWithDiscount = async () => {
    setLoading(true);
    try {
      // Navigate to premium page with discount parameter
      setOpen(false);
      navigate(`/premium?discount=${DISCOUNT_COUPON_CODE}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
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

  const showDiscount = !isOfferExpired && profile?.discount_offer_expires_at;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader className="text-center">
          {showDiscount && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-accent text-accent-foreground px-4 py-1 text-sm font-bold animate-pulse">
                <Sparkles className="w-4 h-4 mr-1" />
                30% OFF
              </Badge>
            </div>
          )}
          
          <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/40 rounded-2xl flex items-center justify-center mx-auto mb-4 mt-2">
            <Crown className="w-8 h-8 text-accent" />
          </div>
          
          <AlertDialogTitle className="text-xl uppercase">
            {showDiscount 
              ? t('trial.discountTitle', 'LAST CHANCE TO ACTIVATE PREMIUM')
              : t('trial.expiredTitle')
            }
          </AlertDialogTitle>
          
          <AlertDialogDescription className="text-center">
            {showDiscount
              ? t('trial.discountMessage', 'ACTIVATE MONEYQUEST PREMIUM NOW AND GET 30% OFF')
              : t('trial.expiredMessage')
            }
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showDiscount && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 my-2">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium text-foreground">
                {t('trial.offerExpiresIn', 'OFFER EXPIRES IN')}
              </span>
            </div>
            <div className="flex justify-center gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {String(countdown.hours).padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground uppercase">
                  {t('common.hours', 'HRS')}
                </div>
              </div>
              <div className="text-2xl font-bold text-accent">:</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {String(countdown.minutes).padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground uppercase">
                  {t('common.minutes', 'MIN')}
                </div>
              </div>
              <div className="text-2xl font-bold text-accent">:</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {String(countdown.seconds).padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground uppercase">
                  {t('common.seconds', 'SEC')}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2 py-2">
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
            onClick={handleUpgradeWithDiscount}
            disabled={loading}
            className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-bold uppercase"
            size="lg"
          >
            <Zap className="w-5 h-5" />
            {showDiscount
              ? t('trial.ctaDiscount', 'ACTIVATE PREMIUM WITH 30% OFF')
              : t('trial.ctaButton')
            }
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleContinueFree}
            className="w-full text-muted-foreground"
          >
            {t('trial.continueFreePlan')}
          </Button>
          
          {showDiscount && (
            <p className="text-xs text-center text-muted-foreground mt-2 uppercase">
              {t('trial.discountFootnote', 'OFFER VALID ONLY FOR EXPIRED TRIAL USERS')}
            </p>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
