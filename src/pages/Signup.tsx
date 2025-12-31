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
import { toast } from '@/hooks/use-toast';
import { Gamepad2, Sparkles, Eye, EyeOff, ArrowLeft, Check, Globe, Coins } from 'lucide-react';
import i18n from '@/i18n';

type SignupStep = 'preferences' | 'account';

const Signup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, user } = useAuth();
  const { saveSetupPreferences } = useSetupGuard();
  
  // Step state
  const [step, setStep] = useState<SignupStep>('preferences');
  
  // Preferences state
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | null>(null);
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

  // Apply language when selected
  useEffect(() => {
    if (selectedLanguage && selectedLanguage !== i18n.language) {
      i18n.changeLanguage(selectedLanguage);
    }
  }, [selectedLanguage]);

  const handleContinueToAccount = () => {
    if (selectedLanguage && selectedCurrency) {
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
    // Ensure preferences are saved before OAuth redirect
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

  const renderPreferencesStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
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
        <Sparkles className="w-4 h-4 mr-2" />
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
    <div className="space-y-4">
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

      <h2 className="font-display text-xl font-semibold text-foreground text-center">
        {t('auth.signup')}
      </h2>

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
          <Sparkles className="w-4 h-4 mr-2" />
          {loading ? t('common.loading') : t('auth.createAccount')}
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full min-h-[48px]"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
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
          {googleLoading ? t('common.loading') : t('auth.continueWithGoogle')}
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-20 h-20 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary animate-float">
            <Gamepad2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-bold text-gradient-primary">MoneyQuest</h1>
          <p className="text-muted-foreground mt-2">{t('auth.tagline')}</p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-lg animate-scale-in">
          {step === 'preferences' ? renderPreferencesStep() : renderAccountStep()}
        </div>
      </div>
    </div>
  );
};

export default Signup;
