import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Swords, Coins, Shield, Flame, Zap, Heart, Sparkles } from 'lucide-react';
import { JournalEntry as JournalEntryType } from '@/hooks/useAdventureJournal';
import { IMPACT_COLORS, IMPACT_ICONS, INCOME_ICONS } from '@/lib/narrativeConfig';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';
import { parseDateString } from '@/lib/dateUtils';
import { getCategoryTranslationKey } from '@/lib/gameLogic';

interface JournalEntryProps {
  entry: JournalEntryType;
}

const impactBorders: Record<string, string> = {
  low: 'border-l-emerald-500',
  medium: 'border-l-amber-500',
  high: 'border-l-orange-500',
  critical: 'border-l-red-500',
};

const impactIcons: Record<string, React.ReactNode> = {
  low: <Shield className="w-4 h-4 text-emerald-500" />,
  medium: <Zap className="w-4 h-4 text-amber-500" />,
  high: <Swords className="w-4 h-4 text-orange-500" />,
  critical: <Flame className="w-4 h-4 text-red-500" />,
};

export const JournalEntry = ({ entry }: JournalEntryProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  
  const isIncome = entry.eventType === 'INCOME';
  const formattedDate = format(parseDateString(entry.createdAt), 'MMM d, yyyy • h:mm a');
  
  // Translate category name if it's a default category
  const translationKey = getCategoryTranslationKey(entry.category, entry.eventType as 'INCOME' | 'EXPENSE');
  const displayCategory = translationKey ? t(`transactions.categories.${translationKey}`) : entry.category;
  
  // Get the appropriate icon
  const icon = isIncome 
    ? (INCOME_ICONS[entry.category as keyof typeof INCOME_ICONS] || '💰')
    : IMPACT_ICONS[entry.impact];

  return (
    <div 
      className={cn(
        "relative p-4 rounded-lg border-l-4 bg-card/50 backdrop-blur-sm",
        "hover:bg-card/80 transition-colors",
        isIncome ? 'border-l-emerald-500' : impactBorders[entry.impact]
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label={entry.category}>
            {icon}
          </span>
          <div>
            <span className="text-xs text-muted-foreground capitalize">
              {displayCategory.replace('_', ' ')}
            </span>
            <div className="flex items-center gap-1.5">
              {isIncome ? (
                <Coins className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                impactIcons[entry.impact]
              )}
              <span className={cn(
                "text-sm font-semibold",
                isIncome ? "text-emerald-500" : "text-destructive"
              )}>
                {isIncome ? '+' : '-'}{formatCurrency(entry.amount)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Impact badge for expenses */}
        {!isIncome && (
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full capitalize font-medium",
            entry.impact === 'low' && "bg-emerald-500/20 text-emerald-500",
            entry.impact === 'medium' && "bg-amber-500/20 text-amber-500",
            entry.impact === 'high' && "bg-orange-500/20 text-orange-500",
            entry.impact === 'critical' && "bg-red-500/20 text-red-500"
          )}>
            {entry.impact}
          </span>
        )}
        
        {isIncome && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Treasure
          </span>
        )}
      </div>

      {/* Narrative text */}
      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line mb-3 font-serif italic">
        "{entry.narrative}"
      </p>

      {/* Timestamp */}
      <p className="text-xs text-muted-foreground">
        {formattedDate}
      </p>
    </div>
  );
};
