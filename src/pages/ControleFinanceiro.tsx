import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PublicFooter from '@/components/layout/PublicFooter';
import { useSEO } from '@/hooks/useSEO';
import { 
  PiggyBank, 
  TrendingUp, 
  Target, 
  Wallet, 
  BarChart3, 
  Shield,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Bell,
  Sparkles
} from 'lucide-react';

const ControleFinanceiro = () => {
  const { t } = useTranslation();

  useSEO({
    title: 'Controle Financeiro Gamificado | MoneyQuest',
    description: 'Controle suas finanças pessoais com gamificação, ganhe pontos e economize dinheiro com o MoneyQuest. App gratuito de controle financeiro.',
  });

  const features = [
    {
      icon: <Wallet className="w-8 h-8 text-primary" />,
      title: 'Múltiplas Carteiras',
      description: 'Organize suas contas bancárias, cartões e dinheiro em espécie em um só lugar.',
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-primary" />,
      title: 'Relatórios Detalhados',
      description: 'Visualize seus gastos por categoria, período e descubra para onde vai seu dinheiro.',
    },
    {
      icon: <Target className="w-8 h-8 text-primary" />,
      title: 'Metas de Orçamento',
      description: 'Defina limites por categoria e receba alertas quando estiver gastando demais.',
    },
    {
      icon: <Bell className="w-8 h-8 text-primary" />,
      title: 'Alertas Inteligentes',
      description: 'Receba notificações sobre gastos excessivos e conquistas alcançadas.',
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
      title: 'Análise de Tendências',
      description: 'Compare seus gastos mês a mês e identifique padrões de comportamento.',
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: 'Segurança Total',
      description: 'Seus dados financeiros protegidos com criptografia de nível bancário.',
    },
  ];

  const benefits = [
    'Registre receitas e despesas em segundos',
    'Categorize automaticamente suas transações',
    'Acompanhe o saldo de todas as suas contas',
    'Visualize gráficos e relatórios em tempo real',
    'Defina e acompanhe metas de economia',
    'Ganhe XP e suba de nível enquanto economiza',
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <PiggyBank className="w-8 h-8 text-primary" />
            <span className="font-bold text-xl">MoneyQuest</span>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild className="bg-gold hover:bg-gold/90 text-gold-foreground">
              <Link to="/signup">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
              App Financeiro Gamificado para{' '}
              <span className="text-primary">Controlar Gastos</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Transforme o controle financeiro em uma experiência divertida. 
              Registre transações, acompanhe metas e ganhe recompensas enquanto organiza suas finanças.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-gold hover:bg-gold/90 text-gold-foreground">
                <Link to="/signup">
                  Começar Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/features">Ver Recursos</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Como Funciona o MoneyQuest
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Registre</h3>
                <p className="text-muted-foreground">
                  Adicione suas transações rapidamente. Categorize receitas e despesas com poucos toques.
                </p>
              </Card>
              <Card className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Analise</h3>
                <p className="text-muted-foreground">
                  Visualize relatórios e gráficos que mostram exatamente para onde vai seu dinheiro.
                </p>
              </Card>
              <Card className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Conquiste</h3>
                <p className="text-muted-foreground">
                  Ganhe XP, complete missões e suba de nível enquanto melhora suas finanças.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Por que Escolher o MoneyQuest
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Recursos poderosos para transformar sua relação com o dinheiro
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                Tudo que Você Precisa para Controlar suas Finanças
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-background rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Comece a Controlar suas Finanças Hoje
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              100% gratuito. Sem cartão de crédito. Comece em menos de 1 minuto.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/signup">
                Criar Conta Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default ControleFinanceiro;
