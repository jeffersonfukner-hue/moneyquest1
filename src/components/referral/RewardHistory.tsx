import { useTranslation } from 'react-i18next';
import { Sparkles, Gift } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';

interface RewardEntry {
  id: string;
  xp_change: number;
  description: string | null;
  created_at: string;
  source_id: string | null;
}

interface RewardHistoryProps {
  rewardHistory: RewardEntry[];
  isLoading: boolean;
}

export const RewardHistory = ({ rewardHistory, isLoading }: RewardHistoryProps) => {
  const { t, i18n } = useTranslation();

  const getLocale = () => {
    switch (i18n.language) {
      case 'pt-BR':
      case 'pt-PT':
        return ptBR;
      case 'es-ES':
        return es;
      default:
        return enUS;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (rewardHistory.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Gift className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {t('referral.noRewards', 'Nenhuma recompensa ainda')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('referral.rewardsWillAppear', 'Suas recompensas aparecerão aqui')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {rewardHistory.map((reward) => (
        <Card key={reward.id}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {reward.description || t('referral.rewardLabel', 'Recompensa de indicação')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(reward.created_at), 'PPp', { locale: getLocale() })}
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-primary">
                +{reward.xp_change} XP
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
