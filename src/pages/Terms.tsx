import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/logo';
import { ArrowLeft, FileText } from 'lucide-react';
import PublicFooter from '@/components/layout/PublicFooter';

const Terms = () => {
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
            <FileText className="w-4 h-4" />
            {t('legal.terms.badge', 'Documento Legal')}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t('legal.terms.title', 'Termos de Uso')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('legal.lastUpdated', 'Última atualização')}: 02/01/2026
          </p>
        </section>

        {/* Content */}
        <section className="prose prose-sm dark:prose-invert max-w-none space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="bg-card/50 rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="text-lg font-semibold text-foreground m-0">
              {t('legal.terms.section1.title', '1. Aceitação dos Termos')}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed m-0">
              {t('legal.terms.section1.content', 'Ao acessar e usar o MoneyQuest, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá acessar o serviço.')}
            </p>
          </div>

          <div className="bg-card/50 rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="text-lg font-semibold text-foreground m-0">
              {t('legal.terms.section2.title', '2. Descrição do Serviço')}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed m-0">
              {t('legal.terms.section2.content', 'O MoneyQuest é um aplicativo de controle financeiro pessoal com elementos de gamificação. Oferecemos funcionalidades gratuitas e premium para ajudar você a gerenciar suas finanças de forma divertida e engajadora.')}
            </p>
          </div>

          <div className="bg-card/50 rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="text-lg font-semibold text-foreground m-0">
              {t('legal.terms.section3.title', '3. Conta de Usuário')}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed m-0">
              {t('legal.terms.section3.content', 'Você é responsável por manter a confidencialidade da sua conta e senha. Você concorda em aceitar responsabilidade por todas as atividades que ocorram sob sua conta.')}
            </p>
          </div>

          <div className="bg-card/50 rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="text-lg font-semibold text-foreground m-0">
              {t('legal.terms.section4.title', '4. Assinaturas Premium')}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed m-0">
              {t('legal.terms.section4.content', 'Os planos premium são cobrados de acordo com o ciclo de cobrança escolhido. Você pode cancelar sua assinatura a qualquer momento. Os reembolsos são processados conforme nossa política de reembolso.')}
            </p>
          </div>

          <div className="bg-card/50 rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="text-lg font-semibold text-foreground m-0">
              {t('legal.terms.section5.title', '5. Uso Aceitável')}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed m-0">
              {t('legal.terms.section5.content', 'Você concorda em não usar o serviço para fins ilegais ou não autorizados. Você não deve, no uso do serviço, violar quaisquer leis em sua jurisdição.')}
            </p>
          </div>

          <div className="bg-card/50 rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="text-lg font-semibold text-foreground m-0">
              {t('legal.terms.section6.title', '6. Limitação de Responsabilidade')}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed m-0">
              {t('legal.terms.section6.content', 'O MoneyQuest não se responsabiliza por decisões financeiras tomadas com base nas informações fornecidas pelo aplicativo. As informações são apenas para fins educacionais e de organização pessoal.')}
            </p>
          </div>

          <div className="bg-card/50 rounded-2xl p-6 border border-border/50 space-y-4">
            <h2 className="text-lg font-semibold text-foreground m-0">
              {t('legal.terms.section7.title', '7. Contato')}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed m-0">
              {t('legal.terms.section7.content', 'Para questões sobre estes Termos de Uso, entre em contato conosco através da página de Suporte no aplicativo.')}
            </p>
          </div>
        </section>

        {/* Footer */}
        <PublicFooter className="pt-4 pb-8" />
      </main>
    </div>
  );
};

export default Terms;
