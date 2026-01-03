import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PublicFooter from '@/components/layout/PublicFooter';
import { useSEO } from '@/hooks/useSEO';
import { 
  PiggyBank, 
  Target, 
  Trophy, 
  Flame,
  Calendar,
  Clock,
  Star,
  ArrowRight,
  CheckCircle,
  Zap,
  Gift,
  TrendingUp
} from 'lucide-react';

const DesafiosFinanceiros = () => {
  const { t } = useTranslation();

  useSEO({
    title: 'Desafios Financeiros | MoneyQuest',
    description: 'Complete desafios financeiros, ganhe recompensas e melhore seus hábitos financeiros. Missões diárias, semanais e mensais.',
  });

  const challengeTypes = [
    {
      icon: <Clock className="w-8 h-8 text-blue-500" />,
      title: 'Missões Diárias',
      description: 'Tarefas rápidas para manter o controle do dia-a-dia financeiro.',
      examples: ['Registrar todas as despesas do dia', 'Manter limite de gastos', 'Categorizar transações'],
      xp: '50-100 XP',
      color: 'border-blue-500/30 bg-blue-500/5',
    },
    {
      icon: <Calendar className="w-8 h-8 text-purple-500" />,
      title: 'Desafios Semanais',
      description: 'Metas de médio prazo para desenvolver hábitos consistentes.',
      examples: ['Semana sem gastos impulsivos', 'Economizar 10% da renda', 'Usar apenas 3 categorias'],
      xp: '150-250 XP',
      color: 'border-purple-500/30 bg-purple-500/5',
    },
    {
      icon: <Target className="w-8 h-8 text-gold" />,
      title: 'Conquistas Mensais',
      description: 'Grandes objetivos que transformam suas finanças.',
      examples: ['Mês positivo em todas categorias', 'Criar reserva de emergência', 'Zerar uma dívida'],
      xp: '400-600 XP',
      color: 'border-gold/30 bg-gold/5',
    },
  ];

  const featuredChallenges = [
    {
      name: 'Sexta-feira Frugal',
      description: 'Passe toda sexta-feira sem gastar nada.',
      reward: '150 XP + Badge',
      difficulty: 'Médio',
    },
    {
      name: 'Caçador de Renda',
      description: 'Registre receitas de 2 fontes diferentes na semana.',
      reward: '175 XP',
      difficulty: 'Médio',
    },
    {
      name: 'Sprint de Economia',
      description: 'Economize 20% da sua renda esta semana.',
      reward: '250 XP + Badge',
      difficulty: 'Difícil',
    },
    {
      name: 'Congelamento de Gastos',
      description: 'Tenha pelo menos 2 dias sem gastar nada esta semana.',
      reward: '200 XP',
      difficulty: 'Médio',
    },
  ];

  const rewards = [
    {
      icon: <Zap className="w-6 h-6 text-gold" />,
      title: 'Pontos de Experiência (XP)',
      description: 'Acumule XP para subir de nível e desbloquear recursos.',
    },
    {
      icon: <Trophy className="w-6 h-6 text-gold" />,
      title: 'Badges Exclusivos',
      description: 'Colecione conquistas que mostram seu progresso.',
    },
    {
      icon: <Flame className="w-6 h-6 text-gold" />,
      title: 'Streaks Diários',
      description: 'Mantenha sequências e ganhe multiplicadores de XP.',
    },
    {
      icon: <Gift className="w-6 h-6 text-gold" />,
      title: 'Recompensas Premium',
      description: 'Complete desafios e ganhe dias de Premium grátis.',
    },
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
            <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-4 py-2 rounded-full mb-6">
              <Target className="w-5 h-5" />
              <span className="font-medium">Sistema de Desafios</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
              Complete{' '}
              <span className="text-primary">Desafios Financeiros</span>
              <br />e Ganhe Recompensas
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Transforme suas metas financeiras em missões épicas. 
              Complete desafios diários, semanais e mensais para ganhar XP, badges e melhorar seus hábitos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-gold hover:bg-gold/90 text-gold-foreground">
                <Link to="/signup">
                  Começar Desafios
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/educacao-financeira-gamificada">Como Funciona</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Challenge Types */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Tipos de Desafios
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Desafios adaptados para diferentes objetivos e níveis de dificuldade
            </p>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {challengeTypes.map((type, index) => (
                <Card key={index} className={`p-6 border-2 ${type.color}`}>
                  <div className="flex items-center justify-between mb-4">
                    {type.icon}
                    <span className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                      {type.xp}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{type.title}</h3>
                  <p className="text-muted-foreground mb-4">{type.description}</p>
                  <ul className="space-y-2">
                    {type.examples.map((example, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Challenges */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Desafios em Destaque
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Alguns dos desafios mais populares entre os jogadores
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {featuredChallenges.map((challenge, index) => (
                <Card key={index} className="p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <Star className="w-5 h-5 text-gold" />
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      challenge.difficulty === 'Fácil' ? 'bg-green-500/10 text-green-500' :
                      challenge.difficulty === 'Médio' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2">{challenge.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>
                  <div className="flex items-center gap-1 text-sm text-primary font-medium">
                    <Trophy className="w-4 h-4" />
                    {challenge.reward}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Rewards Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Recompensas por Completar Desafios
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Cada desafio completado traz benefícios reais para sua jornada
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {rewards.map((reward, index) => (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {reward.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{reward.title}</h3>
                  <p className="text-sm text-muted-foreground">{reward.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">50+</div>
                <div className="text-muted-foreground">Desafios Disponíveis</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">1M+</div>
                <div className="text-muted-foreground">Desafios Completados</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">85%</div>
                <div className="text-muted-foreground">Taxa de Engajamento</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto para o Primeiro Desafio?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Crie sua conta gratuita e comece a completar desafios hoje mesmo.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/signup">
                Aceitar o Desafio
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

export default DesafiosFinanceiros;
