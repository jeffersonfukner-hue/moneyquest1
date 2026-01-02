import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';
import { ArrowLeft, Shield } from 'lucide-react';
import PublicFooter from '@/components/layout/PublicFooter';

const Privacy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Logo size="sm" />
          <div className="w-5" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Hero */}
        <section className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Shield className="w-4 h-4" />
            {t('legal.privacy.badge', 'Sua Privacidade')}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t('legal.privacy.title', 'Política de Privacidade')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('legal.lastUpdated', 'Última atualização')}: 02/01/2026
          </p>
        </section>

        {/* Content */}
        <section className="prose prose-sm dark:prose-invert max-w-none space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="bg-card/50 rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="text-lg font-semibold text-foreground m-0">
              {t('legal.privacy.section1.title', '1. Informações que Coletamos')}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed m-0">
              {t('legal.privacy.section1.content', 'Coletamos informações que você nos fornece diretamente, como nome, e-mail e dados financeiros que você insere no aplicativo. Também coletamos informações de uso para melhorar nossos serviços.')}
            </p>
          </div>

          <div className="bg-card/50 rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="text-lg font-semibold text-foreground m-0">
              {t('legal.privacy.section2.title', '2. Como Usamos suas Informações')}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed m-0">
              {t('legal.privacy.section2.content', 'Usamos suas informações para fornecer, manter e melhorar nossos serviços, processar transações, enviar notificações importantes e personalizar sua experiência no aplicativo.')}
            </p>
          </div>

          <div className="bg-card/50 rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="text-lg font-semibold text-foreground m-0">
              {t('legal.privacy.section3.title', '3. Proteção de Dados')}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed m-0">
              {t('legal.privacy.section3.content', 'Seus dados são armazenados de forma segura com criptografia de ponta. Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado.')}
            </p>
          </div>

          <div className="bg-card/50 rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="text-lg font-semibold text-foreground m-0">
              {t('legal.privacy.section4.title', '4. Compartilhamento de Dados')}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed m-0">
              {t('legal.privacy.section4.content', 'Não vendemos suas informações pessoais. Podemos compartilhar dados com prestadores de serviços que nos ajudam a operar o aplicativo, sempre sob acordos de confidencialidade.')}
            </p>
          </div>

          <div className="bg-card/50 rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="text-lg font-semibold text-foreground m-0">
              {t('legal.privacy.section5.title', '5. Cookies e Tecnologias Similares')}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed m-0">
              {t('legal.privacy.section5.content', 'Usamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso do serviço e personalizar conteúdo. Você pode controlar o uso de cookies através das configurações do seu navegador.')}
            </p>
          </div>

          <div className="bg-card/50 rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="text-lg font-semibold text-foreground m-0">
              {t('legal.privacy.section6.title', '6. Seus Direitos')}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed m-0">
              {t('legal.privacy.section6.content', 'Você tem direito de acessar, corrigir ou excluir seus dados pessoais. Também pode solicitar a portabilidade dos seus dados ou revogar o consentimento a qualquer momento.')}
            </p>
          </div>

          <div className="bg-card/50 rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="text-lg font-semibold text-foreground m-0">
              {t('legal.privacy.section7.title', '7. LGPD e Conformidade')}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed m-0">
              {t('legal.privacy.section7.content', 'O MoneyQuest está em conformidade com a Lei Geral de Proteção de Dados (LGPD) do Brasil. Para exercer seus direitos ou esclarecer dúvidas, entre em contato através da página de Suporte.')}
            </p>
          </div>
        </section>

        {/* Footer */}
        <PublicFooter className="pt-4 pb-8" />
      </main>
    </div>
  );
};

export default Privacy;
