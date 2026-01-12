/**
 * SEO Audit Panel - Debug Component
 * 
 * Shows comprehensive SEO audit results for development.
 * Only visible in development mode.
 */

import { useState, useEffect } from 'react';
import { useSEOAudit } from '@/hooks/useSEOAudit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  FileSearch,
  Link2,
  Globe,
  Map,
  Layers,
  Smartphone
} from 'lucide-react';
import type { SEOAuditReport, AuditResult, AuditSeverity } from '@/lib/seoAudit';

const severityConfig: Record<AuditSeverity, { icon: React.ReactNode; color: string; bgColor: string }> = {
  success: { 
    icon: <CheckCircle2 className="h-4 w-4" />, 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  warning: { 
    icon: <AlertTriangle className="h-4 w-4" />, 
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  error: { 
    icon: <XCircle className="h-4 w-4" />, 
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30'
  },
  info: { 
    icon: <FileSearch className="h-4 w-4" />, 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  }
};

const categoryConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  canonical: { icon: <Link2 className="h-4 w-4" />, label: 'Canonical' },
  indexation: { icon: <Globe className="h-4 w-4" />, label: 'Indexação' },
  sitemap: { icon: <Map className="h-4 w-4" />, label: 'Sitemap' },
  hierarchy: { icon: <Layers className="h-4 w-4" />, label: 'Hierarquia' },
  linking: { icon: <Link2 className="h-4 w-4" />, label: 'Links' },
  pwa: { icon: <Smartphone className="h-4 w-4" />, label: 'PWA' }
};

interface AuditResultItemProps {
  result: AuditResult;
}

const AuditResultItem = ({ result }: AuditResultItemProps) => {
  const config = severityConfig[result.severity];
  const category = categoryConfig[result.category];

  return (
    <div className={`p-3 rounded-lg ${config.bgColor} border border-border/50`}>
      <div className="flex items-start gap-2">
        <span className={config.color}>{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {category.icon}
              <span className="ml-1">{category.label}</span>
            </Badge>
            <code className="text-xs text-muted-foreground truncate">{result.url}</code>
          </div>
          <p className="mt-1 text-sm font-medium">{result.message}</p>
          {result.suggestion && (
            <p className="mt-1 text-xs text-muted-foreground">
              💡 {result.suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface CategorySummaryProps {
  category: string;
  passed: number;
  failed: number;
}

const CategorySummary = ({ category, passed, failed }: CategorySummaryProps) => {
  const config = categoryConfig[category];
  const total = passed + failed;
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 100;
  
  return (
    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
      <div className="flex items-center gap-2">
        {config.icon}
        <span className="text-sm font-medium">{config.label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full ${percentage === 100 ? 'bg-green-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground w-12 text-right">
          {passed}/{total}
        </span>
      </div>
    </div>
  );
};

export const SEOAuditPanel = () => {
  const [report, setReport] = useState<SEOAuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { runFullAudit } = useSEOAudit();

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleRunAudit = async () => {
    setIsLoading(true);
    try {
      const result = await runFullAudit();
      setReport(result);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    handleRunAudit();
  }, []);

  const errors = report?.results.filter(r => r.severity === 'error') || [];
  const warnings = report?.results.filter(r => r.severity === 'warning') || [];
  const passed = report?.results.filter(r => r.severity === 'success') || [];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">Auditoria SEO</CardTitle>
        </div>
        <Button 
          onClick={handleRunAudit} 
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Auditando...' : 'Executar'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {report && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{report.totalChecks}</div>
                <div className="text-xs text-muted-foreground">Verificações</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-100 dark:bg-green-900/30">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{report.passed}</div>
                <div className="text-xs text-muted-foreground">Aprovados</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{report.warnings}</div>
                <div className="text-xs text-muted-foreground">Alertas</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-100 dark:bg-red-900/30">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{report.errors}</div>
                <div className="text-xs text-muted-foreground">Erros</div>
              </div>
            </div>

            {/* Category Summary */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Por Categoria</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(report.summary).map(([category, counts]) => (
                  <CategorySummary key={category} category={category} {...counts} />
                ))}
              </div>
            </div>

            {/* Results Accordion */}
            <Accordion type="multiple" className="w-full">
              {errors.length > 0 && (
                <AccordionItem value="errors">
                  <AccordionTrigger className="text-red-600 dark:text-red-400">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      <span>Erros Críticos ({errors.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="max-h-80">
                      <div className="space-y-2 pr-4">
                        {errors.map(result => (
                          <AuditResultItem key={result.id} result={result} />
                        ))}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              )}

              {warnings.length > 0 && (
                <AccordionItem value="warnings">
                  <AccordionTrigger className="text-yellow-600 dark:text-yellow-400">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Alertas ({warnings.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="max-h-80">
                      <div className="space-y-2 pr-4">
                        {warnings.map(result => (
                          <AuditResultItem key={result.id} result={result} />
                        ))}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              )}

              {passed.length > 0 && (
                <AccordionItem value="passed">
                  <AccordionTrigger className="text-green-600 dark:text-green-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Aprovados ({passed.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="max-h-80">
                      <div className="space-y-2 pr-4">
                        {passed.map(result => (
                          <AuditResultItem key={result.id} result={result} />
                        ))}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* Timestamp */}
            <p className="text-xs text-muted-foreground text-center">
              Última auditoria: {new Date(report.timestamp).toLocaleString('pt-BR')}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SEOAuditPanel;
