import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const LABELS = {
  title: 'Análise de Fraude (IA)',
  description: 'Identifique padrões de abuso e priorize revisões de indicações suspeitas',
  critical: 'crítico',
  pending: 'pendente',
  noAlerts: 'Nenhum alerta de fraude no momento',
  systemWorking: 'O sistema está monitorando e registrando eventos automaticamente.',
  by: 'por',
  reviewed: 'Revisado',
  review: 'Marcar como revisado',
  more: 'mais',
  sections: {
    fingerprint: 'Análise de Fingerprint',
    transaction: 'Padrões de Transações',
    timing: 'Análise de Tempo',
    allFactors: 'Fatores de Risco',
  },
  fields: {
    count: 'Quantidade',
    avgInterval: 'Intervalo médio',
    roundPercent: 'Valores redondos',
    sameHourPercent: 'Mesmo horário',
    accountAge: 'Idade da conta',
    timeToComplete: 'Tempo até completar',
  },
  yes: 'Sim',
  no: 'Não',
  toasts: {
    markError: 'Erro ao marcar como revisado',
    marked: 'Marcado como revisado',
  },
  risk: {
    low: 'Baixo',
    medium: 'Médio',
    high: 'Alto',
    critical: 'Crítico',
  },
  reasons: {
    same_device_fingerprint: 'Mesmo fingerprint',
    same_ip_within_24h: 'Mesmo IP (24h)',
    similar_user_agent: 'User-Agent semelhante',
    fast_completion: 'Conclusão muito rápida',
    round_amounts: 'Valores muito redondos',
    same_hour_pattern: 'Padrão de horário repetido',
    high_referrer_rate: 'Alta taxa de suspeitas do indicador',
  } as Record<string, string>,
};

interface FraudAnalysis {
  id: string;
  referral_id: string;
  referrer_id: string;
  referrer_name: string;
  referred_id: string;
  referred_name: string;
  risk_score: number;
  risk_level: string;
  reasons: string[];
  analysis_details: {
    fingerprint_analysis: {
      same_fingerprint: boolean;
      same_ip: boolean;
      same_timezone: boolean;
      same_resolution: boolean;
      similar_user_agent: boolean;
    };
    transaction_analysis: {
      count: number;
      avg_interval_seconds: number;
      round_amounts_ratio: number;
      same_hour_ratio: number;
      descriptions_similarity: number;
    };
    timing_analysis: {
      account_age_hours: number;
      time_to_complete_hours: number;
    };
    referrer_analysis: {
      total_referrals: number;
      suspicious_rate: number;
    };
  };
  created_at: string;
  reviewed_at: string | null;
  referral_status: string;
}

