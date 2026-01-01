import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Sparkles, Eye, EyeOff, Globe, ChevronDown, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import i18n from '@/i18n';

type AuthMode = 'login' | 'signup' | 'forgot';

const Auth = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || 'pt-BR'
  );
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'signup' && password !== confirmPassword) {
      toast({ 
        title: t('auth.error'), 
        description: t('auth.errors.passwordMismatch'), 
        variant: 'destructive' 
      });
      setLoading(false);
      return;
    }

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

    const { error } = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      const errorMessage = getTranslatedError(error.message);
      toast({ 
        title: t('auth.error'), 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } else {
      toast({ 
        title: mode === 'login' ? t('auth.welcomeBack') : t('auth.accountCreated'), 
        description: t('auth.questBegin')
      });
      navigate('/');
    }
    setLoading(false);
  };

  const getTranslatedError = (message: string): string => {
    if (message.includes('Invalid login credentials')) {
      return t('auth.errors.invalidCredentials');
    }
    if (message.includes('User already registered')) {
      return t('auth.errors.userExists');
    }
    if (message.includes('Email not confirmed')) {
      return t('auth.errors.emailNotConfirmed');
    }
    if (message.includes('Password should be at least')) {
      return t('auth.errors.weakPassword');
    }
    return message;
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

        {mode === 'signup' && (
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

        <Button type="submit" className="w-full min-h-[48px] bg-gradient-hero hover:opacity-90" disabled={loading}>
          <Sparkles className="w-4 h-4 mr-2" />
          {loading ? t('common.loading') : mode === 'login' ? t('auth.startQuest') : t('auth.createAccount')}
        </Button>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-h-[44px] gap-2">
                <Globe className="w-4 h-4" />
                <span>{SUPPORTED_LANGUAGES[currentLanguage].flag}</span>
                <span className="hidden sm:inline">{SUPPORTED_LANGUAGES[currentLanguage].name}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover z-50">
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, { name, flag }]) => (
                <DropdownMenuItem 
                  key={code}
                  onClick={() => handleLanguageChange(code as SupportedLanguage)}
                  className="min-h-[44px] cursor-pointer"
                >
                  <span className="mr-2">{flag}</span>
                  <span>{name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="text-center mb-8 animate-slide-up">
          <div className="mx-auto mb-4">
            <Logo size="xl" animated className="justify-center" />
          </div>
          <p className="text-muted-foreground mt-2">{t('auth.tagline')}</p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-lg animate-scale-in">
          {mode !== 'forgot' && (
            <div className="flex gap-2 mb-6">
              <Button 
                variant={mode === 'login' ? 'default' : 'outline'} 
                className="flex-1 min-h-[48px]" 
                onClick={() => setMode('login')}
              >
                {t('auth.login')}
              </Button>
              <Button 
                variant={mode === 'signup' ? 'default' : 'outline'} 
                className="flex-1 min-h-[48px]" 
                onClick={() => setMode('signup')}
              >
                {t('auth.signup')}
              </Button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="mb-6 text-center">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {t('auth.resetPassword')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t('auth.resetPasswordDescription')}
              </p>
            </div>
          )}

          {renderForm()}

          {mode !== 'forgot' && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              {mode === 'login' ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}{' '}
              <button 
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} 
                className="text-primary hover:underline font-medium"
              >
                {mode === 'login' ? t('auth.signup') : t('auth.login')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
