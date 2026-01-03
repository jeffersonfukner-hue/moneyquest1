import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Quest, QuestType } from '@/types/database';
import { Target, Crown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuestCard } from './QuestCard';
import { QuestTimer } from './QuestTimer';
import { WeeklyChallengesIndicator } from './WeeklyChallengesIndicator';
import { QUEST_TYPE_CONFIG } from '@/lib/gameLogic';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { PremiumBadge } from '@/components/subscription/PremiumBadge';

interface QuestsPanelProps {
  quests: Quest[];
}

type TabType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPECIAL';

export const QuestsPanel = ({ quests }: QuestsPanelProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('DAILY');
  const { canAccessWeeklyQuests, canAccessMonthlyQuests, canAccessSpecialQuests, isPremium } = useSubscription();

  const QUEST_TABS: { type: TabType; labelKey: string; isPremium: boolean }[] = [
    { type: 'DAILY', labelKey: 'quests.daily', isPremium: false },
    { type: 'WEEKLY', labelKey: 'quests.weekly', isPremium: true },
    { type: 'MONTHLY', labelKey: 'quests.monthly', isPremium: true },
    { type: 'SPECIAL', labelKey: 'quests.special', isPremium: true },
  ];

  const canAccessQuestType = (type: TabType): boolean => {
    switch (type) {
      case 'DAILY': return true;
      case 'WEEKLY': return canAccessWeeklyQuests;
      case 'MONTHLY': return canAccessMonthlyQuests;
      case 'SPECIAL': return canAccessSpecialQuests;
      default: return false;
    }
  };

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
    <div className="bg-card rounded-2xl p-3 sm:p-4 shadow-md animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-quest rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-primary-foreground" />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground">{t('quests.title')}</h3>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="grid grid-cols-4 mb-3 h-auto">
          {QUEST_TABS.map(tab => {
            const stats = getCompletionCount(tab.type);
            const config = QUEST_TYPE_CONFIG[tab.type];
            const locked = tab.isPremium && !isPremium;
            return (
              <TabsTrigger 
                key={tab.type} 
                value={tab.type}
                className="text-xs py-2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 min-h-[44px] relative"
              >
                <span>{config.icon}</span>
                <span className="hidden sm:inline">{t(tab.labelKey)}</span>
                {locked ? (
                  <Crown className="w-3 h-3 text-amber-500" />
                ) : stats.total > 0 ? (
                  <span className="text-[10px] opacity-70">
                    {stats.completed}/{stats.total}
                  </span>
                ) : null}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {QUEST_TABS.map(tab => {
          const typeQuests = getQuestsByType(tab.type);
          const timerQuest = getFirstQuestForTimer(tab.type);
          const hasAccess = canAccessQuestType(tab.type);
          
          return (
            <TabsContent key={tab.type} value={tab.type} className="mt-0">
              {!hasAccess ? (
                <div className="py-6">
                  <UpgradePrompt 
                    feature={tab.type === 'WEEKLY' ? 'weekly_quests' : tab.type === 'MONTHLY' ? 'monthly_quests' : 'special_quests'} 
                    context="modal" 
                  />
                </div>
              ) : (
                <>
                  {/* Weekly Challenges Indicator */}
                  {tab.type === 'WEEKLY' && typeQuests.length > 0 && (
                    <div className="mb-3">
                      <WeeklyChallengesIndicator 
                        questCount={typeQuests.length}
                        completedCount={typeQuests.filter(q => q.is_completed).length}
                      />
                    </div>
                  )}

                  {timerQuest && tab.type !== 'WEEKLY' && (
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
                </>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Achievements Section - Separate from missions */}
      {achievementQuests.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-lg flex items-center justify-center">
              <span className="text-xs">{QUEST_TYPE_CONFIG.ACHIEVEMENT.icon}</span>
            </div>
            <h4 className="text-sm font-semibold text-foreground">{t('quests.achievement')}</h4>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {achievementQuests.filter(q => q.is_completed).length}/{achievementQuests.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {t('quests.achievementDescription', { defaultValue: 'One-time goals with permanent rewards' })}
          </p>
          <div className="space-y-2">
            {achievementQuests
              .sort((a, b) => {
                // Completed last, then by progress percentage
                if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
                const aProgress = a.progress_target > 0 ? a.progress_current / a.progress_target : 0;
                const bProgress = b.progress_target > 0 ? b.progress_current / b.progress_target : 0;
                return bProgress - aProgress;
              })
              .map(quest => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
