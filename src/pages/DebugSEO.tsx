import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { blogArticles } from '@/lib/blogData';
import { 
  validateAllArticlesSEO, 
  getSEOIssues, 
  SEO_LIMITS, 
  getStatusBadgeVariant,
  type SEOValidation 
} from '@/lib/seoValidation';
import { 
  Search, 
  Globe, 
  FileText, 
  Image, 
  Twitter, 
  Linkedin, 
  Facebook,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface MetaTag {
  name?: string;
  property?: string;
  content: string;
}

const DebugSEO = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [routeInput, setRouteInput] = useState(location.pathname);
  const [currentMetas, setCurrentMetas] = useState<MetaTag[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // SEO Validations for all articles
  const allValidations = useMemo(() => validateAllArticlesSEO(blogArticles), []);
  const seoIssues = useMemo(() => getSEOIssues(allValidations), [allValidations]);
  
  const errorCount = seoIssues.filter(i => i.status === 'error').length;
  const warningCount = seoIssues.filter(i => i.status === 'warning').length;
  const totalArticles = blogArticles.length;

  // Group validations by article
  const validationsByArticle = useMemo(() => {
    const grouped: Record<string, SEOValidation[]> = {};
    allValidations.forEach(v => {
      if (!grouped[v.slug]) grouped[v.slug] = [];
      grouped[v.slug].push(v);
    });
    return grouped;
  }, [allValidations]);

  // Read current page meta tags
  const analyzePage = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const metas: MetaTag[] = [];
      
      // Get all meta tags
      document.querySelectorAll('meta').forEach(meta => {
        const name = meta.getAttribute('name');
        const property = meta.getAttribute('property');
        const content = meta.getAttribute('content');
        
        if (content && (name || property)) {
          metas.push({ name: name || undefined, property: property || undefined, content });
        }
      });
      
      setCurrentMetas(metas);
      setIsAnalyzing(false);
    }, 300);
  };

  useEffect(() => {
    analyzePage();
  }, [location.pathname]);

  const getMetaValue = (nameOrProperty: string): string => {
    const meta = currentMetas.find(m => m.name === nameOrProperty || m.property === nameOrProperty);
    return meta?.content || '';
  };

  const title = document.title;
  const description = getMetaValue('description');
  const ogTitle = getMetaValue('og:title') || title;
  const ogDescription = getMetaValue('og:description') || description;
  const ogImage = getMetaValue('og:image');
  const ogUrl = getMetaValue('og:url');
  const twitterCard = getMetaValue('twitter:card');
  const twitterTitle = getMetaValue('twitter:title') || ogTitle;
  const twitterDescription = getMetaValue('twitter:description') || ogDescription;
  const twitterImage = getMetaValue('twitter:image') || ogImage;
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
  const robots = getMetaValue('robots');

  const getTitleStatus = (len: number): 'ok' | 'warning' | 'error' => {
    if (len < SEO_LIMITS.metaTitle.min) return 'error';
    if (len > SEO_LIMITS.metaTitle.max) return 'error';
    if (len < SEO_LIMITS.metaTitle.ideal) return 'warning';
    return 'ok';
  };

  const getDescriptionStatus = (len: number): 'ok' | 'warning' | 'error' => {
    if (len < SEO_LIMITS.metaDescription.min) return 'error';
    if (len > SEO_LIMITS.metaDescription.max) return 'warning';
    if (len < SEO_LIMITS.metaDescription.ideal) return 'warning';
    return 'ok';
  };

  const copyMetaAsHTML = () => {
    const html = `
<title>${title}</title>
<meta name="description" content="${description}" />
<meta property="og:title" content="${ogTitle}" />
<meta property="og:description" content="${ogDescription}" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:url" content="${ogUrl}" />
<meta name="twitter:card" content="${twitterCard}" />
<meta name="twitter:title" content="${twitterTitle}" />
<meta name="twitter:description" content="${twitterDescription}" />
<meta name="twitter:image" content="${twitterImage}" />
<link rel="canonical" href="${canonical}" />
    `.trim();
    
    navigator.clipboard.writeText(html);
    toast.success('Meta tags copiadas para clipboard!');
  };

  const navigateToRoute = () => {
    if (routeInput && routeInput !== location.pathname) {
      navigate(routeInput);
    } else {
      analyzePage();
    }
  };

  const StatusIcon = ({ status }: { status: 'ok' | 'warning' | 'error' }) => {
    switch (status) {
      case 'ok': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  // Only render in development
  if (!import.meta.env.DEV) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Esta página só está disponível em modo de desenvolvimento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Search className="h-8 w-8 text-primary" />
              Debug SEO
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize e valide meta tags de qualquer rota do site
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Input 
              value={routeInput}
              onChange={(e) => setRouteInput(e.target.value)}
              placeholder="/rota"
              className="w-48"
              onKeyDown={(e) => e.key === 'Enter' && navigateToRoute()}
            />
            <Button onClick={navigateToRoute} disabled={isAnalyzing}>
              {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Analisar
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Artigos</p>
                  <p className="text-2xl font-bold">{totalArticles}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Erros</p>
                  <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avisos</p>
                  <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(((totalArticles * 2 - errorCount - warningCount * 0.5) / (totalArticles * 2)) * 100)}%
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="current" className="space-y-4">
          <TabsList>
            <TabsTrigger value="current">Página Atual</TabsTrigger>
            <TabsTrigger value="articles">Artigos do Blog</TabsTrigger>
            <TabsTrigger value="all-metas">Todas Meta Tags</TabsTrigger>
          </TabsList>

          {/* Current Page Analysis */}
          <TabsContent value="current" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Title & Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Title & Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Title</label>
                      <div className="flex items-center gap-2">
                        <StatusIcon status={getTitleStatus(title.length)} />
                        <span className="text-sm text-muted-foreground">
                          {title.length}/{SEO_LIMITS.metaTitle.max}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-sm break-words">
                      {title || <span className="text-muted-foreground italic">Não definido</span>}
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          getTitleStatus(title.length) === 'ok' ? 'bg-green-500' :
                          getTitleStatus(title.length) === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((title.length / SEO_LIMITS.metaTitle.max) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Description</label>
                      <div className="flex items-center gap-2">
                        <StatusIcon status={getDescriptionStatus(description.length)} />
                        <span className="text-sm text-muted-foreground">
                          {description.length}/{SEO_LIMITS.metaDescription.max}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-sm break-words">
                      {description || <span className="text-muted-foreground italic">Não definido</span>}
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          getDescriptionStatus(description.length) === 'ok' ? 'bg-green-500' :
                          getDescriptionStatus(description.length) === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((description.length / SEO_LIMITS.metaDescription.max) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Other */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="text-xs text-muted-foreground">Robots</label>
                      <Badge variant={robots.includes('noindex') ? 'destructive' : 'default'} className="mt-1">
                        {robots || 'index, follow'}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Canonical</label>
                      <p className="text-xs truncate mt-1" title={canonical}>{canonical || 'Não definido'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Previews */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Preview Social
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Facebook/LinkedIn Preview */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-2 bg-muted flex items-center gap-2">
                      <Facebook className="h-4 w-4" />
                      <Linkedin className="h-4 w-4" />
                      <span className="text-xs font-medium">Facebook / LinkedIn</span>
                    </div>
                    <div className="bg-card">
                      {ogImage ? (
                        <img 
                          src={ogImage} 
                          alt="OG Preview" 
                          className="w-full h-40 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-40 bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">Sem imagem OG</span>
                        </div>
                      )}
                      <div className="p-3 space-y-1">
                        <p className="text-xs text-muted-foreground uppercase">{new URL(ogUrl || window.location.href).hostname}</p>
                        <p className="font-semibold text-sm line-clamp-2">{ogTitle}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{ogDescription}</p>
                      </div>
                    </div>
                  </div>

                  {/* Twitter Preview */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-2 bg-muted flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      <span className="text-xs font-medium">Twitter / X</span>
                      <Badge variant="outline" className="ml-auto text-xs">{twitterCard || 'summary'}</Badge>
                    </div>
                    <div className="bg-card flex">
                      {twitterImage ? (
                        <img 
                          src={twitterImage} 
                          alt="Twitter Preview" 
                          className="w-24 h-24 object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 bg-muted flex items-center justify-center flex-shrink-0">
                          <Image className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="p-3 space-y-1 min-w-0">
                        <p className="font-semibold text-sm line-clamp-1">{twitterTitle}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{twitterDescription}</p>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" onClick={copyMetaAsHTML} className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Meta Tags como HTML
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Blog Articles Validation */}
          <TabsContent value="articles">
            <Card>
              <CardHeader>
                <CardTitle>Validação SEO dos Artigos</CardTitle>
                <CardDescription>
                  Análise automática de title e description para todos os {totalArticles} artigos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Artigo</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(validationsByArticle).map(([slug, validations]) => {
                        const titleV = validations.find(v => v.field === 'metaTitle');
                        const descV = validations.find(v => v.field === 'metaDescription');
                        
                        return (
                          <TableRow key={slug}>
                            <TableCell className="font-medium">
                              <span className="line-clamp-1" title={slug}>{slug}</span>
                            </TableCell>
                            <TableCell>
                              {titleV && (
                                <div className="flex items-center gap-2">
                                  <StatusIcon status={titleV.status} />
                                  <span className="text-sm">{titleV.length}</span>
                                  <Badge variant={getStatusBadgeVariant(titleV.status)} className="text-xs">
                                    {titleV.status === 'ok' ? 'OK' : titleV.status === 'warning' ? 'Aviso' : 'Erro'}
                                  </Badge>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {descV && (
                                <div className="flex items-center gap-2">
                                  <StatusIcon status={descV.status} />
                                  <span className="text-sm">{descV.length}</span>
                                  <Badge variant={getStatusBadgeVariant(descV.status)} className="text-xs">
                                    {descV.status === 'ok' ? 'OK' : descV.status === 'warning' ? 'Aviso' : 'Erro'}
                                  </Badge>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate(`/blog/${slug}`)}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Meta Tags */}
          <TabsContent value="all-metas">
            <Card>
              <CardHeader>
                <CardTitle>Todas as Meta Tags</CardTitle>
                <CardDescription>
                  Lista completa de meta tags da página atual ({currentMetas.length} tags)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Atributo</TableHead>
                        <TableHead className="w-[200px]">Nome/Property</TableHead>
                        <TableHead>Conteúdo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentMetas.map((meta, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">
                            {meta.name ? 'name' : 'property'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {meta.name || meta.property}
                          </TableCell>
                          <TableCell className="text-sm break-all">
                            {meta.content}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* SEO Limits Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Referência de Limites SEO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Meta Title</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>🔴 Mínimo: {SEO_LIMITS.metaTitle.min} caracteres</li>
                  <li>🟡 Ideal: {SEO_LIMITS.metaTitle.ideal}+ caracteres</li>
                  <li>🟢 Máximo: {SEO_LIMITS.metaTitle.max} caracteres</li>
                </ul>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Meta Description</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>🔴 Mínimo: {SEO_LIMITS.metaDescription.min} caracteres</li>
                  <li>🟡 Ideal: {SEO_LIMITS.metaDescription.ideal}+ caracteres</li>
                  <li>🟢 Máximo: {SEO_LIMITS.metaDescription.max} caracteres</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebugSEO;
