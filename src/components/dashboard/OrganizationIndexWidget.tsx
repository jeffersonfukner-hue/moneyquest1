import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategoryGoals } from '@/hooks/useCategoryGoals';
import { useWallets } from '@/hooks/useWallets';
import { useScheduledTransactions } from '@/hooks/useScheduledTransactions';
import { Info, CheckCircle, AlertCircle, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isWithinInterval, subDays } from 'date-fns';

interface OrganizationScore {
  score: number;
  level: 'excellent' | 'good' | 'regular' | 'attention';
  breakdown: {
    categorizedTransactions: { score: number; max: number; percentage: number };
    recordingConsistency: { score: number; max: number; daysWithRecords: number; totalDays: number };
    scheduledReviewed: { score: number; max: number; reviewed: number; total: number };
    budgetsSet: { score: number; max: number; count: number };
  };
  tips: string[];
}

const calculateOrganizationScore = (
  transactions: any[],
  goals: any[],
  wallets: any[],
  scheduledTransactions: any[]
): OrganizationScore => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const tips: string[] = [];
  
  // 1. % de transações categorizadas no período (0-35 pontos)
  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return isWithinInterval(date, { start: monthStart, end: monthEnd });
  });
  
  const categorizedCount = monthTransactions.filter(t => t.category && t.category.trim() !== '').length;
  const categorizedPercentage = monthTransactions.length > 0 
    ? (categorizedCount / monthTransactions.length) * 100 
    : 100;
  const categorizedScore = Math.round((categorizedPercentage / 100) * 35);
  
  if (categorizedPercentage < 90) {
    tips.push('Categorize todas as transações para melhor controle');
  }
  
  // 2. Consistência de registros - dias com lançamentos nos últimos 30 dias (0-30 pontos)
  const last30Days = eachDayOfInterval({ 
    start: subDays(now, 29), 
    end: now 
  });
  
  const daysWithRecords = new Set(
    transactions
      .filter(t => {
        const date = new Date(t.date);
        return isWithinInterval(date, { start: subDays(now, 29), end: now });
      })
      .map(t => format(new Date(t.date), 'yyyy-MM-dd'))
  ).size;
  
  // Objetivo: pelo menos 15 dias com registros em 30 dias (50%+)
  const consistencyRatio = Math.min(daysWithRecords / 15, 1);
  const consistencyScore = Math.round(consistencyRatio * 30);
  
  if (daysWithRecords < 10) {
    tips.push('Registre transações com mais frequência');
  }
  
  // 3. Revisão de lançamentos futuros/agendados (0-20 pontos)
  const activeScheduled = scheduledTransactions.filter(s => s.is_active);
  const reviewedScheduled = activeScheduled.filter(s => {
    // Consider "reviewed" if updated in last 30 days or created recently
    const updatedAt = new Date(s.updated_at || s.created_at);
    return isWithinInterval(updatedAt, { start: subDays(now, 30), end: now });
  });
  
  const scheduledScore = activeScheduled.length > 0 
    ? Math.round((reviewedScheduled.length / activeScheduled.length) * 20)
    : 20; // Full score if no scheduled transactions (nothing to review)
  
  if (activeScheduled.length > 0 && reviewedScheduled.length < activeScheduled.length) {
    tips.push('Revise seus lançamentos agendados periodicamente');
  }
  
  // 4. Metas/orçamentos definidos (0-15 pontos)
  const goalsCount = goals.length;
  // Ideal: at least 3 budget goals
  const goalsScore = Math.min(goalsCount, 3) * 5;
  
  if (goalsCount < 3) {
    tips.push('Defina metas de orçamento para suas principais categorias');
  }
  
  // Total score
  const totalScore = categorizedScore + consistencyScore + scheduledScore + goalsScore;
  
  // Determine level
  let level: OrganizationScore['level'];
  if (totalScore >= 85) level = 'excellent';
  else if (totalScore >= 65) level = 'good';
  else if (totalScore >= 40) level = 'regular';
  else level = 'attention';
  
  return {
    score: totalScore,
    level,
    breakdown: {
      categorizedTransactions: { 
        score: categorizedScore, 
        max: 35, 
        percentage: Math.round(categorizedPercentage) 
      },
      recordingConsistency: { 
        score: consistencyScore, 
        max: 30, 
        daysWithRecords, 
        totalDays: 30 
      },
      scheduledReviewed: { 
        score: scheduledScore, 
        max: 20, 
        reviewed: reviewedScheduled.length, 
        total: activeScheduled.length 
      },
      budgetsSet: { 
        score: goalsScore, 
        max: 15, 
        count: goalsCount 
      },
    },
    tips: tips.slice(0, 3), // Max 3 tips
  };
};

