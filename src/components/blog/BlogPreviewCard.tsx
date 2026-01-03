import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Newspaper, ArrowRight, Clock } from 'lucide-react';
import { blogArticles, BLOG_CATEGORIES } from '@/lib/blogData';

export const BlogPreviewCard = () => {
  const { t } = useTranslation();
  
  // Get the 3 most recent articles
  const recentArticles = [...blogArticles]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Newspaper className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">
              {t('blog.financialTips', 'Dicas Financeiras')}
            </CardTitle>
          </div>
          <Link to="/blog">
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 px-2">
              {t('common.seeAll', 'Ver todos')}
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {recentArticles.map((article) => (
          <Link
            key={article.slug}
            to={`/blog/${article.slug}`}
            className="block p-2.5 rounded-lg bg-background/50 hover:bg-background/80 border border-transparent hover:border-border/50 transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                  {article.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {BLOG_CATEGORIES[article.category]?.name || article.category}
                  </Badge>
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />
                    {article.readTime} min
                  </span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
