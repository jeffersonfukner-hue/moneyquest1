import { useTranslation } from 'react-i18next';
import { Trophy, Medal, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface RankingEntry {
  referrer_id: string;
  display_name: string;
  avatar_icon: string;
  completed_count: number;
  rank: number;
}

interface ReferralRankingProps {
  ranking: RankingEntry[];
  userRank: number | null;
  currentUserId: string;
  isLoading: boolean;
}

export const ReferralRanking = ({ ranking, userRank, currentUserId, isLoading }: ReferralRankingProps) => {
  const { t } = useTranslation();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBackground = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-300/10 via-gray-300/5 to-transparent border-gray-300/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/10 via-amber-600/5 to-transparent border-amber-600/30';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (ranking.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {t('referral.noRanking', 'Ranking ainda vazio')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('referral.beFirst', 'Seja o primeiro a indicar amigos!')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* User's current rank */}
      {userRank && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('referral.yourRank', 'Sua posição')}
              </span>
              <Badge variant="outline" className="text-lg px-3 py-1">
                #{userRank}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranking list */}
      <div className="space-y-2">
        {ranking.map((entry) => {
          const isCurrentUser = entry.referrer_id === currentUserId;

          return (
            <Card
              key={entry.referrer_id}
              className={`${getRankBackground(entry.rank)} ${isCurrentUser ? 'ring-2 ring-primary/50' : ''}`}
            >
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="w-8 h-8 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Avatar and name */}
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xl">{entry.avatar_icon}</span>
                    <span className={`text-sm font-medium ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                      {isCurrentUser ? t('referral.you', 'Você') : entry.display_name}
                    </span>
                  </div>

                  {/* Count */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                      {entry.completed_count}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('referral.conversions', 'conversões')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
