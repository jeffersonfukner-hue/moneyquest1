import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Crown, Check, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription, PREMIUM_PRICING, PREMIUM_BENEFITS } from '@/contexts/SubscriptionContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { PremiumBadge } from '@/components/subscription/PremiumBadge';
import { toast } from 'sonner';

const Upgrade = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isPremium, plan } = useSubscription();
  const { currency } = useCurrency();

  const pricing = PREMIUM_PRICING[currency] || PREMIUM_PRICING.USD;

  const handleSubscribe = async () => {
    // This will be connected to Stripe
    toast.info(t('subscription.comingSoon'));
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
                  {pricing.formatted}
                </p>
                <span className="text-muted-foreground text-sm">/{t('subscription.month')}</span>
              </div>
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

        {/* Subscribe Button */}
        {!isPremium && (
          <Button
            onClick={handleSubscribe}
            size="lg"
            className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 hover:from-amber-500 hover:to-amber-600 min-h-[52px] text-base font-semibold shadow-lg shadow-amber-500/30"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {t('subscription.subscribeTo', { price: pricing.formatted })}
          </Button>
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
