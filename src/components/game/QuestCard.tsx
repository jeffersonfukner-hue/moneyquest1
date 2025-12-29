import { Quest } from '@/types/database';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getTimeUntilReset, QUEST_TYPE_CONFIG } from '@/lib/gameLogic';

interface QuestCardProps {
  quest: Quest;
  showTimer?: boolean;
}

export const QuestCard = ({ quest, showTimer = false }: QuestCardProps) => {
  const config = QUEST_TYPE_CONFIG[quest.type];
  const progressPercent = quest.progress_target > 0 
    ? (quest.progress_current / quest.progress_target) * 100 
    : 0;
  const hasProgress = quest.progress_target > 1;
  const timeInfo = getTimeUntilReset(quest.period_end_date, quest.type);

  return (
    <div 
      className={`flex flex-col gap-2 p-4 rounded-xl transition-all ${
        quest.is_completed 
          ? 'bg-primary/10 opacity-70' 
          : 'bg-muted/50 hover:bg-muted'
      }`}
    >
      <div className="flex items-start gap-3">
        {quest.is_completed ? (
          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-sm font-medium ${
              quest.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
            }`}>
              {quest.title}
            </p>
            {quest.season && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                {quest.season}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{quest.description}</p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <span className={`text-sm font-bold ${
            quest.is_completed ? 'text-muted-foreground' : 'text-xp'
          }`}>
            +{quest.xp_reward} XP
          </span>
          {showTimer && !quest.is_completed && quest.period_end_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{timeInfo.displayText}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar for multi-step quests */}
      {hasProgress && !quest.is_completed && (
        <div className="mt-2 ml-8">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-medium text-foreground">
              {quest.progress_current}/{quest.progress_target}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}
    </div>
  );
};