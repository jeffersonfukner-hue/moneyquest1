import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { Gamepad2, Sparkles, Eye, EyeOff, Globe, ChevronDown, ArrowLeft } from 'lucide-react';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import i18n from '@/i18n';

type LoginMode = 'login' | 'forgot';

const Login = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<LoginMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || 'pt-BR'
  );
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const getTranslatedError = (message: string): string => {
    if (message.includes('Invalid login credentials')) {
      return t('auth.errors.invalidCredentials');
    }
    if (message.includes('Email not confirmed')) {
      return t('auth.errors.emailNotConfirmed');
    }
    return message;
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
          <div className="w-20 h-20 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-primary animate-float">
            <Gamepad2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-bold text-gradient-primary">MoneyQuest</h1>
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
