import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Gamepad2, Sparkles } from 'lucide-react';

const Auth = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = isLogin 
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
        title: isLogin ? t('auth.welcomeBack') : t('auth.accountCreated'), 
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
          <div className="flex gap-2 mb-6">
            <Button 
              variant={isLogin ? 'default' : 'outline'} 
              className="flex-1 min-h-[48px]" 
              onClick={() => setIsLogin(true)}
            >
              {t('auth.login')}
            </Button>
            <Button 
              variant={!isLogin ? 'default' : 'outline'} 
              className="flex-1 min-h-[48px]" 
              onClick={() => setIsLogin(false)}
            >
              {t('auth.signup')}
            </Button>
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
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                minLength={6} 
                className="min-h-[48px]"
                placeholder={t('auth.passwordPlaceholder')}
              />
            </div>
            <Button type="submit" className="w-full min-h-[48px] bg-gradient-hero hover:opacity-90" disabled={loading}>
              <Sparkles className="w-4 h-4 mr-2" />
              {loading ? t('common.loading') : isLogin ? t('auth.startQuest') : t('auth.createAccount')}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {isLogin ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}{' '}
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)} 
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? t('auth.signup') : t('auth.login')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
