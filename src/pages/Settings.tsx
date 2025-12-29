import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Globe, Coins, Volume2, LogOut, Crown, RefreshCw, TrendingUp, FolderOpen, ChevronRight, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSound } from '@/contexts/SoundContext';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, PREMIUM_PRICING } from '@/contexts/SubscriptionContext';
import { SUPPORTED_LANGUAGES, SUPPORTED_CURRENCIES, type SupportedLanguage, type SupportedCurrency } from '@/i18n';
import { PremiumBadge } from '@/components/subscription/PremiumBadge';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { format } from 'date-fns';

const Settings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { isMuted, toggleMute } = useSound();
  const { signOut } = useAuth();
  const { isPremium, canAccessMultiLanguage, canAccessMultiCurrency, plan } = useSubscription();
  const { rates, lastUpdate, loading: ratesLoading, refreshRates, getRate } = useExchangeRates();

  const pricing = PREMIUM_PRICING[currency] || PREMIUM_PRICING.USD;

  const handleLanguageChange = async (value: string) => {
    await setLanguage(value as SupportedLanguage);
  };

  const handleCurrencyChange = async (value: string) => {
    await setCurrency(value as SupportedCurrency);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border safe-area-top">
        <div className="flex items-center h-14 px-4 max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="min-h-[44px] min-w-[44px] -ml-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-lg text-foreground ml-2">
            {t('settings.title')}
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-4">
        {/* Subscription Status */}
        <Card 
          className={`cursor-pointer transition-all ${isPremium ? 'border-amber-400/50 bg-gradient-to-br from-amber-400/10 to-amber-500/5' : 'hover:border-amber-400/30'}`}
          onClick={() => navigate('/upgrade')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPremium ? 'bg-gradient-to-br from-amber-400 to-amber-500' : 'bg-muted'}`}>
              <Crown className={`w-5 h-5 ${isPremium ? 'text-amber-950' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">
                  {isPremium ? t('subscription.premiumPlan') : t('subscription.freePlan')}
                </p>
                {isPremium && <PremiumBadge size="sm" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {isPremium ? t('subscription.enjoyAllFeatures') : t('subscription.unlockAllFeatures')}
              </p>
            </div>
            {!isPremium && (
              <Button size="sm" className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 hover:from-amber-500 hover:to-amber-600">
                {t('subscription.upgrade')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Language */}
        <Card className={!canAccessMultiLanguage ? 'opacity-60' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="w-5 h-5 text-primary" />
              {t('settings.language')}
              {!canAccessMultiLanguage && <PremiumBadge size="sm" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {canAccessMultiLanguage ? (
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="min-h-[48px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, { name, flag }]) => (
                    <SelectItem key={code} value={code} className="min-h-[44px]">
                      <span className="flex items-center gap-2">
                        <span>{flag}</span>
                        <span>{name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div 
                className="flex items-center justify-between min-h-[48px] cursor-pointer"
                onClick={() => navigate('/upgrade')}
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span>{SUPPORTED_LANGUAGES[language]?.flag}</span>
                  <span>{SUPPORTED_LANGUAGES[language]?.name}</span>
                </span>
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Currency */}
        <Card className={!canAccessMultiCurrency ? 'opacity-60' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="w-5 h-5 text-primary" />
              {t('settings.currency')}
              {!canAccessMultiCurrency && <PremiumBadge size="sm" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {canAccessMultiCurrency ? (
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="min-h-[48px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPORTED_CURRENCIES).map(([code, { symbol, name }]) => (
                    <SelectItem key={code} value={code} className="min-h-[44px]">
                      <span className="flex items-center gap-2">
                        <span className="font-mono">{symbol}</span>
                        <span>{name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div 
                className="flex items-center justify-between min-h-[48px] cursor-pointer"
                onClick={() => navigate('/upgrade')}
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-mono">{SUPPORTED_CURRENCIES[currency]?.symbol}</span>
                  <span>{SUPPORTED_CURRENCIES[currency]?.name}</span>
                </span>
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exchange Rates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-primary" />
              {t('settings.exchangeRates')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">USD → BRL</p>
                <p className="font-mono font-semibold text-foreground">
                  {getRate('USD', 'BRL').toFixed(2)}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">EUR → BRL</p>
                <p className="font-mono font-semibold text-foreground">
                  {getRate('EUR', 'BRL').toFixed(2)}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">EUR → USD</p>
                <p className="font-mono font-semibold text-foreground">
                  {getRate('EUR', 'USD').toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                {lastUpdate 
                  ? `${t('settings.lastUpdated')}: ${format(lastUpdate, 'dd/MM/yyyy HH:mm')}`
                  : t('settings.ratesNotLoaded')
                }
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshRates}
                disabled={ratesLoading}
                className="min-h-[36px]"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${ratesLoading ? 'animate-spin' : ''}`} />
                {t('common.refresh')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card 
          className="cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => navigate('/categories')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {t('categories.title')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('categories.manageCategories')}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>

        {/* Category Goals */}
        <Card 
          className="cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => navigate('/category-goals')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {t('categoryGoals.title')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('categoryGoals.manageBudgets')}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>

        {/* Sound */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Volume2 className="w-5 h-5 text-primary" />
              {t('settings.sound')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between min-h-[48px]">
              <Label htmlFor="sound-toggle" className="text-sm">
                {!isMuted ? t('settings.soundOn') : t('settings.soundOff')}
              </Label>
              <Switch
                id="sound-toggle"
                checked={!isMuted}
                onCheckedChange={toggleMute}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button 
          variant="destructive" 
          className="w-full min-h-[48px] mt-6"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t('auth.logout')}
        </Button>
      </main>
    </div>
  );
};

export default Settings;
