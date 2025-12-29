import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trophy, Users, Crown, Medal, Award, UserPlus, Check, X, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeaderboard, LeaderboardEntry } from '@/hooks/useLeaderboard';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="w-5 text-center text-sm font-bold text-muted-foreground">#{rank}</span>;
};

const LeaderboardRow = ({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser: boolean }) => (
  <div className={cn(
    "flex items-center gap-3 p-3 rounded-lg transition-colors",
    isCurrentUser ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
  )}>
    <div className="w-8 flex justify-center">
      {getRankIcon(entry.rank || 0)}
    </div>
    <div className="text-2xl">{entry.avatar_icon}</div>
    <div className="flex-1 min-w-0">
      <p className={cn(
        "font-medium truncate",
        isCurrentUser && "text-primary"
      )}>
        {entry.display_name}
        {isCurrentUser && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
      </p>
      <p className="text-xs text-muted-foreground">Level {entry.level}</p>
    </div>
    <div className="text-right">
      <p className="font-bold text-primary">{entry.xp.toLocaleString()}</p>
      <p className="text-[10px] text-muted-foreground">XP</p>
    </div>
  </div>
);

export default function Leaderboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    isOnLeaderboard,
    myEntry,
    globalLeaderboard,
    friendsLeaderboard,
    friendRequests,
    loading,
    joinLeaderboard,
    leaveLeaderboard,
    updateVisibility,
    acceptFriendRequest,
    rejectFriendRequest,
    getMyRank
  } = useLeaderboard();

  const [isPublic, setIsPublic] = useState(myEntry?.is_public ?? true);
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    await joinLeaderboard(isPublic);
    setJoining(false);
  };

  const handleLeave = async () => {
    await leaveLeaderboard();
  };

  const handleVisibilityToggle = async (checked: boolean) => {
    setIsPublic(checked);
    if (isOnLeaderboard) {
      await updateVisibility(checked);
    }
  };

  const myRank = getMyRank();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">{t('leaderboard.title', 'Leaderboard')}</h1>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-24">
        {/* Join/Status Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            {!isOnLeaderboard ? (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <Trophy className="w-12 h-12 mx-auto text-primary" />
                  <h2 className="font-bold text-lg">{t('leaderboard.joinTitle', 'Join the Competition!')}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t('leaderboard.joinDescription', 'Compete with other players and climb the ranks.')}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    <span className="text-sm">
                      {isPublic 
                        ? t('leaderboard.publicProfile', 'Public Profile')
                        : t('leaderboard.privateProfile', 'Friends Only')
                      }
                    </span>
                  </div>
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleJoin}
                  disabled={joining}
                >
                  {joining ? t('common.loading') : t('leaderboard.join', 'Join Leaderboard')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{myEntry?.avatar_icon}</div>
                    <div>
                      <p className="font-bold">{myEntry?.display_name}</p>
                      <p className="text-sm text-muted-foreground">Level {myEntry?.level}</p>
                    </div>
                  </div>
                  {myRank && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">#{myRank}</p>
                      <p className="text-xs text-muted-foreground">{t('leaderboard.rank', 'Rank')}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {myEntry?.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    <span className="text-sm">
                      {myEntry?.is_public 
                        ? t('leaderboard.publicProfile', 'Public Profile')
                        : t('leaderboard.privateProfile', 'Friends Only')
                      }
                    </span>
                  </div>
                  <Switch 
                    checked={myEntry?.is_public ?? true} 
                    onCheckedChange={handleVisibilityToggle} 
                  />
                </div>

                <Button variant="outline" size="sm" onClick={handleLeave} className="w-full">
                  {t('leaderboard.leave', 'Leave Leaderboard')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                {t('leaderboard.friendRequests', 'Friend Requests')}
                <Badge variant="secondary">{friendRequests.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {friendRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <span className="text-sm truncate">{req.user_id.slice(0, 8)}...</span>
                  <div className="flex gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-green-500"
                      onClick={() => acceptFriendRequest(req.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-red-500"
                      onClick={() => rejectFriendRequest(req.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Tabs */}
        <Tabs defaultValue="global">
          <TabsList className="w-full">
            <TabsTrigger value="global" className="flex-1 gap-1">
              <Globe className="w-4 h-4" />
              {t('leaderboard.global', 'Global')}
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex-1 gap-1">
              <Users className="w-4 h-4" />
              {t('leaderboard.friends', 'Friends')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  {t('leaderboard.top50', 'Top 50 Players')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-2 space-y-1">
                    {globalLeaderboard.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {t('leaderboard.noPlayers', 'No players yet. Be the first!')}
                      </p>
                    ) : (
                      globalLeaderboard.map(entry => (
                        <LeaderboardRow 
                          key={entry.id} 
                          entry={entry} 
                          isCurrentUser={entry.user_id === user?.id}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="friends" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  {t('leaderboard.friendsRanking', 'Friends Ranking')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-2 space-y-1">
                    {friendsLeaderboard.length === 0 ? (
                      <div className="text-center py-8 space-y-2">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          {t('leaderboard.noFriends', 'No friends on the leaderboard yet.')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('leaderboard.inviteFriends', 'Invite friends to compete!')}
                        </p>
                      </div>
                    ) : (
                      friendsLeaderboard.map(entry => (
                        <LeaderboardRow 
                          key={entry.id} 
                          entry={entry} 
                          isCurrentUser={entry.user_id === user?.id}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
