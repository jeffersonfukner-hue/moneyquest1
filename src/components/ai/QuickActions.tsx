import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { TrendingDown, Lightbulb, CalendarCheck, Target, Sparkles } from 'lucide-react';

type RequestType = 'spending_analysis' | 'savings_tip' | 'monthly_summary' | 'goal_coaching' | 'quick_insight';

interface QuickActionsProps {
  onAction: (type: RequestType) => void;
  disabled?: boolean;
}

export const QuickActions = ({ onAction, disabled }: QuickActionsProps) => {
  const { t } = useTranslation();

  const actions: { type: RequestType; icon: React.ReactNode; labelKey: string }[] = [
    { type: 'spending_analysis', icon: <TrendingDown className="h-4 w-4" />, labelKey: 'aiCoach.actions.spendingAnalysis' },
    { type: 'savings_tip', icon: <Lightbulb className="h-4 w-4" />, labelKey: 'aiCoach.actions.savingsTip' },
    { type: 'monthly_summary', icon: <CalendarCheck className="h-4 w-4" />, labelKey: 'aiCoach.actions.monthlySummary' },
    { type: 'goal_coaching', icon: <Target className="h-4 w-4" />, labelKey: 'aiCoach.actions.goalCoaching' },
    { type: 'quick_insight', icon: <Sparkles className="h-4 w-4" />, labelKey: 'aiCoach.actions.quickInsight' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ type, icon, labelKey }) => (
        <Button
          key={type}
          variant="outline"
          size="sm"
          onClick={() => onAction(type)}
          disabled={disabled}
          className="flex items-center gap-2 text-xs"
        >
          {icon}
          {t(labelKey)}
        </Button>
      ))}
    </div>
  );
};