export const OrganizationIndexWidget = () => {
  const { t } = useTranslation();
  const { transactions } = useTransactions();
  const { goals } = useCategoryGoals();
  const { wallets } = useWallets();
  const { scheduledTransactions } = useScheduledTransactions();
  
  const organizationData = useMemo(() => 
    calculateOrganizationScore(transactions, goals, wallets, scheduledTransactions || []),
    [transactions, goals, wallets, scheduledTransactions]
  );
  
  const getLevelConfig = (level: OrganizationScore['level']) => {
    switch (level) {
      case 'excellent':
        return {
          label: t('organizationIndex.levels.excellent', 'Excelente'),
          icon: CheckCircle,
          color: 'text-success',
          bg: 'bg-success/10',
          border: 'border-success/20',
        };
      case 'good':
        return {
          label: t('organizationIndex.levels.good', 'Bom'),
          icon: TrendingUp,
          color: 'text-primary',
          bg: 'bg-primary/10',
          border: 'border-primary/20',
        };
      case 'regular':
        return {
          label: t('organizationIndex.levels.regular', 'Regular'),
          icon: AlertTriangle,
          color: 'text-warning',
          bg: 'bg-warning/10',
          border: 'border-warning/20',
        };
      case 'attention':
        return {
          label: t('organizationIndex.levels.attention', 'Atenção'),
          icon: AlertCircle,
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          border: 'border-destructive/20',
        };
    }
  };
  
  const config = getLevelConfig(organizationData.level);
  const Icon = config.icon;
  
  const { breakdown } = organizationData;
  
  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-2.5 rounded-lg border",
      config.bg,
      config.border
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", config.color)} />
        <span className="text-sm text-muted-foreground">
          {t('organizationIndex.title', 'Índice de Organização')}:
        </span>
        <span className={cn("font-semibold text-sm tabular-nums", config.color)}>
          {organizationData.score}/100
        </span>
        <span className={cn("text-xs px-1.5 py-0.5 rounded", config.bg, config.color)}>
          {config.label}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        {/* Tips popover */}
        {organizationData.tips.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1 hover:bg-muted/50 rounded transition-colors">
                <Lightbulb className="w-4 h-4 text-warning" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="end" className="w-64">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('organizationIndex.tipsTitle', 'Como melhorar:')}
                </p>
                <ul className="space-y-1.5">
                  {organizationData.tips.map((tip, i) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </PopoverContent>
          </Popover>
        )}
        
        {/* Calculation tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1 hover:bg-muted/50 rounded transition-colors">
                <Info className="w-4 h-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="space-y-2 text-xs">
                <p className="font-medium">{t('organizationIndex.tooltip.title', 'Como é calculado:')}</p>
                <ul className="space-y-1.5">
                  <li className="flex justify-between gap-4">
                    <span>{t('organizationIndex.tooltip.categorized', 'Transações categorizadas')}</span>
                    <span className="font-mono text-muted-foreground">
                      {breakdown.categorizedTransactions.score}/{breakdown.categorizedTransactions.max}
                    </span>
                  </li>
                  <li className="text-[10px] text-muted-foreground pl-2">
                    ({breakdown.categorizedTransactions.percentage}% categorizadas)
                  </li>
                  <li className="flex justify-between gap-4">
                    <span>{t('organizationIndex.tooltip.consistency', 'Consistência de registros')}</span>
                    <span className="font-mono text-muted-foreground">
                      {breakdown.recordingConsistency.score}/{breakdown.recordingConsistency.max}
                    </span>
                  </li>
                  <li className="text-[10px] text-muted-foreground pl-2">
                    ({breakdown.recordingConsistency.daysWithRecords} dias em {breakdown.recordingConsistency.totalDays})
                  </li>
                  <li className="flex justify-between gap-4">
                    <span>{t('organizationIndex.tooltip.scheduled', 'Agendados revisados')}</span>
                    <span className="font-mono text-muted-foreground">
                      {breakdown.scheduledReviewed.score}/{breakdown.scheduledReviewed.max}
                    </span>
                  </li>
                  {breakdown.scheduledReviewed.total > 0 && (
                    <li className="text-[10px] text-muted-foreground pl-2">
                      ({breakdown.scheduledReviewed.reviewed}/{breakdown.scheduledReviewed.total} revisados)
                    </li>
                  )}
                  <li className="flex justify-between gap-4">
                    <span>{t('organizationIndex.tooltip.budgets', 'Orçamentos definidos')}</span>
                    <span className="font-mono text-muted-foreground">
                      {breakdown.budgetsSet.score}/{breakdown.budgetsSet.max}
                    </span>
                  </li>
                  <li className="text-[10px] text-muted-foreground pl-2">
                    ({breakdown.budgetsSet.count} {breakdown.budgetsSet.count === 1 ? 'meta' : 'metas'})
                  </li>
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
