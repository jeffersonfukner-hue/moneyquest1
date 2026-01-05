import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useAdSenseLoader } from '@/hooks/useAdSenseLoader';
import { Button } from '@/components/ui/button';
import { TrustBadge } from '@/components/ui/trust-badge';
import { CircleCheck, CreditCard, Zap, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import PublicFooter from '@/components/layout/PublicFooter';
import PublicNavigation from '@/components/layout/PublicNavigation';

const Home = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Load AdSense script for ads.txt validation
  useAdSenseLoader();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Show H1 immediately during loading for LCP optimization
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
        <PublicNavigation />
        <div className="flex-1 flex items-center justify-center px-6 pb-8">
          <div className="w-full max-w-sm">
            <div className="space-y-8">
              <section className="text-center space-y-4">
                <Logo size="xl" animated shine priority className="justify-center" />
                <div className="space-y-2 pt-4">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {t('landing.hero.title', { defaultValue: 'Control your money like a game' })}
                  </h1>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {t('landing.hero.subtitle', { defaultValue: 'Track expenses, complete challenges, and level up your finances' })}
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect authenticated users to dashboard
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
      <PublicNavigation />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-8">
        <div className="w-full max-w-sm">
          <div className="space-y-8">
            {/* Hero Section - H1 renders immediately without animation for faster LCP */}
            <section className="text-center space-y-4">
              <Logo size="xl" animated shine priority className="justify-center animate-fade-in" />
              <div className="space-y-2 pt-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {t('landing.hero.title')}
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed animate-fade-in">
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
                onClick={() => navigate('/login?mode=login')}
                className="w-full h-12"
              >
                {t('auth.login')}
              </Button>
            </section>

            {/* Security Footer */}
            <PublicFooter showSupport className="pt-4 animate-fade-in" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
