import { useParams, Link, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSEO } from '@/hooks/useSEO';
import { getArticleBySlug, getRelatedArticles, BLOG_CATEGORIES } from '@/lib/blogData';
import { defaultAuthor, getAuthorSchema } from '@/lib/authorData';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import BlogBreadcrumb, { getBreadcrumbSchema } from '@/components/blog/BlogBreadcrumb';
import AuthorCard from '@/components/blog/AuthorCard';
import PublicFooter from '@/components/layout/PublicFooter';

// Custom component to render markdown-like content
const ArticleContent = ({ content }: { content: string }) => {
  // Process content to convert markdown to HTML
  const processContent = (text: string): React.ReactNode[] => {
    // Split by lines
    const lines = text.trim().split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let inTable = false;
    let tableRows: string[][] = [];
    
    const flushList = () => {
      if (currentList.length > 0) {
        const ListTag = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={elements.length} className={listType === 'ol' ? 'list-decimal ml-6 my-4 space-y-2' : 'list-disc ml-6 my-4 space-y-2'}>
            {currentList.map((item, i) => (
              <li key={i} className="text-foreground/90" dangerouslySetInnerHTML={{ __html: processInline(item) }} />
            ))}
          </ListTag>
        );
        currentList = [];
        listType = null;
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        const headerRow = tableRows[0];
        const bodyRows = tableRows.slice(2); // Skip header and separator
        elements.push(
          <div key={elements.length} className="overflow-x-auto my-6">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  {headerRow.map((cell, i) => (
                    <th key={i} className="border border-border px-4 py-2 text-left font-semibold">
                      {cell.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? '' : 'bg-muted/50'}>
                    {row.map((cell, j) => (
                      <td key={j} className="border border-border px-4 py-2" dangerouslySetInnerHTML={{ __html: processInline(cell.trim()) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    const processInline = (text: string): string => {
      // Bold
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic
      text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Links - internal
      text = text.replace(/\[([^\]]+)\]\(\/([^)]+)\)/g, '<a href="/$2" class="text-primary hover:underline">$1</a>');
      // Links - external
      text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');
      // Emojis are preserved
      return text;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Table detection
      if (line.includes('|') && line.trim().startsWith('|')) {
        if (!inTable) {
          flushList();
          inTable = true;
        }
        const cells = line.split('|').filter(c => c.trim() !== '');
        if (!line.includes('---')) {
          tableRows.push(cells);
        } else {
          tableRows.push([]); // Separator placeholder
        }
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Headers
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={elements.length} className="text-3xl md:text-4xl font-bold text-foreground mt-8 mb-4">
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={elements.length} className="text-2xl font-bold text-foreground mt-8 mb-3">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={elements.length} className="text-xl font-semibold text-foreground mt-6 mb-2">
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        flushList();
        elements.push(
          <h4 key={elements.length} className="text-lg font-semibold text-foreground mt-4 mb-2">
            {line.slice(5)}
          </h4>
        );
      }
      // Unordered list
      else if (line.match(/^[-*] /)) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        currentList.push(line.slice(2));
      }
      // Ordered list
      else if (line.match(/^\d+\. /)) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        currentList.push(line.replace(/^\d+\. /, ''));
      }
      // Empty line
      else if (line.trim() === '') {
        flushList();
      }
      // Paragraph
      else if (line.trim()) {
        flushList();
        elements.push(
          <p 
            key={elements.length} 
            className="text-foreground/90 leading-relaxed my-4"
            dangerouslySetInnerHTML={{ __html: processInline(line) }}
          />
        );
      }
    }

    flushList();
    flushTable();
    
    return elements;
  };

  return <article className="prose-custom">{processContent(content)}</article>;
};

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useSEO({
    title: article?.metaTitle || 'Artigo não encontrado | MoneyQuest',
    description: article?.metaDescription || 'Artigo não encontrado',
    noIndex: !article
  });

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const relatedArticles = getRelatedArticles(article.slug);

  const author = defaultAuthor;

  const breadcrumbItems = [
    { label: 'Blog', href: '/blog' },
    { label: article.title }
  ];

  // JSON-LD Schema for Article
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.metaDescription,
    "datePublished": article.publishedAt,
    "dateModified": article.updatedAt,
    "author": {
      "@type": "Person",
      "name": author.name,
      "url": `https://moneyquest.app.br/autor/${author.slug}`
    },
    "publisher": {
      "@type": "Organization",
      "name": "MoneyQuest",
      "logo": {
        "@type": "ImageObject",
        "url": "https://moneyquest.app.br/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://moneyquest.app.br/blog/${article.slug}`
    }
  };

  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);
  const authorSchema = getAuthorSchema(author);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Schema.org JSON-LD */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(authorSchema) }}
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <BlogBreadcrumb items={breadcrumbItems} />

        {/* Back Button */}
        <Link to="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar para o Blog
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          <Badge 
            variant="secondary" 
            className="mb-4 bg-primary/10 text-primary"
          >
            {BLOG_CATEGORIES[article.category].name}
          </Badge>
          
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {article.title}
          </h1>
          
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(article.publishedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {article.readTime} min de leitura
            </span>
          </div>
        </header>

        {/* Article Content */}
        <div className="bg-card rounded-lg border p-6 md:p-10 mb-8">
          <ArticleContent content={article.content} />
        </div>

        {/* Author Card */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Escrito por</h2>
          <AuthorCard author={author} />
        </section>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Artigos Relacionados
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {relatedArticles.map((related) => (
                <Link key={related.slug} to={`/blog/${related.slug}`}>
                  <Card className="h-full hover:shadow-md transition-all hover:border-primary/50 cursor-pointer group">
                    <CardHeader className="pb-2">
                      <Badge 
                        variant="secondary"
                        className="w-fit mb-2 bg-primary/10 text-primary text-xs"
                      >
                        {BLOG_CATEGORIES[related.category].name}
                      </Badge>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {related.title}
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {related.excerpt}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-primary/10 to-gold/10 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Quer transformar sua vida financeira em um jogo?
          </h2>
          <p className="text-muted-foreground mb-6">
            Conheça o MoneyQuest e comece hoje a controlar suas finanças com diversão.
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

export default BlogArticle;