export const FraudAnalysisWidget = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const riskLevelConfig = {
    low: { icon: Shield, color: 'text-green-500', bg: 'bg-green-500/10', label: LABELS.risk.low },
    medium: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: LABELS.risk.medium },
    high: { icon: ShieldAlert, color: 'text-orange-500', bg: 'bg-orange-500/10', label: LABELS.risk.high },
    critical: { icon: ShieldX, color: 'text-red-500', bg: 'bg-red-500/10', label: LABELS.risk.critical },
  };

  const getReasonLabel = (reason: string): string => {
    if (LABELS.reasons[reason]) return LABELS.reasons[reason];
    return reason.replace(/_/g, ' ');
  };

  const { data: analyses, isLoading, refetch } = useQuery({
    queryKey: ['fraud-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_fraud_analysis');
      if (error) throw error;
      return (data as FraudAnalysis[]) || [];
    },
  });

  const handleMarkReviewed = async (analysisId: string) => {
    const { error } = await supabase.rpc('admin_mark_fraud_reviewed', { p_analysis_id: analysisId });
    if (error) {
      toast.error(LABELS.toasts.markError);
      return;
    }
    toast.success(LABELS.toasts.marked);
    refetch();
  };

  const pendingCount = analyses?.filter((a) => !a.reviewed_at).length || 0;
  const criticalCount = analyses?.filter((a) => a.risk_level === 'critical' && !a.reviewed_at).length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-orange-500" />
            {LABELS.title}
          </CardTitle>
          <CardDescription>{LABELS.description}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {criticalCount} {LABELS.critical}
            </Badge>
          )}
          {pendingCount > 0 && (
            <Badge variant="outline">
              {pendingCount} {LABELS.pending}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!analyses || analyses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{LABELS.noAlerts}</p>
            <p className="text-sm">{LABELS.systemWorking}</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {analyses.map((analysis) => {
                const config =
                  riskLevelConfig[analysis.risk_level as keyof typeof riskLevelConfig] || riskLevelConfig.low;
                const RiskIcon = config.icon;
                const isExpanded = expandedId === analysis.id;

                return (
                  <div
                    key={analysis.id}
                    className={cn('border rounded-lg p-4 transition-all', analysis.reviewed_at ? 'opacity-60' : '', config.bg)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn('p-2 rounded-full', config.bg)}>
                          <RiskIcon className={cn('h-5 w-5', config.color)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{analysis.referred_name}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-sm text-muted-foreground">
                              {LABELS.by} {analysis.referrer_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={cn('text-xs', config.color)}>
                              Score: {analysis.risk_score}/100
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {analysis.referral_status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {config.label}
                            </Badge>
                            {analysis.reviewed_at && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {LABELS.reviewed}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setExpandedId(isExpanded ? null : analysis.id)}>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        {!analysis.reviewed_at && (
                          <Button variant="outline" size="sm" onClick={() => handleMarkReviewed(analysis.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            {LABELS.review}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {analysis.reasons.slice(0, 3).map((reason, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {getReasonLabel(reason)}
                        </Badge>
                      ))}
                      {analysis.reasons.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{analysis.reasons.length - 3} {LABELS.more}
                        </Badge>
                      )}
                    </div>

                    {isExpanded && analysis.analysis_details && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">{LABELS.sections.fingerprint}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                            {Object.entries(analysis.analysis_details.fingerprint_analysis || {}).map(([key, value]) => (
                              <div
                                key={key}
                                className={cn(
                                  'p-2 rounded border text-center',
                                  value ? 'border-red-500/50 bg-red-500/10' : 'border-green-500/50 bg-green-500/10'
                                )}
                              >
                                <div className="font-medium">{key.replace(/_/g, ' ')}</div>
                                <div>{value ? `⚠️ ${LABELS.yes}` : `✅ ${LABELS.no}`}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">{LABELS.sections.transaction}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div className="p-2 rounded border">
                              <div className="text-muted-foreground">{LABELS.fields.count}</div>
                              <div className="font-medium">{analysis.analysis_details.transaction_analysis?.count || 0}</div>
                            </div>
                            <div className="p-2 rounded border">
                              <div className="text-muted-foreground">{LABELS.fields.avgInterval}</div>
                              <div className="font-medium">
                                {Math.round(analysis.analysis_details.transaction_analysis?.avg_interval_seconds || 0)}s
                              </div>
                            </div>
                            <div className="p-2 rounded border">
                              <div className="text-muted-foreground">{LABELS.fields.roundPercent}</div>
                              <div className="font-medium">
                                {Math.round((analysis.analysis_details.transaction_analysis?.round_amounts_ratio || 0) * 100)}%
                              </div>
                            </div>
                            <div className="p-2 rounded border">
                              <div className="text-muted-foreground">{LABELS.fields.sameHourPercent}</div>
                              <div className="font-medium">
                                {Math.round((analysis.analysis_details.transaction_analysis?.same_hour_ratio || 0) * 100)}%
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">{LABELS.sections.timing}</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded border">
                              <div className="text-muted-foreground">{LABELS.fields.accountAge}</div>
                              <div className="font-medium">
                                {Math.round(analysis.analysis_details.timing_analysis?.account_age_hours || 0)}h
                              </div>
                            </div>
                            <div className="p-2 rounded border">
                              <div className="text-muted-foreground">{LABELS.fields.timeToComplete}</div>
                              <div className="font-medium">
                                {Math.round(analysis.analysis_details.timing_analysis?.time_to_complete_hours || 0)}h
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">{LABELS.sections.allFactors}</h4>
                          <div className="flex flex-wrap gap-1">
                            {analysis.reasons.map((reason, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {getReasonLabel(reason)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
