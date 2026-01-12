/**
 * ============================================================
 * MONEYQUEST INTELLIGENT SEO PANEL
 * ============================================================
 * 
 * Debug panel for viewing:
 * - SEO Scores per article
 * - Orphan article detection
 * - Content suggestions
 * - Interlinking analysis
 */

import React, { useState } from 'react';
import { useIntelligentSEO } from '@/hooks/useIntelligentSEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  Link2, 
  Lightbulb,
  Trophy,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { 
  getClassificationEmoji, 
  getClassificationColor, 
  getClassificationBgColor 
} from '@/lib/seoScoring';
import { 
  getOrphanSeverityEmoji, 
  getOrphanSeverityColor 
} from '@/lib/seoOrphanDetection';
import { 
  getClusterStatusEmoji, 
  getPriorityColor 
} from '@/lib/seoContentSuggestions';

export const IntelligentSEOPanel: React.FC = () => {
  const {
    isLoading,
    error,
    timestamp,
    articleScores,
    averageScore,
    excellentCount,
    goodCount,
    attentionCount,
    criticalCount,
    orphanReport,
    contentGaps,
    overallHealth,
    refresh,
  } = useIntelligentSEO();

  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Analyzing SEO...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-6">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={refresh} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'attention': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🧠 Sistema SEO Inteligente
          </h2>
          <p className="text-sm text-muted-foreground">
            Última análise: {new Date(timestamp).toLocaleString('pt-BR')}
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Overall Health Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Saúde Geral do SEO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Score Médio</span>
                <span className="text-2xl font-bold">{averageScore}/100</span>
              </div>
              <Progress value={averageScore} className="h-3" />
            </div>
            <Badge className={`text-lg py-2 px-4 ${getHealthColor(overallHealth)}`}>
              {overallHealth === 'excellent' && '🏆 Excelente'}
              {overallHealth === 'good' && '✅ Bom'}
              {overallHealth === 'attention' && '⚠️ Atenção'}
              {overallHealth === 'critical' && '❌ Crítico'}
            </Badge>
          </div>

          {/* Distribution */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="text-2xl font-bold text-green-600">{excellentCount}</div>
              <div className="text-xs text-muted-foreground">Excelente</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="text-2xl font-bold text-blue-600">{goodCount}</div>
              <div className="text-xs text-muted-foreground">Bom</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <div className="text-2xl font-bold text-yellow-600">{attentionCount}</div>
              <div className="text-xs text-muted-foreground">Atenção</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
              <div className="text-xs text-muted-foreground">Crítico</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scores" className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            Scores
          </TabsTrigger>
          <TabsTrigger value="orphans" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Órfãos
            {orphanReport && orphanReport.orphanCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {orphanReport.orphanCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="interlinking" className="flex items-center gap-1">
            <Link2 className="h-4 w-4" />
            Links
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-1">
            <Lightbulb className="h-4 w-4" />
            Sugestões
          </TabsTrigger>
        </TabsList>

        {/* Scores Tab */}
        <TabsContent value="scores">
          <Card>
            <CardHeader>
              <CardTitle>SEO Score por Artigo</CardTitle>
              <CardDescription>
                Ordenado por score (menor primeiro para priorização)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artigo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sugestões</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articleScores.map((article) => (
                      <TableRow key={article.slug}>
                        <TableCell className="max-w-[200px]">
                          <div className="font-medium truncate">{article.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            /blog/{article.slug}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {article.articleType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-bold ${getClassificationColor(article.score.classification)}`}>
                            {article.score.total}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getClassificationBgColor(article.score.classification)}>
                            {getClassificationEmoji(article.score.classification)} {article.score.classification}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {article.score.suggestions.length > 0 ? (
                            <span className="text-xs text-muted-foreground">
                              {article.score.suggestions[0]}
                            </span>
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orphans Tab */}
        <TabsContent value="orphans">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Artigos Órfãos</span>
                {orphanReport && (
                  <Badge variant={orphanReport.orphanCount === 0 ? 'default' : 'destructive'}>
                    {orphanReport.orphanCount} detectados
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Artigos sem links internos recebidos ou que não linkam para outros
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orphanReport && orphanReport.orphanCount === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-lg font-medium">Nenhum artigo órfão!</p>
                  <p className="text-sm text-muted-foreground">
                    Todos os artigos estão bem conectados.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {orphanReport?.orphans.map((orphan) => (
                      <div
                        key={orphan.slug}
                        className={`p-4 rounded-lg border ${
                          orphan.severity === 'critical' 
                            ? 'border-red-200 bg-red-50 dark:bg-red-900/20' 
                            : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {getOrphanSeverityEmoji(orphan.severity)}
                              {orphan.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              /blog/{orphan.slug}
                            </div>
                          </div>
                          <Badge className={orphan.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                            {orphan.severity === 'critical' ? 'Crítico' : 'Alerta'}
                          </Badge>
                        </div>
                        <div className="mt-3 space-y-1">
                          {orphan.reasons.map((reason, i) => (
                            <div key={i} className="text-sm flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                        {orphan.suggestions.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-sm font-medium mb-1">💡 Sugestões:</div>
                            {orphan.suggestions.map((sug, i) => (
                              <div key={i} className="text-sm text-muted-foreground">
                                • {sug}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interlinking Tab */}
        <TabsContent value="interlinking">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Interlinking</CardTitle>
              <CardDescription>
                Verificação de links internos por tipo de artigo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artigo</TableHead>
                      <TableHead className="text-center">Link Pilar</TableHead>
                      <TableHead className="text-center">Links Satélite</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articleScores.map((article) => (
                      <TableRow key={article.slug}>
                        <TableCell className="max-w-[200px]">
                          <div className="font-medium truncate">{article.title}</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {article.articleType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {article.interlinking.hasPillarLink || article.articleType === 'pillar' ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {article.interlinking.hasSatelliteLinks ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-500 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-bold ${
                            article.interlinking.score >= 80 ? 'text-green-600' :
                            article.interlinking.score >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {article.interlinking.score}%
                          </span>
                        </TableCell>
                        <TableCell>
                          {article.interlinking.suggestions.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {article.interlinking.suggestions.length} sugestão(ões)
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Cluster Health */}
            <Card>
              <CardHeader>
                <CardTitle>Saúde dos Clusters</CardTitle>
                <CardDescription>
                  Status de cada categoria de conteúdo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contentGaps?.clusterHealth && (
                  <div className="space-y-3">
                    {Object.entries(contentGaps.clusterHealth).map(([category, health]) => (
                      <div key={category} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <div className="font-medium capitalize">
                            {category.replace(/-/g, ' ')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {health.satellites} satélites, {health.longtails} long-tails
                          </div>
                        </div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getClusterStatusEmoji(health.status)}
                          {health.status === 'complete' ? 'Completo' :
                           health.status === 'developing' ? 'Desenvolvendo' : 'Fraco'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle>Sugestões de Conteúdo</CardTitle>
                <CardDescription>
                  Artigos sugeridos para fortalecer clusters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {contentGaps?.suggestions.slice(0, 10).map((suggestion, i) => (
                      <div key={i} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {suggestion.articleType}
                          </Badge>
                          <Badge className={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority === 'high' ? 'Alta' :
                             suggestion.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        </div>
                        <div className="font-medium text-sm">
                          🔑 {suggestion.keyword}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Pai: {suggestion.parentTitle}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Categoria: {suggestion.category}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntelligentSEOPanel;
