import { Quest } from '@/types/database';
import { CheckCircle2, Circle, Clock, Award } from 'lucide-react';
import { getTimeUntilReset, QUEST_TYPE_CONFIG, getSeasonalBadgeName, getQuestKey } from '@/lib/gameLogic';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';

// Badge icon mapping for rewards preview
const SEASONAL_BADGE_ICONS: Record<string, { icon: string; name: string }> = {
  'christmas': { icon: '🎄', name: 'Christmas Planner' },
  'halloween': { icon: '🎃', name: 'Pumpkin Saver' },
  'easter': { icon: '🥚', name: 'Golden Egg' },
  'carnival': { icon: '🎭', name: 'Smart Reveler' }
};

interface QuestCardProps {
  quest: Quest;
  showTimer?: boolean;
}

export const QuestCard = ({ quest, showTimer = false }: QuestCardProps) => {
  const { t } = useTranslation();
  const config = QUEST_TYPE_CONFIG[quest.type];
  const progressPercent = quest.progress_target > 0 
    ? (quest.progress_current / quest.progress_target) * 100 
    : 0;
  
  // Achievements always show progress (they're one-time with tracked progression)
  // Missions (DAILY, WEEKLY, MONTHLY) only show progress if target > 1
  const isAchievement = quest.type === 'ACHIEVEMENT';
  const hasProgress = isAchievement || quest.progress_target > 1;
  
  const timeInfo = getTimeUntilReset(quest.period_end_date, quest.type);
  
  // Get badge reward for special quests
  const badgeReward = quest.season ? SEASONAL_BADGE_ICONS[quest.season.toLowerCase()] : null;

  // Get translated quest title and description
  const questKey = getQuestKey(quest.quest_key);
  const translatedTitle = questKey ? t(`quests.items.${questKey}.title`, { defaultValue: quest.title }) : quest.title;
  const translatedDescription = questKey ? t(`quests.items.${questKey}.description`, { defaultValue: quest.description }) : quest.description;

  return (
    <div 
      className={`flex flex-col gap-2 p-4 rounded-xl transition-all border-2 ${
        quest.is_completed 
          ? 'bg-primary/10 border-primary/30 opacity-70' 
          : 'bg-card border-accent/50 hover:border-accent hover:shadow-md hover:shadow-accent/10'
      }`}
    >
      <div className="flex items-start gap-3">
        {quest.is_completed ? (
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
        ) : (
          <Circle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-sm font-medium ${
              quest.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
            }`}>
              {translatedTitle}
            </p>
            {quest.season && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                {quest.season}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{translatedDescription}</p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <span className={`text-sm font-bold ${
            quest.is_completed ? 'text-muted-foreground' : 'text-accent'
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
            <span className="text-xs font-medium text-accent">
              {quest.progress_current}/{quest.progress_target}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-level-progress-bg">
            <div 
              className="h-full bg-gradient-to-r from-accent to-xp-gold-glow rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Badge reward preview for special quests */}
      {badgeReward && !quest.is_completed && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mt-2 ml-8 flex items-center gap-2 p-2 rounded-lg bg-accent/10 border border-accent/30">
                <Award className="w-4 h-4 text-accent" />
                <span className="text-xs text-muted-foreground">Unlocks:</span>
                <span className="text-lg">{badgeReward.icon}</span>
                <span className="text-xs font-medium text-foreground">{badgeReward.name}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">Complete this quest to unlock the <strong>{badgeReward.name}</strong> badge!</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Show unlocked badge for completed special quests */}
      {badgeReward && quest.is_completed && (
        <div className="mt-2 ml-8 flex items-center gap-2 p-2 rounded-lg bg-success/10 border border-success/30">
          <span className="text-lg">{badgeReward.icon}</span>
          <span className="text-xs font-medium text-success">Badge Unlocked!</span>
        </div>
      )}
    </div>
  );
};