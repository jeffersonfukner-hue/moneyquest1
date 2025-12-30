import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Crown, Check, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription, PREMIUM_BENEFITS } from '@/contexts/SubscriptionContext';
import { PremiumBadge } from '@/components/subscription/PremiumBadge';
import { useProfile } from '@/hooks/useProfile';
import { usePremiumPricing } from '@/hooks/usePremiumPricing';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BillingPeriod } from '@/lib/pricingConfig';

const Upgrade = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isPremium, plan } = useSubscription();
  const { refetch: refetchProfile } = useProfile();
  const { billingCurrency, pricing, getPriceId, getFormattedPrice } = usePremiumPricing();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');

  // Check subscription status on mount and after Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast.success(t('subscription.welcomePremium') || 'Welcome to Premium!');
      checkSubscription();
      navigate('/premium', { replace: true });
    } else if (canceled === 'true') {
      toast.info(t('subscription.checkoutCanceled') || 'Checkout was canceled');
      navigate('/premium', { replace: true });
    } else {
      checkSubscription();
    }
  }, [searchParams, t, navigate]);

  const checkSubscription = async () => {
    setIsCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      console.log('Subscription check result:', data);
      await refetchProfile();
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const handleSubscribe = async () => {
    const priceId = getPriceId(billingPeriod);
    
    if (!priceId) {
      toast.error(t('subscription.setupRequired') || 'Stripe products need to be configured. Please contact support.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error(t('subscription.checkoutError') || 'Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error(t('subscription.portalError') || 'Failed to open subscription management. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const freeFeatures = [
    'unlimited_transactions',
    'xp_leveling',
    'daily_quests_only',
    'basic_mood',
    'recent_history',
    'single_language',
    'single_currency',
  ];

  const premiumFeatures = [
    'unlimited_history',
    'all_quest_types',
    'rare_badges',
    'category_goals',
    'ai_insights',
    'multi_language',
    'multi_currency',
    'advanced_themes',
    'data_export',
    'priority_support',
  ];

  const selectedPrice = getFormattedPrice(billingPeriod);
  const periodLabel = billingPeriod === 'monthly' 
    ? t('subscription.perMonth') 
    : t('subscription.perYear');

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border safe-area-top">
        <div className="flex items-center h-14 px-4 max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="min-h-[44px] min-w-[44px] -ml-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-lg text-foreground ml-2">
            {t('subscription.upgradeToPremium')}
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Hero Section */}
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30 animate-float">
            <Crown className="w-10 h-10 text-amber-950" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            {t('subscription.unlockFullPotential')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('subscription.premiumTagline')}
          </p>
        </div>

        {/* Current Plan Status */}
        {isPremium && (
          <Card className="border-amber-400/50 bg-gradient-to-br from-amber-400/10 to-amber-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-950" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{t('subscription.youArePremium')}</p>
                <p className="text-xs text-muted-foreground">{t('subscription.enjoyAllFeatures')}</p>
              </div>
              <PremiumBadge size="md" />
            </CardContent>
          </Card>
        )}

        {/* Billing Period Selector */}
        {!isPremium && (
          <div className="flex gap-2 justify-center bg-muted/50 p-1.5 rounded-xl">
            <Button 
              variant={billingPeriod === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingPeriod('monthly')}
              className="flex-1 relative"
            >
              {t('subscription.monthly')}
            </Button>
            <Button 
              variant={billingPeriod === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingPeriod('yearly')}
              className="flex-1 relative"
            >
              {t('subscription.yearly')}
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-1 text-[10px] px-1.5 py-0 bg-emerald-500 text-white border-0"
              >
                {t('subscription.bestValue')}
              </Badge>
            </Button>
          </div>
        )}

        {/* Savings message for yearly */}
        {!isPremium && billingPeriod === 'yearly' && (
          <div className="text-center">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              ✨ {t('subscription.saveEquivalent', { savings: pricing.yearly.savings })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('subscription.billedYearly')} • {t('subscription.equivalentTo', { price: pricing.yearly.monthlyEquivalentFormatted })}
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid gap-4">
          {/* Free Plan */}
          <Card className={plan === 'FREE' ? 'border-primary' : 'border-border'}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t('subscription.freePlan')}</CardTitle>
                {plan === 'FREE' && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                    {t('subscription.currentPlan')}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">
                {t('subscription.free')}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {freeFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">
                    {t(`subscription.freeFeatures.${feature}`)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className={`border-amber-400/50 bg-gradient-to-br from-card to-amber-500/5 ${isPremium ? '' : 'ring-2 ring-amber-400/50'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{t('subscription.premiumPlan')}</CardTitle>
                  <PremiumBadge size="sm" />
                </div>
                {isPremium && (
                  <span className="text-xs bg-amber-400/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full font-medium">
                    {t('subscription.currentPlan')}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold text-foreground">
                  {selectedPrice}
                </p>
                <span className="text-muted-foreground text-sm">{periodLabel}</span>
              </div>
              {billingPeriod === 'yearly' && !isPremium && (
                <p className="text-xs text-muted-foreground">
                  ({pricing.yearly.monthlyEquivalentFormatted}{t('subscription.perMonth')})
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {premiumFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-amber-950" />
                  </div>
                  <span className="text-foreground">
                    {t(`subscription.premiumFeatures.${feature}`)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        {isPremium ? (
          <Button
            onClick={handleManageSubscription}
            disabled={isLoading}
            size="lg"
            variant="outline"
            className="w-full min-h-[52px] text-base font-semibold"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : null}
            {t('subscription.manageSubscription') || 'Manage Subscription'}
          </Button>
        ) : (
          <Button
            onClick={handleSubscribe}
            disabled={isLoading}
            size="lg"
            className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 hover:from-amber-500 hover:to-amber-600 min-h-[52px] text-base font-semibold shadow-lg shadow-amber-500/30"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 mr-2" />
            )}
            {billingPeriod === 'monthly' 
              ? t('subscription.subscribeMonthly', { price: selectedPrice })
              : t('subscription.subscribeYearly', { price: selectedPrice })
            }
          </Button>
        )}

        {/* Refresh subscription button */}
        {isCheckingSubscription && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('subscription.checkingStatus') || 'Checking subscription status...'}</span>
          </div>
        )}

        {/* Benefits List */}
        <div className="pt-4">
          <h3 className="font-display font-semibold text-foreground mb-4 text-center">
            {t('subscription.whyPremium')}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {PREMIUM_BENEFITS.slice(0, 6).map((benefit) => (
              <div key={benefit.key} className="text-center p-3 bg-card rounded-xl">
                <span className="text-2xl block mb-1">{benefit.icon}</span>
                <span className="text-xs text-muted-foreground">
                  {t(`subscription.benefits.${benefit.key}`)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ or info */}
        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">
            {t('subscription.cancelAnytime')}
          </p>
        </div>
      </main>
    </div>
  );
};

export default Upgrade;
