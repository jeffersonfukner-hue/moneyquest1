import { useTranslation } from 'react-i18next';
import { useXPHistory, XPHistoryEntry } from '@/hooks/useXPHistory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap, Target, Gift, Award, Star, Clock } from 'lucide-react';

const getSourceIcon = (source: XPHistoryEntry['source']) => {
  switch (source) {
    case 'transaction':
      return <Zap className="h-4 w-4 text-primary" />;
    case 'quest':
      return <Target className="h-4 w-4 text-accent" />;
    case 'daily_reward':
      return <Gift className="h-4 w-4 text-xp" />;
    case 'badge':
      return <Award className="h-4 w-4 text-expense" />;
    case 'bonus':
      return <Star className="h-4 w-4 text-income" />;
    default:
      return <Zap className="h-4 w-4" />;
  }
};

const getSourceLabel = (source: XPHistoryEntry['source'], t: (key: string) => string) => {
  const labels: Record<string, string> = {
    transaction: t('xpHistory.sources.transaction'),
    quest: t('xpHistory.sources.quest'),
    daily_reward: t('xpHistory.sources.dailyReward'),
    badge: t('xpHistory.sources.badge'),
    bonus: t('xpHistory.sources.bonus'),
  };
  return labels[source] || source;
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
};

export const XPHistoryCard = () => {
  const { t } = useTranslation();
  const { history, loading } = useXPHistory(15);

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {t('xpHistory.title')}
          </h3>
        </div>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {t('xpHistory.title')}
          </h3>
        </div>
        <p className="text-muted-foreground text-sm text-center py-4">
          {t('xpHistory.empty')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-4 shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-display font-semibold text-foreground">
          {t('xpHistory.title')}
        </h3>
      </div>

      <ScrollArea className="h-64">
        <div className="space-y-2 pr-2">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-1.5 bg-background rounded-full">
                  {getSourceIcon(entry.source)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {getSourceLabel(entry.source, t)}
                  </p>
                  {entry.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-2">
                <span className={`text-sm font-bold ${entry.xp_change > 0 ? 'text-income' : 'text-expense'}`}>
                  {entry.xp_change > 0 ? '+' : ''}{entry.xp_change}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTime(entry.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('xpHistory.currentXP')}</span>
          <span className="font-bold text-xp">
            {history.length > 0 ? history[0].xp_after.toLocaleString() : 0} XP
          </span>
        </div>
      </div>
    </div>
  );
};
