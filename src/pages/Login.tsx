import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Sparkles, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { SupportedLanguage } from '@/i18n';

type LoginMode = 'login' | 'forgot';

const languageFlags: Record<SupportedLanguage, { flag: string; label: string }> = {
  'pt-BR': { flag: '🇧🇷', label: 'Português' },
  'en-US': { flag: '🇺🇸', label: 'English' },
  'es-ES': { flag: '🇪🇸', label: 'Español' },
};

const Login = () => {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<LoginMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  const currentLanguage = i18n.language as SupportedLanguage;
  const currentFlag = languageFlags[currentLanguage] || languageFlags['en-US'];

  // Language detection is now handled by i18n/index.ts before React mounts
  // No useEffect needed here - just redirect if logged in

  // Redirect if already logged in
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

  const renderForm = () => {
    if (mode === 'forgot') {
      return (
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
          <Button type="submit" className="w-full min-h-[48px] bg-gradient-hero hover:opacity-90" disabled={loading}>
            {loading ? t('common.loading') : t('auth.sendResetLink')}
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full min-h-[48px]" 
            onClick={() => setMode('login')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>
        </form>
      );
    }

    return (
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

        <button 
          type="button"
          onClick={() => setMode('forgot')} 
          className="text-sm text-primary hover:underline w-full text-right"
        >
          {t('auth.forgotPassword')}
        </button>

        <Button type="submit" className="w-full min-h-[48px] bg-gradient-hero hover:opacity-90" disabled={loading}>
          <Sparkles className="w-4 h-4 mr-2" />
          {loading ? t('common.loading') : t('auth.startQuest')}
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
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Language indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-full border border-border/50 shadow-sm">
        <span className="text-lg" role="img" aria-label={currentFlag.label}>
          {currentFlag.flag}
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          {currentFlag.label}
        </span>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-slide-up">
          <div className="mx-auto mb-4">
            <Logo size="xl" animated className="justify-center" />
          </div>
          <p className="text-muted-foreground mt-2">{t('auth.tagline')}</p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-lg animate-scale-in">
          {mode === 'forgot' ? (
            <div className="mb-6 text-center">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {t('auth.resetPassword')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t('auth.resetPasswordDescription')}
              </p>
            </div>
          ) : (
            <h2 className="font-display text-xl font-semibold text-foreground text-center mb-6">
              {t('auth.login')}
            </h2>
          )}

          {renderForm()}

          {mode !== 'forgot' && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              {t('auth.dontHaveAccount')}{' '}
              <Link 
                to="/signup" 
                className="text-primary hover:underline font-medium"
              >
                {t('auth.signup')}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
