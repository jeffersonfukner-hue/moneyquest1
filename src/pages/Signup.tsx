import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { 
  useSetupGuard, 
  SUPPORTED_LANGUAGES, 
  SUPPORTED_CURRENCIES,
  SupportedLanguage,
  SupportedCurrency 
} from '@/hooks/useSetupGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrustBadge } from '@/components/ui/trust-badge';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft, Check, Globe, Coins, CircleCheck, CreditCard, Zap, Shield, Loader2, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import i18n, { SupportedLanguage as I18nLanguage, LANGUAGE_PREFERENCE_KEY } from '@/i18n';
import { detectBrowserLanguage } from '@/lib/browserLanguageDetection';

type SignupStep = 'landing' | 'preferences' | 'account';

const languageFlags: Record<I18nLanguage, { flag: string; label: string }> = {
  'pt-BR': { flag: '🇧🇷', label: 'Português' },
  'en-US': { flag: '🇺🇸', label: 'English' },
  'es-ES': { flag: '🇪🇸', label: 'Español' },
};

const Signup = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  
  const currentLanguage = i18nInstance.language as I18nLanguage;
  const currentFlag = languageFlags[currentLanguage] || languageFlags['en-US'];
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, user } = useAuth();
  const { saveSetupPreferences } = useSetupGuard();
  
  // Step state
  const [step, setStep] = useState<SignupStep>('landing');
  
  // Preferences state - pre-select detected browser language
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | null>(() => {
    return detectBrowserLanguage();
  });
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency | null>(null);
  
  // Account state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isPreferencesValid = selectedLanguage !== null && selectedCurrency !== null;

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Apply language when manually selected
  useEffect(() => {
    if (selectedLanguage && selectedLanguage !== i18n.language) {
      i18n.changeLanguage(selectedLanguage);
    }
  }, [selectedLanguage]);

  const handleContinueToAccount = () => {
    if (selectedLanguage && selectedCurrency) {
      localStorage.setItem(LANGUAGE_PREFERENCE_KEY, 'true');
      saveSetupPreferences(selectedLanguage, selectedCurrency);
      setStep('account');
    }
  };

  const handleBackToPreferences = () => {
    setStep('preferences');
  };

  const getTranslatedError = (message: string): string => {
    if (message.includes('User already registered')) {
      return t('auth.errors.userExists');
    }
    if (message.includes('Password should be at least')) {
      return t('auth.errors.weakPassword');
    }
    return message;
  };

  const handleGoogleSignIn = async () => {
    if (selectedLanguage && selectedCurrency) {
      saveSetupPreferences(selectedLanguage, selectedCurrency);
    }
    
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: t('auth.error'),
        description: error.message,
        variant: 'destructive',
      });
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast({ 
        title: t('auth.error'), 
        description: t('auth.errors.passwordMismatch'), 
        variant: 'destructive' 
      });
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password);

    if (error) {
      toast({ 
        title: t('auth.error'), 
        description: getTranslatedError(error.message), 
        variant: 'destructive' 
      });
    } else {
      toast({ 
        title: t('auth.accountCreated'), 
        description: t('auth.questBegin')
      });
      navigate('/onboarding');
    }
    setLoading(false);
  };

  const renderLandingStep = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-4 animate-fade-in">
        <Logo size="xl" animated className="justify-center" />
        <div className="space-y-2 pt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t('landing.hero.title')}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {t('landing.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="space-y-4 bg-card/50 rounded-2xl p-5 border border-border/50 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="space-y-3">
          <TrustBadge icon={CircleCheck} text={t('landing.trust.free')} />
          <TrustBadge icon={CreditCard} text={t('landing.trust.noCard')} />
          <TrustBadge icon={Zap} text={t('landing.trust.startNow')} />
        </div>
        <p className="text-xs text-muted-foreground text-center pt-2">
          {t('landing.trust.noHiddenFees')}
        </p>
      </section>

      {/* Primary CTA */}
      <section className="space-y-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <Button 
          onClick={() => setStep('preferences')}
          className="w-full h-14 text-lg font-semibold bg-gradient-hero hover:opacity-90 shadow-lg transition-all duration-300"
        >
          {t('landing.cta.startFree')}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          {t('landing.cta.noCreditCard')}
        </p>
      </section>

      {/* Learn More Link */}
      <section className="text-center animate-fade-in" style={{ animationDelay: '250ms' }}>
        <Link 
          to="/features" 
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          {t('landing.learnMore')}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Secondary Actions */}
      <section className="space-y-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground">
              {t('auth.alreadyHaveAccount')}
            </span>
          </div>
        </div>

        <Button 
          variant="outline" 
          asChild
          className="w-full h-12"
        >
          <Link to="/login">{t('auth.login')}</Link>
        </Button>
      </section>

      {/* Security Footer */}
      <footer className="text-center pt-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          {t('landing.security.dataProtected')}
        </p>
      </footer>
    </div>
  );

  const renderPreferencesStep = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setStep('landing')}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('common.back')}
        </Button>
      </div>

      <div className="text-center mb-4">
        <Logo size="lg" animated className="justify-center mb-4" />
        <h2 className="font-display text-xl font-semibold text-foreground">
          {t('setup.title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('setup.subtitle')}
        </p>
      </div>

      {/* Language Selector */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          {t('setup.languageLabel')}
        </Label>
        <Select 
          value={selectedLanguage || ''} 
          onValueChange={(value) => setSelectedLanguage(value as SupportedLanguage)}
        >
          <SelectTrigger className="min-h-[48px]">
            <SelectValue placeholder={t('setup.selectLanguage')} />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedLanguage && (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <Check className="w-3 h-3" />
            {SUPPORTED_LANGUAGES.find(l => l.value === selectedLanguage)?.label}
          </div>
        )}
      </div>

      {/* Currency Selector */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Coins className="w-4 h-4" />
          {t('setup.currencyLabel')}
        </Label>
        <Select 
          value={selectedCurrency || ''} 
          onValueChange={(value) => setSelectedCurrency(value as SupportedCurrency)}
        >
          <SelectTrigger className="min-h-[48px]">
            <SelectValue placeholder={t('setup.selectCurrency')} />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CURRENCIES.map((curr) => (
              <SelectItem key={curr.value} value={curr.value}>
                <span className="flex items-center gap-2">
                  <span className="font-mono">{curr.symbol}</span>
                  <span>{curr.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCurrency && (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <Check className="w-3 h-3" />
            {SUPPORTED_CURRENCIES.find(c => c.value === selectedCurrency)?.label}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {t('setup.currencyHint')}
        </p>
      </div>

      <Button 
        onClick={handleContinueToAccount}
        disabled={!isPreferencesValid}
        className="w-full min-h-[48px] bg-gradient-hero hover:opacity-90"
      >
        {t('setup.continue')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('auth.alreadyHaveAccount')}{' '}
        <Link 
          to="/login" 
          className="text-primary hover:underline font-medium"
        >
          {t('auth.login')}
        </Link>
      </p>
    </div>
  );

  const renderAccountStep = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBackToPreferences}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('common.back')}
        </Button>
        <div className="text-xs text-muted-foreground">
          {SUPPORTED_LANGUAGES.find(l => l.value === selectedLanguage)?.flag}{' '}
          {SUPPORTED_CURRENCIES.find(c => c.value === selectedCurrency)?.symbol}
        </div>
      </div>

      <div className="text-center mb-4">
        <Logo size="lg" animated className="justify-center mb-4" />
        <h2 className="font-display text-xl font-semibold text-foreground">
          {t('landing.cta.createFreeAccount')}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input 
            id="email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="min-h-[48px]"
            placeholder={t('auth.emailPlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? 'text' : 'password'} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              minLength={6} 
              className="min-h-[48px] pr-12"
              placeholder={t('auth.passwordPlaceholder')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
          <div className="relative">
            <Input 
              id="confirmPassword" 
              type={showConfirmPassword ? 'text' : 'password'} 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              minLength={6} 
              className="min-h-[48px] pr-12"
              placeholder={t('auth.confirmPasswordPlaceholder')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        <Button type="submit" className="w-full min-h-[48px] bg-gradient-hero hover:opacity-90" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.createAccount')}
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full min-h-[48px]"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t('auth.continueWithGoogle')}
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4">
        {t('auth.alreadyHaveAccount')}{' '}
        <Link 
          to="/login" 
          className="text-primary hover:underline font-medium"
        >
          {t('auth.login')}
        </Link>
      </p>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 'landing':
        return renderLandingStep();
      case 'preferences':
        return renderPreferencesStep();
      case 'account':
        return renderAccountStep();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
      {/* Language indicator */}
      <div className="flex justify-end p-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          <span>{currentFlag.flag}</span>
          <span className="text-xs">{currentFlag.label}</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-8">
        <div className="w-full max-w-sm">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default Signup;
