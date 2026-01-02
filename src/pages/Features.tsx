import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { TrustBadge, TrustBadgeCard } from '@/components/ui/trust-badge';
import { SupportedLanguage } from '@/i18n';
import {
  CircleCheck,
  CreditCard,
  Zap,
  Shield,
  Trophy,
  Target,
  TrendingUp,
  Wallet,
  BarChart3,
  Sparkles,
  Gamepad2,
  Medal,
  ArrowLeft,
  Star,
} from 'lucide-react';

const languageFlags: Record<SupportedLanguage, { flag: string; label: string }> = {
  'pt-BR': { flag: '🇧🇷', label: 'Português (BR)' },
  'pt-PT': { flag: '🇵🇹', label: 'Português (PT)' },
  'en-US': { flag: '🇺🇸', label: 'English' },
  'es-ES': { flag: '🇪🇸', label: 'Español' },
};

const Features = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as SupportedLanguage;
  const currentFlag = languageFlags[currentLanguage] || languageFlags['en-US'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Logo size="sm" />
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>{currentFlag.flag}</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-12">
        {/* Hero */}
        <section className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Star className="w-4 h-4" />
            {t('features.badge')}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t('features.hero.title')}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {t('features.hero.subtitle')}
          </p>
        </section>

        {/* Trust Section */}
        <section className="space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h2 className="text-lg font-semibold text-foreground text-center">
            {t('features.trust.title')}
          </h2>
          <div className="bg-card/50 rounded-2xl p-5 border border-border/50 space-y-3">
            <TrustBadge icon={CircleCheck} text={t('landing.trust.free')} />
            <TrustBadge icon={CreditCard} text={t('landing.trust.noCard')} />
            <TrustBadge icon={Zap} text={t('landing.trust.startNow')} />
            <TrustBadge icon={Shield} text={t('features.trust.secure')} />
          </div>
        </section>

        {/* Core Features */}
        <section className="space-y-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h2 className="text-lg font-semibold text-foreground text-center">
            {t('features.core.title')}
          </h2>
          <div className="space-y-3">
            <TrustBadgeCard
              icon={Wallet}
              title={t('features.core.wallets.title')}
              description={t('features.core.wallets.description')}
            />
            <TrustBadgeCard
              icon={Target}
              title={t('features.core.goals.title')}
              description={t('features.core.goals.description')}
            />
            <TrustBadgeCard
              icon={BarChart3}
              title={t('features.core.reports.title')}
              description={t('features.core.reports.description')}
            />
            <TrustBadgeCard
              icon={TrendingUp}
              title={t('features.core.insights.title')}
              description={t('features.core.insights.description')}
            />
          </div>
        </section>

        {/* Gamification Features */}
        <section className="space-y-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h2 className="text-lg font-semibold text-foreground text-center">
            {t('features.game.title')}
          </h2>
          <div className="space-y-3">
            <TrustBadgeCard
              icon={Gamepad2}
              title={t('features.game.xp.title')}
              description={t('features.game.xp.description')}
            />
            <TrustBadgeCard
              icon={Trophy}
              title={t('features.game.quests.title')}
              description={t('features.game.quests.description')}
            />
            <TrustBadgeCard
              icon={Medal}
              title={t('features.game.badges.title')}
              description={t('features.game.badges.description')}
            />
            <TrustBadgeCard
              icon={Sparkles}
              title={t('features.game.levels.title')}
              description={t('features.game.levels.description')}
            />
          </div>
        </section>

        {/* CTA */}
        <section className="space-y-4 pt-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <Button 
            asChild
            className="w-full h-14 text-lg font-semibold bg-gradient-hero hover:opacity-90 shadow-lg transition-all duration-300"
          >
            <Link to="/signup">
              {t('landing.cta.startFree')}
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {t('landing.cta.noCreditCard')}
          </p>
          <div className="text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              {t('auth.alreadyHaveAccount')} {t('auth.login')}
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-4 pb-8">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            {t('landing.security.dataProtected')}
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Features;
