import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Gamepad2, Target, Heart, Shield, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PublicNavigation from '@/components/layout/PublicNavigation';
import PublicFooter from '@/components/layout/PublicFooter';
import { useSEO } from '@/hooks/useSEO';

const About = () => {
  const { t } = useTranslation();
  
  useSEO({
    title: t('about.meta.title', 'Sobre o MoneyQuest - Nossa Missão'),
    description: t('about.meta.description', 'Conheça a história do MoneyQuest, nossa missão de transformar finanças pessoais em uma jornada divertida e educativa através da gamificação.'),
  });

  const values = [
    {
      icon: Target,
      title: t('about.values.mission.title', 'Missão'),
      description: t('about.values.mission.description', 'Transformar a gestão financeira pessoal em uma experiência envolvente e educativa, ajudando pessoas a alcançarem seus objetivos financeiros de forma sustentável.'),
    },
    {
      icon: Heart,
      title: t('about.values.passion.title', 'Paixão'),
      description: t('about.values.passion.description', 'Acreditamos que cuidar das finanças não precisa ser chato. Combinamos gamificação com educação financeira para criar uma experiência única.'),
    },
    {
      icon: Shield,
      title: t('about.values.security.title', 'Segurança'),
      description: t('about.values.security.description', 'Seus dados são protegidos com os mais altos padrões de segurança. Privacidade e confiança são fundamentais para nossa plataforma.'),
    },
    {
      icon: Users,
      title: t('about.values.community.title', 'Comunidade'),
      description: t('about.values.community.description', 'Construímos uma comunidade de pessoas que querem melhorar sua relação com o dinheiro, compartilhando conquistas e apoiando uns aos outros.'),
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-hero mb-6">
              <Gamepad2 className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t('about.hero.title', 'Sobre o MoneyQuest')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('about.hero.subtitle', 'Uma nova forma de cuidar das suas finanças pessoais, transformando o controle financeiro em uma aventura gamificada.')}
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-semibold">
                {t('about.story.title', 'Nossa História')}
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>
                {t('about.story.p1', 'O MoneyQuest nasceu da observação de que muitas pessoas abandonam o controle financeiro por acharem tedioso ou complicado. Queríamos mudar isso.')}
              </p>
              <p>
                {t('about.story.p2', 'Combinando princípios de gamificação com as melhores práticas de educação financeira, criamos uma plataforma onde cada transação registrada é uma conquista, cada meta atingida é uma celebração, e cada hábito financeiro saudável é recompensado.')}
              </p>
              <p>
                {t('about.story.p3', 'Hoje, ajudamos milhares de pessoas a transformarem sua relação com o dinheiro, tornando o caminho para a saúde financeira mais leve e motivador.')}
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-8">
              {t('about.values.title', 'Nossos Valores')}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {values.map((value, index) => (
                <Card key={index} className="border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <value.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">{value.title}</h3>
                        <p className="text-sm text-muted-foreground">{value.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-3">
              {t('about.cta.title', 'Comece Sua Jornada Financeira')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t('about.cta.description', 'Junte-se a milhares de pessoas que já transformaram sua relação com o dinheiro.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button variant="gold" size="lg">
                  {t('landing.cta.startFree', 'Começar Grátis')}
                </Button>
              </Link>
              <Link to="/features">
                <Button variant="outline" size="lg">
                  {t('nav.features', 'Funcionalidades')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <div className="py-6 px-4">
        <PublicFooter />
      </div>
    </div>
  );
};

export default About;
