import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrustBadge } from '@/components/ui/trust-badge';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, CircleCheck, CreditCard, Zap, Shield, Loader2, Mail, Lock, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { SupportedLanguage } from '@/i18n';

type LoginMode = 'landing' | 'login' | 'forgot';

const languageFlags: Record<SupportedLanguage, { flag: string; label: string }> = {
  'pt-BR': { flag: '🇧🇷', label: 'Português (BR)' },
  'pt-PT': { flag: '🇵🇹', label: 'Português (PT)' },
  'en-US': { flag: '🇺🇸', label: 'English' },
  'es-ES': { flag: '🇪🇸', label: 'Español' },
};

const Login = () => {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<LoginMode>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  const currentLanguage = i18n.language as SupportedLanguage;
  const currentFlag = languageFlags[currentLanguage] || languageFlags['en-US'];

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const getTranslatedError = (message: string): string => {
    if (message.includes('Invalid login credentials')) {
      return t('auth.errors.invalidCredentials');
    }
    if (message.includes('Email not confirmed')) {
      return t('auth.errors.emailNotConfirmed');
    }
    return message;
  };

  const handleGoogleSignIn = async () => {
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

    if (mode === 'forgot') {
      const { error } = await resetPassword(email);
      if (error) {
        toast({ 
          title: t('auth.error'), 
          description: getTranslatedError(error.message), 
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: t('auth.resetEmailSent'), 
          description: t('auth.checkInbox')
        });
        setMode('login');
      }
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      toast({ 
        title: t('auth.error'), 
        description: getTranslatedError(error.message), 
        variant: 'destructive' 
      });
    } else {
      toast({ 
        title: t('auth.welcomeBack'), 
        description: t('auth.questBegin')
      });
      navigate('/');
    }
    setLoading(false);
  };

  const renderLandingMode = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-4 animate-fade-in">
        <Logo size="xl" animated shine className="justify-center" />
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
          variant="gold"
          onClick={() => navigate('/signup')}
          className="w-full h-14 text-lg"
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
          onClick={() => setMode('login')}
          className="w-full h-12"
        >
          {t('auth.login')}
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

  const renderLoginForm = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2 animate-fade-in">
        <Logo size="lg" animated className="justify-center" />
        <h1 className="text-2xl font-bold text-foreground pt-4">
          {mode === 'forgot' ? t('auth.resetPassword') : t('auth.welcomeBack')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === 'forgot' ? t('auth.resetPasswordDescription') : t('auth.loginDescription')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        {mode === 'login' && (
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="pl-10 pr-10 h-12"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {mode === 'login' && (
          <button 
            type="button"
            onClick={() => setMode('forgot')} 
            className="text-sm text-primary hover:underline w-full text-right"
          >
            {t('auth.forgotPassword')}
          </button>
        )}

        <Button 
          type="submit" 
          variant="gold"
          className="w-full h-12" 
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : mode === 'forgot' ? (
            t('auth.sendResetLink')
          ) : (
            t('auth.login')
          )}
        </Button>
      </form>

      {mode === 'login' && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">
                {t('auth.orContinueWith')}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full h-12"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {t('auth.continueWithGoogle')}
              </>
            )}
          </Button>
        </>
      )}

      <div className="space-y-3 text-center text-sm">
        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => setMode('login')}
            className="text-primary hover:underline"
          >
            {t('auth.backToLogin')}
          </button>
        )}

        <p className="text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            {t('landing.cta.createFreeAccount')}
          </Link>
        </p>
      </div>

      <Button
        variant="ghost"
        onClick={() => setMode('landing')}
        className="w-full text-muted-foreground"
      >
        ← {t('common.back')}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          <span>{currentFlag.flag}</span>
          <span className="text-xs">{currentFlag.label}</span>
        </div>
        {mode === 'landing' && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setMode('login')}
            className="text-sm font-medium"
          >
            {t('auth.login')}
          </Button>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-8">
        <div className="w-full max-w-sm">
          {mode === 'landing' ? renderLandingMode() : renderLoginForm()}
        </div>
      </div>
    </div>
  );
};

export default Login;
