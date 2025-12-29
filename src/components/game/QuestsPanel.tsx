import { Quest } from '@/types/database';
import { CheckCircle2, Circle, Sparkles, Target } from 'lucide-react';

interface QuestsPanelProps {
  quests: Quest[];
}

export const QuestsPanel = ({ quests }: QuestsPanelProps) => {
  const dailyQuests = quests.filter(q => q.type === 'DAILY');
  const achievementQuests = quests.filter(q => q.type === 'ACHIEVEMENT');

  return (
    <div className="bg-card rounded-2xl p-6 shadow-md animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-quest rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-primary-foreground" />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground">Quests</h3>
      </div>

      {dailyQuests.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Daily
          </h4>
          <div className="space-y-2">
            {dailyQuests.map(quest => (
              <QuestItem key={quest.id} quest={quest} />
            ))}
          </div>
        </div>
      )}

      {achievementQuests.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Target className="w-3 h-3" /> Achievements
          </h4>
          <div className="space-y-2">
            {achievementQuests.map(quest => (
              <QuestItem key={quest.id} quest={quest} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const QuestItem = ({ quest }: { quest: Quest }) => (
  <div 
    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
      quest.is_completed 
        ? 'bg-primary/10 opacity-60' 
        : 'bg-muted/50 hover:bg-muted'
    }`}
  >
    {quest.is_completed ? (
      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
    ) : (
      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    )}
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium truncate ${quest.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
        {quest.title}
      </p>
      <p className="text-xs text-muted-foreground truncate">{quest.description}</p>
    </div>
    <div className={`text-sm font-bold ${quest.is_completed ? 'text-muted-foreground' : 'text-xp'}`}>
      +{quest.xp_reward} XP
    </div>
  </div>
);
