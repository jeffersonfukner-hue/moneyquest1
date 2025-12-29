import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { getTimeUntilReset } from '@/lib/gameLogic';
import { QuestType } from '@/types/database';

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

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Clock className="w-3.5 h-3.5" />
      <span>
        {label && `${label} `}
        Resets in {timeInfo.displayText}
      </span>
    </div>
  );
};