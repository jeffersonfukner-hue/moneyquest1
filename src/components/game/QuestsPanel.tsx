import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

export const QuestsPanel = ({ quests }: QuestsPanelProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('DAILY');

  const QUEST_TABS: { type: TabType; labelKey: string }[] = [
    { type: 'DAILY', labelKey: 'quests.daily' },
    { type: 'WEEKLY', labelKey: 'quests.weekly' },
    { type: 'MONTHLY', labelKey: 'quests.monthly' },
    { type: 'SPECIAL', labelKey: 'quests.special' },
  ];

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

  const getFirstQuestForTimer = (type: QuestType): Quest | undefined => {
    return getQuestsByType(type).find(q => !q.is_completed && q.period_end_date);
  };

  const achievementQuests = getQuestsByType('ACHIEVEMENT');

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-md animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-quest rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-primary-foreground" />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground">{t('quests.title')}</h3>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="grid grid-cols-4 mb-4 h-auto">
          {QUEST_TABS.map(tab => {
            const stats = getCompletionCount(tab.type);
            const config = QUEST_TYPE_CONFIG[tab.type];
            return (
              <TabsTrigger 
                key={tab.type} 
                value={tab.type}
                className="text-xs py-2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 min-h-[44px]"
              >
                <span>{config.icon}</span>
                <span className="hidden sm:inline">{t(tab.labelKey)}</span>
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
                  <p className="text-sm">{t('common.noData')}</p>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {achievementQuests.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">{QUEST_TYPE_CONFIG.ACHIEVEMENT.icon}</span>
            <h4 className="text-sm font-medium text-foreground">{t('quests.achievement')}</h4>
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
