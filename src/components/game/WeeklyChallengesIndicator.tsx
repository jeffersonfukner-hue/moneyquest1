import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Sparkles, RefreshCw } from 'lucide-react';
import { differenceInDays, differenceInHours, differenceInMinutes, nextSunday, startOfWeek, format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface WeeklyChallengesIndicatorProps {
  questCount: number;
  completedCount: number;
}

export const WeeklyChallengesIndicator = ({ 
  questCount, 
  completedCount 
}: WeeklyChallengesIndicatorProps) => {
  const { t, i18n } = useTranslation();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  // Calculate time until next Sunday (week reset)
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const nextWeekStart = nextSunday(now);
      nextWeekStart.setHours(0, 0, 0, 0);

      const days = differenceInDays(nextWeekStart, now);
      const hours = differenceInHours(nextWeekStart, now) % 24;
      const minutes = differenceInMinutes(nextWeekStart, now) % 60;

      setTimeLeft({ days, hours, minutes });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const locale = i18n.language.startsWith('pt') ? ptBR : enUS;
  const allCompleted = completedCount >= questCount && questCount > 0;
  const progress = questCount > 0 ? (completedCount / questCount) * 100 : 0;

  // Get current week number for display
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekLabel = format(weekStart, "d 'de' MMM", { locale });

  return (
    <div className={cn(
      "rounded-xl p-3 border transition-all",
      allCompleted 
        ? "bg-gradient-to-r from-income/10 via-income/5 to-income/10 border-income/30" 
        : "bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/30"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            allCompleted 
              ? "bg-income/20" 
              : "bg-primary/20"
          )}>
            <Sparkles className={cn(
              "w-4 h-4",
              allCompleted ? "text-income" : "text-primary"
            )} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              {t('quests.weeklyChallenges', 'Desafios da Semana')}
            </h4>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {t('quests.weekOf', 'Semana de')} {weekLabel}
            </p>
          </div>
        </div>
        
        {/* Completion badge */}
        <div className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          allCompleted 
            ? "bg-income/20 text-income" 
            : "bg-muted text-muted-foreground"
        )}>
          {completedCount}/{questCount}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            allCompleted 
              ? "bg-gradient-to-r from-income to-income/80" 
              : "bg-gradient-to-r from-primary to-primary/80"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Renewal countdown */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3" />
          <span>{t('quests.renewsIn', 'Renova em')}:</span>
        </div>
        
        <div className="flex items-center gap-1">
          {timeLeft.days > 0 && (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-background/80 rounded text-xs">
              <Clock className="w-3 h-3 text-primary" />
              <span className="font-mono font-medium">{timeLeft.days}</span>
              <span className="text-muted-foreground text-[10px]">d</span>
            </div>
          )}
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-background/80 rounded text-xs">
            <span className="font-mono font-medium">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-muted-foreground text-[10px]">h</span>
          </div>
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-background/80 rounded text-xs">
            <span className="font-mono font-medium">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-muted-foreground text-[10px]">m</span>
          </div>
        </div>
      </div>

      {/* Motivational message */}
      {allCompleted ? (
        <p className="text-[10px] text-income mt-2 text-center">
          ✨ {t('quests.weeklyComplete', 'Todos os desafios concluídos! Aguarde os novos!')}
        </p>
      ) : completedCount > 0 ? (
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          🔥 {t('quests.keepGoing', 'Continue assim! Faltam {{count}} desafios.', { count: questCount - completedCount })}
        </p>
      ) : null}
    </div>
  );
};
