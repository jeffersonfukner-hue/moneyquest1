import { useEffect, useState } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { getTimeUntilReset } from '@/lib/gameLogic';
import { QuestType } from '@/types/database';
import { cn } from '@/lib/utils';

interface QuestTimerProps {
  periodEndDate: string | null;
  questType: QuestType;
  label?: string;
}

export const QuestTimer = ({ periodEndDate, questType, label }: QuestTimerProps) => {
  const [timeInfo, setTimeInfo] = useState(getTimeUntilReset(periodEndDate, questType));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeInfo(getTimeUntilReset(periodEndDate, questType));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [periodEndDate, questType]);

  if (!periodEndDate) return null;

  // Don't show timer if expired
  if (timeInfo.isExpired) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>{timeInfo.displayText}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs text-muted-foreground",
      timeInfo.hours === 0 && timeInfo.days === 0 && "text-warning"
    )}>
      <Clock className="w-3.5 h-3.5" />
      <span>
        {label && `${label} `}
        Resets in {timeInfo.displayText}
      </span>
    </div>
  );
};