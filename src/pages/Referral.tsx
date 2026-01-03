import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Gift, Users, Clock, CheckCircle, Sparkles, Crown, Copy, Share2, Trophy, History, Clipboard } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReferral } from '@/hooks/useReferral';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ReferredUsersList } from '@/components/referral/ReferredUsersList';
import { RewardHistory } from '@/components/referral/RewardHistory';
import { ReferralRanking } from '@/components/referral/ReferralRanking';
import { ReferralTierBadge } from '@/components/referral/ReferralTierBadge';
import { buildWaMeShareUrl } from '@/lib/whatsapp';

interface TierInfo {
  tier: 'none' | 'bronze' | 'silver' | 'gold';
  tier_icon: string;
  next_tier: string | null;
  next_tier_icon: string | null;
  progress_to_next: number;
  remaining: number;
  completed_count: number;
}

interface DetailedStats {
  referral_code: string;
  referred_list: Array<{
    referred_id: string;
    status: string;
    flagged_as_suspicious: boolean;
    suspicion_reason: string | null;
    created_at: string;
    completed_at: string | null;
    transaction_count: number;
    required_count: number;
  }>;
  reward_history: Array<{
    id: string;
    xp_change: number;
    description: string | null;
    created_at: string;
    source_id: string | null;
  }>;
  ranking: Array<{
    referrer_id: string;
    display_name: string;
    avatar_icon: string;
    completed_count: number;
    rank: number;
    tier?: string;
    tier_icon?: string;
  }>;
  user_rank: number | null;
  tier: TierInfo | null;
}

