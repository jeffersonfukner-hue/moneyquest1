import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Gift, Users, ChevronRight, Star, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReferral } from '@/hooks/useReferral';
import { Skeleton } from '@/components/ui/skeleton';

export const ReferralSummaryWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { stats, isLoading, referralCode } = useReferral();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalReferrals = stats?.total_referrals || 0;
  const xpEarned = stats?.total_xp_earned || 0;
  const premiumDays = stats?.total_premium_days || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          {t('referral.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{totalReferrals}</p>
            <p className="text-xs text-muted-foreground">{t('referral.invited')}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Star className="w-4 h-4 mx-auto mb-1 text-amber-500" />
            <p className="text-lg font-bold">{xpEarned}</p>
            <p className="text-xs text-muted-foreground">XP</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Crown className="w-4 h-4 mx-auto mb-1 text-purple-500" />
            <p className="text-lg font-bold">{premiumDays}</p>
            <p className="text-xs text-muted-foreground">{t('referral.premiumDays')}</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/referral')}
        >
          <span>{t('referral.viewDetails')}</span>
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
};
