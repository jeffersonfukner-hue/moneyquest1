import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Crown, PartyPopper, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useProfile } from "@/hooks/useProfile";
import confetti from "canvas-confetti";
import { APP_ROUTES } from "@/routes/routes";

const PremiumSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const { refetch } = useProfile();
  const [countdown, setCountdown] = useState(5);
  const [isVerifying, setIsVerifying] = useState(!isPremium);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  // Trigger confetti on success
  useEffect(() => {
    if (!isVerifying && isPremium) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Second burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);
    }
  }, [isVerifying, isPremium]);

  // Verify subscription status if not premium yet
  useEffect(() => {
    if (isPremium) {
      setIsVerifying(false);
      return;
    }

    if (retryCount >= maxRetries) {
      setIsVerifying(false);
      return;
    }

    const timer = setTimeout(async () => {
      await refetch();
      setRetryCount(prev => prev + 1);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isPremium, retryCount, refetch]);

  // Countdown and auto-redirect
  useEffect(() => {
    if (isVerifying) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(APP_ROUTES.DASHBOARD);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVerifying, navigate]);

  const handleGoToApp = () => {
    navigate(APP_ROUTES.DASHBOARD);
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {t("subscription.confirmingPayment")}
            </h1>
            <p className="text-muted-foreground">
              {t("subscription.paymentConfirmationNote")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md">
        {/* Success Icon */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
          <div className="absolute -top-2 -right-2">
            <PartyPopper className="w-8 h-8 text-yellow-500 animate-bounce" />
          </div>
          <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
            <Crown className="w-12 h-12 text-primary-foreground" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">
            {t("subscription.successTitle")} 🎉
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t("subscription.successMessage")}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Button 
            onClick={handleGoToApp} 
            size="lg" 
            className="w-full gap-2 text-lg py-6"
          >
            {t("subscription.goToApp")}
            <ArrowRight className="w-5 h-5" />
          </Button>
          
          <p className="text-sm text-muted-foreground">
            {t("subscription.redirectingIn", { seconds: countdown })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumSuccess;
