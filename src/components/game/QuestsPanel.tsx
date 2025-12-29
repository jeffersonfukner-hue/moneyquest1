import { useState } from 'react';
import { Quest, QuestType } from '@/types/database';
import { Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuestCard } from './QuestCard';
import { QuestTimer } from './QuestTimer';
import { QUEST_TYPE_CONFIG } from '@/lib/gameLogic';

interface QuestsPanelProps {
  quests: Quest[];
}

type TabType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPECIAL';

const QUEST_TABS: { type: TabType; label: string }[] = [
  { type: 'DAILY', label: 'Daily' },
  { type: 'WEEKLY', label: 'Weekly' },
  { type: 'MONTHLY', label: 'Monthly' },
  { type: 'SPECIAL', label: 'Special' },
];

export const QuestsPanel = ({ quests }: QuestsPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('DAILY');

  const getQuestsByType = (type: QuestType): Quest[] => {
    return quests.filter(q => q.type === type);
  };

  const getCompletionCount = (type: QuestType): { completed: number; total: number } => {
    const typeQuests = getQuestsByType(type);
    return {
      completed: typeQuests.filter(q => q.is_completed).length,
      total: typeQuests.length
    };
  };

  // Get the first quest of a type to show the timer
  const getFirstQuestForTimer = (type: QuestType): Quest | undefined => {
    return getQuestsByType(type).find(q => !q.is_completed && q.period_end_date);
  };

  const achievementQuests = getQuestsByType('ACHIEVEMENT');

  return (
    <div className="bg-card rounded-2xl p-6 shadow-md animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-quest rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-primary-foreground" />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground">Quests</h3>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="grid grid-cols-4 mb-4">
          {QUEST_TABS.map(tab => {
            const stats = getCompletionCount(tab.type);
            const config = QUEST_TYPE_CONFIG[tab.type];
            return (
              <TabsTrigger 
                key={tab.type} 
                value={tab.type}
                className="text-xs sm:text-sm flex items-center gap-1"
              >
                <span>{config.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                {stats.total > 0 && (
                  <span className="text-[10px] opacity-70">
                    {stats.completed}/{stats.total}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {QUEST_TABS.map(tab => {
          const typeQuests = getQuestsByType(tab.type);
          const timerQuest = getFirstQuestForTimer(tab.type);
          
          return (
            <TabsContent key={tab.type} value={tab.type} className="mt-0">
              {timerQuest && (
                <div className="mb-3">
                  <QuestTimer 
                    periodEndDate={timerQuest.period_end_date} 
                    questType={tab.type}
                  />
                </div>
              )}
              
              {typeQuests.length > 0 ? (
                <div className="space-y-2">
                  {typeQuests.map(quest => (
                    <QuestCard 
                      key={quest.id} 
                      quest={quest} 
                      showTimer={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No {tab.label.toLowerCase()} quests available</p>
                  {tab.type === 'SPECIAL' && (
                    <p className="text-xs mt-1">Check back during special events!</p>
                  )}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Achievement quests section */}
      {achievementQuests.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">{QUEST_TYPE_CONFIG.ACHIEVEMENT.icon}</span>
            <h4 className="text-sm font-medium text-foreground">Achievements</h4>
            <span className="text-xs text-muted-foreground">
              {achievementQuests.filter(q => q.is_completed).length}/{achievementQuests.length}
            </span>
          </div>
          <div className="space-y-2">
            {achievementQuests.map(quest => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};