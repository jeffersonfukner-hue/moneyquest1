import { useTranslation } from 'react-i18next';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategoryGoals } from '@/hooks/useCategoryGoals';
import { useWallets } from '@/hooks/useWallets';
import { Info, CheckCircle, AlertCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { startOfWeek, isAfter } from 'date-fns';

interface OrganizationScore {
  score: number;
  level: 'excellent' | 'good' | 'regular' | 'attention';
  breakdown: {
    recentTransactions: number;
    hasGoals: number;
    walletsUpdated: number;
    noAlerts: number;
    categoriesUsed: number;
  };
}

const calculateOrganizationScore = (
  transactions: any[],
  goals: any[],
  wallets: any[],
  hasAlerts: boolean
): OrganizationScore => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  
  // 1. Registros nos últimos 7 dias: +30 pontos
  const recentTransactions = transactions.filter(t => 
    isAfter(new Date(t.created_at), weekStart)
  ).length;
  const recentScore = recentTransactions > 0 ? 30 : 0;
  
  // 2. Pelo menos 1 meta de categoria definida: +20 pontos
  const hasGoalsScore = goals.length > 0 ? 20 : 0;
  
  // 3. Todas as carteiras com saldo (ativo): +20 pontos
  const activeWallets = wallets.filter(w => w.is_active);
  const walletsScore = activeWallets.length > 0 ? 20 : 0;
  
  // 4. Nenhum alerta financeiro ativo: +15 pontos
  const alertsScore = !hasAlerts ? 15 : 0;
  
  // 5. Pelo menos 3 categorias usadas no mês: +15 pontos
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const uniqueCategories = new Set(monthTransactions.map(t => t.category));
  const categoriesScore = uniqueCategories.size >= 3 ? 15 : 0;
  
  const totalScore = recentScore + hasGoalsScore + walletsScore + alertsScore + categoriesScore;
  
  let level: OrganizationScore['level'];
  if (totalScore >= 85) level = 'excellent';
  else if (totalScore >= 60) level = 'good';
  else if (totalScore >= 35) level = 'regular';
  else level = 'attention';
  
  return {
    score: totalScore,
    level,
    breakdown: {
      recentTransactions: recentScore,
      hasGoals: hasGoalsScore,
      walletsUpdated: walletsScore,
      noAlerts: alertsScore,
      categoriesUsed: categoriesScore,
    },
  };
};

export const OrganizationIndexWidget = () => {
  const { t } = useTranslation();
  const { transactions } = useTransactions();
  const { goals } = useCategoryGoals();
  const { wallets } = useWallets();
  
  // For the alerts score, we'll check if there are categories over budget
  const hasAlerts = false; // Simplified - could integrate with FinancialAlertsWidget
  const organizationData = calculateOrganizationScore(transactions, goals, wallets, hasAlerts);
  
  const getLevelConfig = (level: OrganizationScore['level']) => {
    switch (level) {
      case 'excellent':
        return {
          label: t('organizationIndex.levels.excellent', 'Excelente'),
          icon: CheckCircle,
          color: 'text-success',
          bg: 'bg-success/10',
        };
      case 'good':
        return {
          label: t('organizationIndex.levels.good', 'Bom'),
          icon: TrendingUp,
          color: 'text-primary',
          bg: 'bg-primary/10',
        };
      case 'regular':
        return {
          label: t('organizationIndex.levels.regular', 'Regular'),
          icon: AlertTriangle,
          color: 'text-warning',
          bg: 'bg-warning/10',
        };
      case 'attention':
        return {
          label: t('organizationIndex.levels.attention', 'Atenção'),
          icon: AlertCircle,
          color: 'text-destructive',
          bg: 'bg-destructive/10',
        };
    }
  };
  
  const config = getLevelConfig(organizationData.level);
  const Icon = config.icon;
  
  const tooltipContent = (
    <div className="space-y-2 text-xs">
      <p className="font-medium">{t('organizationIndex.tooltip.title', 'Critérios de avaliação:')}</p>
      <ul className="space-y-1">
        <li className="flex justify-between gap-4">
          <span>{t('organizationIndex.tooltip.recentRecords', 'Registros recentes (7 dias)')}</span>
          <span className="font-mono">{organizationData.breakdown.recentTransactions}/30</span>
        </li>
        <li className="flex justify-between gap-4">
          <span>{t('organizationIndex.tooltip.hasGoals', 'Meta de categoria definida')}</span>
          <span className="font-mono">{organizationData.breakdown.hasGoals}/20</span>
        </li>
        <li className="flex justify-between gap-4">
          <span>{t('organizationIndex.tooltip.walletsActive', 'Carteiras ativas')}</span>
          <span className="font-mono">{organizationData.breakdown.walletsUpdated}/20</span>
        </li>
        <li className="flex justify-between gap-4">
          <span>{t('organizationIndex.tooltip.noAlerts', 'Sem alertas financeiros')}</span>
          <span className="font-mono">{organizationData.breakdown.noAlerts}/15</span>
        </li>
        <li className="flex justify-between gap-4">
          <span>{t('organizationIndex.tooltip.categoriesUsed', 'Categorias diversificadas')}</span>
          <span className="font-mono">{organizationData.breakdown.categoriesUsed}/15</span>
        </li>
      </ul>
    </div>
  );
  
  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-2.5 rounded-lg border",
      config.bg,
      "border-border/50"
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", config.color)} />
        <span className="text-sm text-muted-foreground">
          {t('organizationIndex.title', 'Índice de Organização Financeira')}:
        </span>
        <span className={cn("font-semibold text-sm", config.color)}>
          {organizationData.score}/100 • {config.label}
        </span>
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-1 hover:bg-muted/50 rounded">
              <Info className="w-4 h-4 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
