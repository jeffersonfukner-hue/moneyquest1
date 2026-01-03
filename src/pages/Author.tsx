import { useParams, Navigate, Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { getAuthorBySlug, getAuthorSchema, defaultAuthor } from '@/lib/authorData';
import { blogArticles } from '@/lib/blogData';
import { Linkedin, Twitter, Instagram, Calendar, Clock, ChevronRight } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import BlogBreadcrumb, { getBreadcrumbSchema } from '@/components/blog/BlogBreadcrumb';
import PublicFooter from '@/components/layout/PublicFooter';

const Author = () => {
  const { slug } = useParams<{ slug: string }>();
  const author = slug ? getAuthorBySlug(slug) : defaultAuthor;

  useSEO({
    title: author ? `${author.name} | MoneyQuest Blog` : 'Autor | MoneyQuest',
    description: author?.shortBio || 'Conheça os autores do blog MoneyQuest.',
    noIndex: false
  });

  if (!author) {
    return <Navigate to="/blog" replace />;
  }

  const authorArticles = blogArticles.slice(0, 6); // All articles are from the team

  const breadcrumbItems = [
    { label: 'Blog', href: '/blog' },
    { label: author.name }
  ];

  const authorSchema = getAuthorSchema(author);
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(authorSchema)
        }}
      />
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
            <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
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

        {/* Author Profile Section */}
        <section className="max-w-4xl mx-auto mb-12">
          <div className="bg-gradient-to-r from-primary/10 to-gold/10 rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={author.avatar} alt={author.name} />
                <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                  {author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {author.name}
                </h1>
                <p className="text-lg text-muted-foreground mb-4">{author.role}</p>

                {/* Social Links */}
                <div className="flex gap-4 justify-center md:justify-start mb-6">
                  {author.socialLinks.linkedin && (
                    <a
                      href={author.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-background rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {author.socialLinks.twitter && (
                    <a
                      href={author.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-background rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      aria-label="Twitter"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {author.socialLinks.instagram && (
                    <a
                      href={author.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-background rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                </div>

                {/* Expertise Tags */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {author.expertise.map((exp) => (
                    <Badge key={exp} variant="secondary" className="bg-background">
                      {exp}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bio Section */}
        <section className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Sobre</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground">
            {author.bio.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {/* Credentials Section */}
        <section className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Credenciais</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {author.credentials.map((credential, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border"
              >
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-foreground">{credential}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Articles Section */}
        <section className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Artigos Publicados
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {authorArticles.map((article) => (
              <Link key={article.slug} to={`/blog/${article.slug}`}>
                <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer group">
                  <CardHeader className="pb-3">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link to="/blog">
              <Button variant="outline">
                Ver Todos os Artigos
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 to-gold/10 rounded-2xl p-8 md:p-12 text-center">
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

export default Author;
