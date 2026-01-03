import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { blogArticles, BLOG_CATEGORIES, BlogCategory } from '@/lib/blogData';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import BlogBreadcrumb, { getBreadcrumbSchema } from '@/components/blog/BlogBreadcrumb';
import PublicFooter from '@/components/layout/PublicFooter';

const Blog = () => {
  useSEO({
    title: 'Blog | MoneyQuest - Dicas de Finanças e Gamificação',
    description: 'Aprenda sobre controle financeiro, educação financeira gamificada, desafios e hábitos para transformar sua vida financeira.',
    noIndex: false
  });

  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | 'all'>('all');

  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'all') return blogArticles;
    return blogArticles.filter(article => article.category === selectedCategory);
  }, [selectedCategory]);

  const categories: (BlogCategory | 'all')[] = ['all', ...Object.keys(BLOG_CATEGORIES) as BlogCategory[]];

  const breadcrumbItems = [{ label: 'Blog' }];
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Schema.org BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
        }}
      />

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="MoneyQuest" className="h-8" />
            <span className="font-bold text-xl text-primary">MoneyQuest</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Início
            </Link>
            <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </Link>
            <Link to="/blog" className="text-foreground font-medium">
              Blog
            </Link>
            <Link to="/signup">
              <Button variant="gold" size="sm">Começar Grátis</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <BlogBreadcrumb items={breadcrumbItems} />

        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Blog MoneyQuest
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Dicas práticas de controle financeiro, educação gamificada e desafios 
            para transformar sua relação com o dinheiro.
          </p>
        </section>

        {/* Category Filter */}
        <section className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category === 'all' ? 'Todos' : BLOG_CATEGORIES[category].name}
              </Button>
            ))}
          </div>
        </section>

        {/* Articles Grid */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {filteredArticles.map((article) => (
            <Link key={article.slug} to={`/blog/${article.slug}`}>
              <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer group">
                <CardHeader className="pb-3">
                  <Badge 
                    variant="secondary" 
                    className="w-fit mb-2 bg-primary/10 text-primary"
                  >
                    {BLOG_CATEGORIES[article.category].name}
                  </Badge>
                  <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(article.publishedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {article.readTime} min
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-primary/10 to-gold/10 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Pronto para transformar suas finanças?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Junte-se a milhares de pessoas que estão controlando gastos e 
            economizando dinheiro com o MoneyQuest.
          </p>
          <Link to="/signup">
            <Button variant="gold" size="lg">
              Começar Grátis Agora
            </Button>
          </Link>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Blog;
