import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { blogArticles, BLOG_CATEGORIES, BlogCategory } from '@/lib/blogData';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import BlogBreadcrumb, { getBreadcrumbSchema } from '@/components/blog/BlogBreadcrumb';
import PublicFooter from '@/components/layout/PublicFooter';
import PublicNavigation from '@/components/layout/PublicNavigation';
import { BlogAdBanner } from '@/components/ads/BlogAdBanner';
import { BlogInternalBanner } from '@/components/ads/BlogInternalBanner';
import { useBlogAdSense } from '@/hooks/useBlogAdSense';

// Consider articles from the last 7 days as "recent"
const RECENT_DAYS = 7;

const Blog = () => {
  // Load AdSense script for blog pages
  useBlogAdSense();

  useSEO({
    title: 'Blog | MoneyQuest - Dicas de Finanças e Gamificação',
    description: 'Aprenda sobre controle financeiro, educação financeira gamificada, desafios e hábitos para transformar sua vida financeira.',
    noIndex: false
  });

  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | 'all'>('all');

  // Separate recent articles (last 7 days)
  const { recentArticles, olderArticles } = useMemo(() => {
    const now = new Date();
    const recentCutoff = new Date(now.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000);
    
    const recent = blogArticles.filter(article => 
      new Date(article.publishedAt) >= recentCutoff
    ).sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    
    const older = blogArticles.filter(article => 
      new Date(article.publishedAt) < recentCutoff
    ).sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    
    return { recentArticles: recent, olderArticles: older };
  }, []);

  const filteredArticles = useMemo(() => {
    const articlesToFilter = selectedCategory === 'all' ? olderArticles : olderArticles.filter(article => article.category === selectedCategory);
    return articlesToFilter;
  }, [selectedCategory, olderArticles]);

  const filteredRecentArticles = useMemo(() => {
    if (selectedCategory === 'all') return recentArticles;
    return recentArticles.filter(article => article.category === selectedCategory);
  }, [selectedCategory, recentArticles]);

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

      <PublicNavigation />

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

        {/* Recent Articles Section */}
        {filteredRecentArticles.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Novos Artigos</h2>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Recentes
              </Badge>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRecentArticles.map((article) => {
                const categoryData = BLOG_CATEGORIES[article.category];
                return (
                  <Link key={article.slug} to={`/blog/${article.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer group overflow-hidden ring-2 ring-primary/20">
                      {/* Fun Thumbnail with "NEW" badge */}
                      <div className={`relative h-32 bg-gradient-to-br ${categoryData.bgGradient} flex items-center justify-center overflow-hidden`}>
                        {/* NEW badge */}
                        <Badge 
                          className="absolute top-2 right-2 bg-primary text-primary-foreground animate-pulse"
                        >
                          Novo!
                        </Badge>
                        {/* Floating background emojis */}
                        <div className="absolute inset-0 opacity-20">
                          {categoryData.iconEmojis.map((emoji, i) => (
                            <span 
                              key={i} 
                              className="absolute text-2xl animate-float"
                              style={{
                                left: `${15 + i * 25}%`,
                                top: `${20 + (i % 2) * 40}%`,
                                animationDelay: `${i * 0.5}s`
                              }}
                            >
                              {emoji}
                            </span>
                          ))}
                        </div>
                        {/* Main emoji */}
                        <span className="text-5xl group-hover:scale-110 transition-transform duration-300 drop-shadow-lg relative z-10">
                          {categoryData.emoji}
                        </span>
                        {/* Category badge overlay */}
                        <Badge 
                          variant="secondary" 
                          className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm text-xs"
                        >
                          {categoryData.name}
                        </Badge>
                      </div>
                      
                      <CardHeader className="pb-2 pt-4">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(article.publishedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {article.readTime} min
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Older Articles Grid */}
        {filteredArticles.length > 0 && (
          <section className="mb-12">
            {filteredRecentArticles.length > 0 && (
              <h2 className="text-xl font-semibold text-muted-foreground mb-6">
                Mais Artigos
              </h2>
            )}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => {
            const categoryData = BLOG_CATEGORIES[article.category];
            return (
              <Link key={article.slug} to={`/blog/${article.slug}`}>
                <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer group overflow-hidden">
                  {/* Fun Thumbnail */}
                  <div className={`relative h-32 bg-gradient-to-br ${categoryData.bgGradient} flex items-center justify-center overflow-hidden`}>
                    {/* Floating background emojis */}
                    <div className="absolute inset-0 opacity-20">
                      {categoryData.iconEmojis.map((emoji, i) => (
                        <span 
                          key={i} 
                          className="absolute text-2xl animate-float"
                          style={{
                            left: `${15 + i * 25}%`,
                            top: `${20 + (i % 2) * 40}%`,
                            animationDelay: `${i * 0.5}s`
                          }}
                        >
                          {emoji}
                        </span>
                      ))}
                    </div>
                    {/* Main emoji */}
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-300 drop-shadow-lg relative z-10">
                      {categoryData.emoji}
                    </span>
                    {/* Category badge overlay */}
                    <Badge 
                      variant="secondary" 
                      className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm text-xs"
                    >
                      {categoryData.name}
                    </Badge>
                  </div>
                  
                  <CardHeader className="pb-2 pt-4">
                    <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h2>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(article.publishedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.readTime} min
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
            </div>
          </section>
        )}

        {/* INTERNAL BANNER - Conditional by user type */}
        <BlogInternalBanner className="mb-8" />

        {/* AD BANNER - Google AdSense (all users) */}
        <BlogAdBanner position="footer" className="mb-8" />

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
