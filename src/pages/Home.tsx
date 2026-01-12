import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useAdSenseLoader } from '@/hooks/useAdSenseLoader';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  CreditCard, 
  Zap, 
  ChevronRight,
  Target,
  BarChart3,
  Gamepad2,
  Lock,
  Smartphone,
  HelpCircle,
  Heart,
  Users,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  PiggyBank,
  Calendar
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import PublicFooter from '@/components/layout/PublicFooter';
import PublicNavigation from '@/components/layout/PublicNavigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Home = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useAdSenseLoader();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicNavigation />
        <div className="flex-1 flex items-center justify-center">
          <Logo size="xl" animated shine priority className="justify-center" />
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  const features = [
    {
      icon: Target,
      title: 'Controle financeiro completo',
      description: 'Registre receitas e despesas de forma simples e organizada.'
    },
    {
      icon: BarChart3,
      title: 'Visualização clara de gastos',
      description: 'Veja para onde seu dinheiro vai com gráficos intuitivos.'
    },
    {
      icon: Gamepad2,
      title: 'Evolução gamificada',
      description: 'Ganhe XP, suba de nível e desbloqueie conquistas ao cuidar das suas finanças.'
    },
    {
      icon: Lock,
      title: 'Segurança e privacidade',
      description: 'Seus dados são criptografados e nunca serão vendidos.'
    },
    {
      icon: Smartphone,
      title: 'Acesso em qualquer lugar',
      description: 'Use no computador ou celular, quando e onde quiser.'
    },
    {
      icon: TrendingUp,
      title: 'Metas financeiras',
      description: 'Defina objetivos e acompanhe seu progresso mês a mês.'
    }
  ];

  const howItWorks = [
    {
      icon: PiggyBank,
      text: 'Registro simples de receitas e despesas'
    },
    {
      icon: BarChart3,
      text: 'Visualização clara por categorias e períodos'
    },
    {
      icon: Target,
      text: 'Definição de metas financeiras'
    },
    {
      icon: Calendar,
      text: 'Acompanhamento da evolução mês a mês'
    },
    {
      icon: Sparkles,
      text: 'Apoio à tomada de decisões financeiras melhores'
    }
  ];

  const targetAudience = [
    'Pessoas que querem organizar a vida financeira',
    'Quem está começando a controlar o dinheiro',
    'Quem desistiu de planilhas complicadas',
    'Quem busca simplicidade sem abrir mão de funcionalidades'
  ];

  const faqItems = [
    {
      question: 'O MoneyQuest é realmente gratuito?',
      answer: 'Sim! O MoneyQuest é 100% gratuito. Você não precisa de cartão de crédito para se cadastrar e não existe período de teste. Use todas as funcionalidades sem pagar nada.'
    },
    {
      question: 'Meus dados estão seguros?',
      answer: 'Absolutamente. Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança. Seus dados financeiros são protegidos e nunca serão vendidos ou compartilhados com terceiros.'
    },
    {
      question: 'Preciso entender de finanças para usar?',
      answer: 'Não! O MoneyQuest foi criado para ser simples e intuitivo. Se você sabe anotar quanto gastou e quanto recebeu, já está pronto para usar. A interface é amigável e te guia em cada passo.'
    },
    {
      question: 'Posso usar no celular?',
      answer: 'Sim! O MoneyQuest funciona perfeitamente no navegador do seu celular e pode ser instalado como um aplicativo (PWA). Acesse de qualquer dispositivo, a qualquer momento.'
    },
    {
      question: 'Como funciona a gamificação?',
      answer: 'Ao registrar suas transações e manter o controle financeiro, você ganha pontos de experiência (XP), sobe de nível e desbloqueia conquistas. É uma forma divertida de criar o hábito de cuidar do seu dinheiro.'
    }
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fixed Header */}
      <header className="flex-shrink-0 sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <PublicNavigation />
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full">
          {/* Hero Section */}
          <section className="py-12 md:py-20 px-4 bg-gradient-to-b from-primary/5 via-background to-background">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <Logo size="xl" animated shine priority className="justify-center mb-6" />
              
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                Controle seu dinheiro como um jogo
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Organize, acompanhe e evolua suas finanças pessoais de forma simples e 100% gratuita.
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center gap-4 py-4">
                <div className="flex items-center gap-2 bg-card/80 px-4 py-2 rounded-full border border-border">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2 bg-card/80 px-4 py-2 rounded-full border border-border">
                  <Zap className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">100% gratuito</span>
                </div>
                <div className="flex items-center gap-2 bg-card/80 px-4 py-2 rounded-full border border-border">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Sem cobranças escondidas</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  variant="gold"
                  size="lg"
                  onClick={() => navigate('/signup')}
                  className="text-lg px-8 h-14"
                >
                  Começar agora — é grátis
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/login?mode=login')}
                  className="text-lg px-8 h-14"
                >
                  Entrar
                </Button>
              </div>

              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 pt-4">
                <Shield className="w-4 h-4" />
                Seus dados são protegidos e nunca serão vendidos.
              </p>
            </div>
          </section>

          {/* Why MoneyQuest Section */}
          <section className="py-16 px-4 bg-muted/30">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Por que o MoneyQuest existe?
                </h2>
              </div>
              
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  Sabemos que controlar as finanças pessoais pode parecer complicado. Muitas pessoas tentam usar planilhas, 
                  aplicativos cheios de funcionalidades confusas ou simplesmente desistem de acompanhar para onde o dinheiro vai.
                </p>
                <p>
                  O MoneyQuest nasceu para mudar isso. Acreditamos que cuidar do seu dinheiro deve ser simples, 
                  motivador e até divertido. Por isso, criamos um app que combina controle financeiro com elementos 
                  de gamificação — você evolui junto com suas finanças.
                </p>
                <p>
                  Nossa missão é ajudar você a entender seus hábitos financeiros, tomar decisões melhores e 
                  construir um futuro mais tranquilo, sem complicação.
                </p>
              </div>
            </div>
          </section>

          {/* How it Works Section */}
          <section className="py-16 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Como o MoneyQuest funciona
                </h2>
                <p className="text-muted-foreground">
                  Simples, direto e eficiente
                </p>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                  Você registra suas receitas e despesas, acompanha tudo por categorias e períodos, 
                  e evolui suas finanças em poucos passos — sem complicação.
                </p>
              </div>
              
              <div className="grid gap-4 md:gap-6">
                {howItWorks.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 bg-card p-4 md:p-6 rounded-xl border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-foreground font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 px-4 bg-muted/30">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Funcionalidades
                </h2>
                <p className="text-muted-foreground">
                  Tudo o que você precisa para cuidar do seu dinheiro
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="bg-card p-6 rounded-xl border border-border hover:border-primary/30 hover:shadow-lg transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Target Audience Section */}
          <section className="py-16 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Para quem é o MoneyQuest?
                </h2>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {targetAudience.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 bg-card p-5 rounded-xl border border-border"
                  >
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Really Free Section */}
          <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium">
                <Heart className="w-4 h-4" />
                Gratuito de verdade
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Sem pegadinhas, sem letras miúdas
              </h2>
              
              <div className="space-y-3 text-muted-foreground">
                <p className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  Não exige cartão de crédito
                </p>
                <p className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  Sem período de teste que expira
                </p>
                <p className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  Sem taxas escondidas
                </p>
              </div>

              <Button 
                variant="gold"
                size="lg"
                onClick={() => navigate('/signup')}
                className="text-lg px-8 h-14 mt-4"
              >
                Começar agora — é grátis
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </section>

          {/* About Section */}
          <section className="py-16 px-4 bg-muted/30">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Sobre o MoneyQuest
                </h2>
              </div>
              
              <div className="bg-card p-8 rounded-2xl border border-border">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <Logo size="lg" className="justify-center" />
                  </div>
                <div className="space-y-4 text-center md:text-left">
                    <p className="text-muted-foreground">
                      Somos um aplicativo brasileiro de controle financeiro pessoal, 
                      desenvolvido com foco em simplicidade, transparência e acessibilidade.
                    </p>
                    <p className="text-muted-foreground">
                      Nosso objetivo é melhorar a relação das pessoas com o dinheiro, 
                      tornando o controle financeiro uma experiência motivadora e gratificante.
                    </p>
                    <Link 
                      to="/about"
                      className="inline-flex items-center text-primary hover:underline font-medium"
                    >
                      Saiba mais sobre nós
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-16 px-4">
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 text-primary">
                  <HelpCircle className="w-5 h-5" />
                  <span className="text-sm font-medium uppercase tracking-wide">FAQ</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Perguntas frequentes
                </h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-3">
                {faqItems.map((item, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-primary/30"
                  >
                    <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="py-16 px-4 bg-gradient-to-t from-primary/10 to-background">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Pronto para assumir o controle?
              </h2>
              <p className="text-muted-foreground text-lg">
                Comece agora e transforme sua relação com o dinheiro.
              </p>
              <Button 
                variant="gold"
                size="lg"
                onClick={() => navigate('/signup')}
                className="text-lg px-8 h-14"
              >
                Comece a organizar suas finanças — grátis
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </section>

          {/* Spacer for fixed footer */}
          <div className="h-20" />
        </div>
      </main>

      {/* Fixed Footer */}
      <footer className="flex-shrink-0 bg-card border-t border-border py-4 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-primary transition-colors">
              Termos de Uso
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Política de Privacidade
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link to="/support" className="hover:text-primary transition-colors">
              Contato
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MoneyQuest. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