const Referral = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, isLoading, referralLink, referralCode } = useReferral();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch detailed stats
  const { data: detailedStats, isLoading: isLoadingDetailed } = useQuery({
    queryKey: ['detailed-referral-stats', user?.id],
    queryFn: async (): Promise<DetailedStats | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase.rpc('get_detailed_referral_stats', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching detailed referral stats:', error);
        return null;
      }

      return data as unknown as DetailedStats;
    },
    enabled: !!user?.id,
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success(t('referral.linkCopied'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const shareText = t('referral.shareMessage', { link: referralLink });
  const whatsappUrl = buildWaMeShareUrl({ text: shareText });

  const handleCopyWhatsAppMessage = async () => {
    const text = t('referral.shareMessage', { link: referralLink });
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('referral.whatsAppMessageCopied', 'Mensagem copiada'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MoneyQuest',
          text: t('referral.shareMessage', { link: referralLink }),
          url: referralLink,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <AppLayout activeTab="home" showNavigation showAdBanner>
      <div className="min-h-screen bg-background pb-4">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                {t('referral.pageTitle', 'Programa de Indicação')}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t('referral.pageSubtitle', 'Indique amigos e ganhe recompensas')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Share Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" />
                {t('referral.shareTitle', 'Compartilhe seu link')}
              </CardTitle>
              <CardDescription>
                {t('referral.shareSubtitle', 'Envie para amigos e ganhe recompensas quando eles começarem')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Link input */}
              <div className="flex gap-2">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="flex-1 text-sm bg-background font-mono" 
                />
                <Button onClick={handleCopyLink} variant="outline" size="icon">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              {/* Share buttons */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      <FaWhatsapp className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  </a>
                  <Button 
                    onClick={handleNativeShare} 
                    variant="outline" 
                    className="flex-1"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {t('referral.share')}
                  </Button>
                </div>
                
                {/* Copy WhatsApp message fallback */}
                <Button 
                  onClick={handleCopyWhatsAppMessage} 
                  variant="ghost" 
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <Clipboard className="w-3 h-3 mr-1" />
                  {t('referral.copyWhatsAppMessage', 'Copiar mensagem do WhatsApp')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="text-xs">
                {t('referral.tabs.overview', 'Resumo')}
              </TabsTrigger>
              <TabsTrigger value="referred" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {t('referral.tabs.referred', 'Indicados')}
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs">
                <History className="w-3 h-3 mr-1" />
                {t('referral.tabs.history', 'Histórico')}
              </TabsTrigger>
              <TabsTrigger value="ranking" className="text-xs">
                <Trophy className="w-3 h-3 mr-1" />
                {t('referral.tabs.ranking', 'Ranking')}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Tier Badge */}
              <ReferralTierBadge 
                tierInfo={detailedStats?.tier || null} 
                isLoading={isLoadingDetailed} 
              />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Total Referrals */}
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    {isLoading ? (
                      <Skeleton className="h-8 w-12 mx-auto mb-1" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">
                        {stats?.total_referrals || 0}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Users className="h-3 w-3" />
                      {t('referral.stats.total', 'Total de indicações')}
                    </p>
                  </CardContent>
                </Card>

                {/* Pending */}
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    {isLoading ? (
                      <Skeleton className="h-8 w-12 mx-auto mb-1" />
                    ) : (
                      <p className="text-2xl font-bold text-amber-500">
                        {stats?.pending_referrals || 0}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('referral.stats.pending', 'Pendentes')}
                    </p>
                  </CardContent>
                </Card>

                {/* Completed */}
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    {isLoading ? (
                      <Skeleton className="h-8 w-12 mx-auto mb-1" />
                    ) : (
                      <p className="text-2xl font-bold text-green-500">
                        {stats?.completed_referrals || 0}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {t('referral.stats.completed', 'Convertidas')}
                    </p>
                  </CardContent>
                </Card>

                {/* Referral Code */}
                <Card>
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className="text-lg font-bold text-primary font-mono uppercase">
                      {referralCode || '---'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('referral.stats.code', 'Seu código')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Rewards Earned */}
              <Card className="bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border-accent/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    {t('referral.rewards.earned', 'Recompensas Ganhas')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {/* XP Earned */}
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 mx-auto mb-1" />
                      ) : (
                        <p className="text-2xl font-bold text-primary">
                          +{stats?.total_xp_earned || 0}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        XP {t('referral.rewards.earnedLabel', 'ganhos')}
                      </p>
                    </div>

                    {/* Premium Days */}
                    <div className="text-center p-3 rounded-lg bg-background/50">
                      {isLoading ? (
                        <Skeleton className="h-8 w-16 mx-auto mb-1" />
                      ) : (
                        <p className="text-2xl font-bold text-accent">
                          +{stats?.total_premium_days || 0}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Crown className="h-3 w-3" />
                        {t('referral.rewards.premiumDays', 'dias Premium')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How it works */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {t('referral.howItWorks.title', 'Como funciona?')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {t('referral.howItWorks.step1.title', 'Compartilhe seu link')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('referral.howItWorks.step1.description', 'Envie seu link exclusivo para amigos e familiares')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {t('referral.howItWorks.step2.title', 'Amigo se cadastra')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('referral.howItWorks.step2.description', 'Seu amigo cria uma conta usando seu link de indicação')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-accent">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {t('referral.howItWorks.step3.title', 'Vocês dois ganham!')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('referral.howItWorks.step3.description', 'Após 5 transações válidas, você ganha 500 XP + 7 dias Premium')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Referred Users Tab */}
            <TabsContent value="referred" className="mt-4">
              <ReferredUsersList
                referredList={detailedStats?.referred_list || []}
                isLoading={isLoadingDetailed}
              />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-4">
              <RewardHistory
                rewardHistory={detailedStats?.reward_history || []}
                isLoading={isLoadingDetailed}
              />
            </TabsContent>

            {/* Ranking Tab */}
            <TabsContent value="ranking" className="mt-4">
              <ReferralRanking
                ranking={detailedStats?.ranking || []}
                userRank={detailedStats?.user_rank || null}
                currentUserId={user?.id || ''}
                isLoading={isLoadingDetailed}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default Referral;
