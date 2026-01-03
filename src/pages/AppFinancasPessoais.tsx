import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PublicFooter from '@/components/layout/PublicFooter';
import { useSEO } from '@/hooks/useSEO';
import { 
  PiggyBank, 
  Smartphone, 
  Shield, 
  Zap,
  Globe,
  Users,
  CheckCircle,
  ArrowRight,
  Wallet,
  BarChart3,
  Target,
  Trophy,
  Star,
  Clock
} from 'lucide-react';

const AppFinancasPessoais = () => {
  const { t } = useTranslation();

  useSEO({
    title: 'App de Finanças Pessoais | MoneyQuest',
    description: 'MoneyQuest é o melhor app de finanças pessoais com gamificação. Controle gastos, defina metas e economize dinheiro de forma divertida.',
  });

  const appFeatures = [
    {
      icon: <Wallet className="w-6 h-6" />,
      title: 'Controle de Gastos',
      description: 'Registre e categorize todas suas despesas e receitas.',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Relatórios Visuais',
      description: 'Gráficos intuitivos que mostram para onde vai seu dinheiro.',
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Metas Financeiras',
      description: 'Defina e acompanhe metas de orçamento por categoria.',
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: 'Gamificação Completa',
      description: 'XP, níveis, missões e conquistas para manter a motivação.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Ranking Social',
      description: 'Compare seu progresso com outros usuários.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Coach IA',
      description: 'Orientações personalizadas de inteligência artificial.',
    },
  ];

  const platforms = [
    { name: 'Web Browser', available: true },
    { name: 'Mobile Responsive', available: true },
    { name: 'PWA (Progressive Web App)', available: true },
  ];

  const comparisons = [
    { feature: 'Controle de gastos', moneyquest: true, others: true },
    { feature: 'Gamificação completa', moneyquest: true, others: false },
    { feature: 'Sistema de XP e níveis', moneyquest: true, others: false },
    { feature: 'Missões diárias/semanais', moneyquest: true, others: false },
    { feature: 'Coach IA personalizado', moneyquest: true, others: false },
    { feature: 'Ranking e competição', moneyquest: true, others: false },
    { feature: 'Múltiplas carteiras', moneyquest: true, others: true },
    { feature: 'Gratuito para começar', moneyquest: true, others: true },
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
              <Link to="/signup">Baixar Grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Smartphone className="w-5 h-5" />
              <span className="font-medium">Disponível em Todas as Plataformas</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
              O Melhor <span className="text-primary">App de Finanças Pessoais</span>
              <br />com Gamificação
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              MoneyQuest transforma o controle financeiro em uma experiência divertida e engajante. 
              Ganhe pontos, complete missões e conquiste suas metas financeiras.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
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
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span>4.9/5 avaliação</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>10K+ usuários</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                <span>100% seguro</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Recursos do App MoneyQuest
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar suas finanças pessoais em um só lugar
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {appFeatures.map((feature, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Por que MoneyQuest é Diferente
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Compare com outros apps de finanças pessoais
            </p>
            <div className="max-w-2xl mx-auto">
              <Card className="overflow-hidden">
                <div className="grid grid-cols-3 bg-primary text-primary-foreground p-4 font-semibold">
                  <div>Recurso</div>
                  <div className="text-center">MoneyQuest</div>
                  <div className="text-center">Outros Apps</div>
                </div>
                {comparisons.map((item, index) => (
                  <div key={index} className={`grid grid-cols-3 p-4 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}`}>
                    <div className="text-sm">{item.feature}</div>
                    <div className="text-center">
                      {item.moneyquest ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="text-center">
                      {item.others ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </section>

        {/* Platforms */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Acesse de Qualquer Lugar
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Use MoneyQuest no navegador ou instale como app no seu dispositivo
            </p>
            <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
              {platforms.map((platform, index) => (
                <Card key={index} className="p-4 flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${platform.available ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="font-medium">{platform.name}</span>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Comece em 3 Passos Simples
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Crie sua Conta</h3>
                <p className="text-muted-foreground">
                  Cadastro gratuito em menos de 1 minuto. Sem cartão de crédito.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Configure suas Carteiras</h3>
                <p className="text-muted-foreground">
                  Adicione suas contas bancárias e cartões em poucos cliques.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Comece sua Jornada</h3>
                <p className="text-muted-foreground">
                  Registre transações, complete missões e ganhe recompensas!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Baixe o Melhor App de Finanças Pessoais
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de usuários que já transformaram suas finanças com MoneyQuest.
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

export default AppFinancasPessoais;
