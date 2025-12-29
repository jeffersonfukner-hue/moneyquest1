import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Crown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export const LeaderboardCard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isOnLeaderboard, globalLeaderboard, getMyRank, loading } = useLeaderboard();

  const myRank = getMyRank();
  const topThree = globalLeaderboard.slice(0, 3);

  if (loading) return null;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            {t('leaderboard.title', 'Leaderboard')}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs gap-1"
            onClick={() => navigate('/leaderboard')}
          >
            {t('common.more', 'More')}
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isOnLeaderboard ? (
          <div className="text-center py-2 space-y-2">
            <Trophy className="w-8 h-8 mx-auto text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              {t('leaderboard.joinPrompt', 'Join the leaderboard to compete!')}
            </p>
            <Button 
              size="sm" 
              variant="outline"
              className="h-7 text-xs"
              onClick={() => navigate('/leaderboard')}
            >
              {t('leaderboard.join', 'Join Leaderboard')}
            </Button>
          </div>
        ) : (
          <>
            {/* Top 3 Mini Display */}
            <div className="flex items-end justify-center gap-2">
              {topThree.length > 1 && (
                <div className="flex flex-col items-center">
                  <span className="text-lg">{topThree[1]?.avatar_icon}</span>
                  <div className="w-10 h-8 bg-slate-400/20 rounded-t-sm flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-400">2</span>
                  </div>
                </div>
              )}
              {topThree.length > 0 && (
                <div className="flex flex-col items-center -mb-1">
                  <Crown className="w-4 h-4 text-yellow-500 -mb-1" />
                  <span className="text-xl">{topThree[0]?.avatar_icon}</span>
                  <div className="w-12 h-10 bg-yellow-500/20 rounded-t-sm flex items-center justify-center">
                    <span className="text-sm font-bold text-yellow-500">1</span>
                  </div>
                </div>
              )}
              {topThree.length > 2 && (
                <div className="flex flex-col items-center">
                  <span className="text-lg">{topThree[2]?.avatar_icon}</span>
                  <div className="w-10 h-6 bg-amber-600/20 rounded-t-sm flex items-center justify-center">
                    <span className="text-xs font-bold text-amber-600">3</span>
                  </div>
                </div>
              )}
            </div>

            {/* User's Rank */}
            {myRank && (
              <div className={cn(
                "flex items-center justify-between p-2 rounded-lg",
                myRank <= 3 ? "bg-primary/10" : "bg-muted/50"
              )}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">#{myRank}</span>
                  <span className="text-xs text-muted-foreground">
                    {t('leaderboard.yourRank', 'Your Rank')}
                  </span>
                </div>
                {myRank <= 10 && (
                  <span className="text-[10px] text-primary">🔥 Top 10!</span>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
