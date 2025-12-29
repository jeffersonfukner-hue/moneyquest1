import { Swords, Coins, Flame, Shield, TrendingUp, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JournalStats as JournalStatsType } from '@/hooks/useAdventureJournal';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslation } from 'react-i18next';

interface JournalStatsProps {
  stats: JournalStatsType | null;
}

export const JournalStats = ({ stats }: JournalStatsProps) => {
  const { formatCurrency } = useCurrency();
  const { t } = useTranslation();

  if (!stats) return null;

  const statItems = [
    {
      icon: Swords,
      label: t('journal.combatEncounters'),
      value: stats.combatEncounters,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: Coins,
      label: t('journal.treasuresFound'),
      value: stats.treasuresFound,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      icon: Flame,
      label: t('journal.criticalHits'),
      value: stats.criticalHits,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      icon: TrendingUp,
      label: t('journal.goldCollected'),
      value: formatCurrency(stats.totalGoldEarned),
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      icon: Shield,
      label: t('journal.damageTaken'),
      value: formatCurrency(stats.totalDamageTaken),
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Crown,
      label: t('journal.biggestTreasure'),
      value: formatCurrency(stats.biggestTreasure),
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          📜 {t('journal.questStats')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {statItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 p-2 rounded-lg ${item.bgColor}`}
            >
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className={`text-sm font-semibold ${item.color}`}>
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {stats.mostDangerousCategory && (
          <div className="mt-3 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-muted-foreground">{t('journal.mostDangerous')}</p>
            <p className="text-sm font-semibold text-destructive capitalize">
              ⚠️ {stats.mostDangerousCategory.replace('_', ' ')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
