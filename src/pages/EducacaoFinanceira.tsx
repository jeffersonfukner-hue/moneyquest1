import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PublicFooter from '@/components/layout/PublicFooter';
import { useSEO } from '@/hooks/useSEO';
import { 
  PiggyBank, 
  BookOpen, 
  Trophy, 
  Target, 
  Zap,
  Brain,
  Gamepad2,
  Star,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Award
} from 'lucide-react';

const EducacaoFinanceira = () => {
  const { t } = useTranslation();

  useSEO({
    title: 'Educação Financeira Gamificada | MoneyQuest',
    description: 'Aprenda educação financeira jogando com missões, desafios e recompensas. Desenvolva hábitos financeiros saudáveis de forma divertida.',
  });

  const learningPaths = [
    {
      icon: <BookOpen className="w-8 h-8 text-primary" />,
      title: 'Fundamentos Financeiros',
      description: 'Aprenda conceitos básicos como orçamento, economia e controle de gastos através de missões diárias.',
      level: 'Iniciante',
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
      title: 'Planejamento Financeiro',
      description: 'Domine técnicas de planejamento, metas SMART e construção de reserva de emergência.',
      level: 'Intermediário',
    },
    {
      icon: <Brain className="w-8 h-8 text-primary" />,
      title: 'Mentalidade Financeira',
      description: 'Desenvolva uma relação saudável com o dinheiro e supere bloqueios financeiros.',
      level: 'Avançado',
    },
  ];

  const gamificationFeatures = [
    {
      icon: <Trophy className="w-6 h-6" />,
      title: 'Sistema de XP',
      description: 'Ganhe pontos de experiência a cada ação positiva nas suas finanças.',
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Missões Diárias',
      description: 'Complete desafios diários e desenvolva consistência financeira.',
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: 'Níveis e Rankings',
      description: 'Suba de nível e compare seu progresso no ranking global.',
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Conquistas',
      description: 'Desbloqueie badges exclusivos por marcos alcançados.',
    },
  ];

  const benefits = [
    'Aprenda conceitos financeiros de forma prática',
    'Desenvolva hábitos financeiros através de repetição gamificada',
    'Receba feedback instantâneo sobre suas decisões',
    'Mantenha a motivação com recompensas e progressão',
    'Acompanhe sua evolução em tempo real',
    'Aprenda no seu próprio ritmo',
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
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Gamepad2 className="w-5 h-5" />
              <span className="font-medium">Aprendizado Gamificado</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
              Educação Financeira{' '}
              <span className="text-primary">Gamificada</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Aprenda a controlar suas finanças como se fosse um jogo. 
              Complete missões, ganhe XP e desenvolva hábitos financeiros saudáveis enquanto se diverte.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-gold hover:bg-gold/90 text-gold-foreground">
                <Link to="/signup">
                  Começar a Aprender
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/desafios-financeiros">Ver Desafios</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Why Gamification Works */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Por que Gamificação Melhora as Finanças
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Estudos mostram que gamificação aumenta em até 60% o engajamento e retenção de hábitos
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {gamificationFeatures.map((feature, index) => (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Learning Paths */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Trilhas de Aprendizado
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Desenvolva suas habilidades financeiras através de trilhas progressivas
            </p>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {learningPaths.map((path, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
                  <div className="flex items-center justify-between mb-4">
                    {path.icon}
                    <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                      {path.level}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{path.title}</h3>
                  <p className="text-muted-foreground">{path.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                Benefícios do Aprendizado Gamificado
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

        {/* Premium Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-gold/10 text-gold-foreground px-4 py-2 rounded-full mb-6">
                <Zap className="w-5 h-5 text-gold" />
                <span className="font-medium text-gold">Recurso Premium</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Relatórios Avançados e Metas por Categoria
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Tenha acesso a análises detalhadas do seu fluxo de caixa, 
                defina limites de gastos por categoria e acompanhe sua evolução.
              </p>
              <Button size="lg" asChild>
                <Link to="/premium">
                  Conhecer o Premium
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Comece sua Jornada de Educação Financeira
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de pessoas que estão transformando suas finanças jogando.
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

export default EducacaoFinanceira;
