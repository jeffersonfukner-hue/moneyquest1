import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  ChevronRight,
  Wallet,
  BarChart3,
  Lock,
  ArrowRightLeft,
  CalendarCheck,
  PieChart,
  Banknote,
  FileCheck,
  CheckCircle2,
  HelpCircle,
  Eye,
  History,
  RefreshCw
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import PublicNavigation from '@/components/layout/PublicNavigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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
      icon: Eye,
      title: 'Visão financeira clara',
      description: 'Saldo total, resultado do período, projeções e alertas objetivos.'
    },
    {
      icon: Wallet,
      title: 'Carteiras organizadas',
      description: 'Contas, cartões, cheques, empréstimos e dinheiro (espécie).'
    },
    {
      icon: Banknote,
      title: 'Dinheiro em espécie',
      description: 'Controle real de pagamentos e recebimentos em dinheiro.'
    },
    {
      icon: ArrowRightLeft,
      title: 'Conciliação bancária',
      description: 'Compare lançamentos com extratos e garanta que tudo bate.'
    },
    {
      icon: CalendarCheck,
      title: 'Compromissos futuros',
      description: 'Visualize vencimentos e impacto no caixa.'
    },
    {
      icon: PieChart,
      title: 'Relatórios úteis',
      description: 'Entenda gastos, categorias, fornecedores e tendências.'
    }
  ];

  const targetAudience = [
    'Quer controle financeiro sem infantilização',
    'Se incomoda com números que não batem',
    'Prefere clareza a efeitos visuais',
    'Leva dinheiro a sério'
  ];

  const brandValues = [
    {
      icon: Eye,
      title: 'Clareza',
      description: 'Informação financeira apresentada de forma direta e compreensível.'
    },
    {
      icon: Shield,
      title: 'Confiabilidade',
      description: 'Números que podem ser conferidos e detalhados a qualquer momento.'
    },
    {
      icon: Lock,
      title: 'Responsabilidade',
      description: 'Seus dados protegidos com criptografia e nunca compartilhados.'
    },
    {
      icon: BarChart3,
      title: 'Autonomia',
      description: 'Você no controle das suas decisões financeiras.'
    }
  ];

  const faqItems = [
    {
      question: 'O MoneyQuest é realmente gratuito?',
      answer: 'Sim. O MoneyQuest é 100% gratuito para uso pessoal. Não exigimos cartão de crédito para cadastro e não há período de teste que expire. Use todas as funcionalidades sem custo.'
    },
    {
      question: 'Meus dados estão seguros?',
      answer: 'Absolutamente. Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança. Seus dados financeiros são protegidos e nunca serão vendidos ou compartilhados com terceiros.'
    },
    {
      question: 'Preciso entender de contabilidade para usar?',
      answer: 'Não. O MoneyQuest foi projetado para ser intuitivo. Se você sabe anotar quanto gastou e quanto recebeu, está pronto para usar. A interface orienta cada passo de forma clara.'
    },
    {
      question: 'Posso usar no celular?',
      answer: 'Sim. O MoneyQuest funciona perfeitamente no navegador do seu celular e pode ser instalado como um aplicativo (PWA). Acesse de qualquer dispositivo, a qualquer momento.'
    },
    {
      question: 'O que é o fechamento mensal?',
      answer: 'O fechamento mensal é um recurso que congela os números de um período após você confirmar que estão corretos. Isso cria um histórico confiável e protege os dados contra alterações acidentais.'
    },
    {
      question: 'Posso importar meus extratos bancários?',
      answer: 'Sim. O MoneyQuest permite importar extratos em formato CSV para facilitar a conciliação bancária. O sistema detecta duplicatas e organiza os lançamentos automaticamente.'
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
          <section className="py-16 md:py-24 px-4 bg-background">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <Logo size="xl" priority className="justify-center mb-8" />
              
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                Controle financeiro pessoal, do jeito certo.
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Organize, entenda e confie nos seus números. Sem jogos, sem atalhos, sem confusão.
              </p>

              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                O MoneyQuest é um sistema de controle financeiro pessoal criado para quem leva dinheiro a sério. 
                Cada valor tem origem, cada saldo é conferível e cada mês pode ser fechado com segurança.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button 
                  variant="gold"
                  size="lg"
                  onClick={() => navigate('/signup')}
                  className="text-lg px-8 h-14"
                >
                  Começar agora
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const element = document.getElementById('how-it-works');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-lg px-8 h-14"
                >
                  Ver como funciona
                </Button>
              </div>

              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 pt-4">
                <Shield className="w-4 h-4" />
                Seus dados são protegidos e nunca serão vendidos.
              </p>
            </div>
          </section>

          {/* Why MoneyQuest is Different */}
          <section className="py-16 px-4 bg-muted/30">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Por que o MoneyQuest é diferente
                </h2>
              </div>
              
              <div className="bg-card p-6 md:p-8 rounded-xl border border-border space-y-6">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  A maioria dos apps financeiros mostra números bonitos.
                </p>
                <p className="text-lg text-foreground font-medium leading-relaxed">
                  Poucos mostram números confiáveis.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  O MoneyQuest foi construído com a lógica de sistemas financeiros profissionais, 
                  adaptada para o uso pessoal.
                </p>
                
                <div className="pt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-foreground">Nada de saldo confuso</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-foreground">Nada de misturar gasto, dívida e transferência</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-foreground">Tudo pode ser conferido e detalhado</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* What You Control Section */}
          <section id="how-it-works" className="py-16 px-4">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  O que você controla
                </h2>
                <p className="text-muted-foreground">
                  Ferramentas objetivas para sua organização financeira
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="bg-card p-6 rounded-xl border border-border hover:border-primary/30 transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Reports and Monthly Closing */}
          <section className="py-16 px-4 bg-muted/30">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Relatórios e Fechamento Mensal
                </h2>
                <p className="text-lg text-muted-foreground">
                  Quando o mês termina, você pode fechá-lo.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-xl border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <FileCheck className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Congelamento de números</h3>
                      <p className="text-sm text-muted-foreground">
                        Os dados do período ficam protegidos contra alterações acidentais.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card p-6 rounded-xl border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <History className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Histórico preservado</h3>
                      <p className="text-sm text-muted-foreground">
                        Cada fechamento cria um registro permanente para consulta futura.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card p-6 rounded-xl border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Comparações confiáveis</h3>
                      <p className="text-sm text-muted-foreground">
                        Compare meses com segurança, sabendo que os números são definitivos.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card p-6 rounded-xl border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Reabertura controlada</h3>
                      <p className="text-sm text-muted-foreground">
                        Se necessário, reabra um mês fechado de forma auditada.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Target Audience Section */}
          <section className="py-16 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Para quem é o MoneyQuest
                </h2>
                <p className="text-muted-foreground">
                  O MoneyQuest é para quem:
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {targetAudience.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 bg-card p-5 rounded-xl border border-border"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-foreground">{item}</p>
                  </div>
                ))}
              </div>
              
              <p className="text-center text-lg font-medium text-muted-foreground pt-4">
                Não é um jogo. É uma ferramenta.
              </p>
            </div>
          </section>

          {/* Brand Values Section */}
          <section className="py-16 px-4 bg-muted/30">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Nossos valores
                </h2>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {brandValues.map((value, index) => (
                  <div 
                    key={index}
                    className="bg-card p-6 rounded-xl border border-border text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <value.icon className="w-6 h-6 text-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-16 px-4">
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 text-muted-foreground">
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
          <section className="py-16 px-4 bg-muted/30">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Comece simples. Evolua com segurança.
              </h2>
              <p className="text-muted-foreground text-lg">
                Controle financeiro pessoal, com seriedade.
              </p>
              <Button 
                variant="gold"
                size="lg"
                onClick={() => navigate('/signup')}
                className="text-lg px-8 h-14"
              >
                Começar agora
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
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Política de Privacidade
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link to="/support" className="hover:text-foreground transition-colors">
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
