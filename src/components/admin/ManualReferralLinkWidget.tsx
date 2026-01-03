import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Link2, Loader2, CheckCircle, AlertCircle, Gift } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReferralResult {
  success: boolean;
  referral_id?: string;
  referrer_xp_bonus?: number;
  referrer_premium_days?: number;
  referred_xp_bonus?: number;
  tier?: {
    name: string;
    level: number;
  };
  message?: string;
}

export const ManualReferralLinkWidget = () => {
  const { t } = useTranslation();
  const [referredId, setReferredId] = useState('');
  const [referrerId, setReferrerId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReferralResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!referredId.trim() || !referrerId.trim()) {
      toast.error('Both user IDs are required');
      return;
    }

    if (referredId.trim() === referrerId.trim()) {
      toast.error('Referred and referrer cannot be the same user');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.rpc('admin_link_referral_manually', {
        p_referred_id: referredId.trim(),
        p_referrer_id: referrerId.trim(),
        p_note: note.trim() || undefined,
      });

      if (error) throw error;

      const resultData = data as unknown as ReferralResult;
      setResult(resultData);

      if (resultData.success) {
        toast.success('Referral linked successfully!');
        // Reset form
        setReferredId('');
        setReferrerId('');
        setNote('');
      } else {
        toast.error(resultData.message || 'Failed to link referral');
      }
    } catch (error) {
      console.error('Error linking referral:', error);
      toast.error('Failed to link referral. Check if both user IDs are valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          {t('admin.referral.manualLinkTitle', 'Manual Referral Link')}
        </CardTitle>
        <CardDescription>
          {t('admin.referral.manualLinkDescription', 'Link a user to a referrer and apply retroactive rewards')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="referredId">
              {t('admin.referral.referredUserId', 'Referred User ID')}
            </Label>
            <Input
              id="referredId"
              placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
              value={referredId}
              onChange={(e) => setReferredId(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.referral.referredIdHint', 'The user who signed up (will receive referral bonus)')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referrerId">
              {t('admin.referral.referrerUserId', 'Referrer User ID')}
            </Label>
            <Input
              id="referrerId"
              placeholder="e.g., 987e6543-e21b-32d1-b654-624516271000"
              value={referrerId}
              onChange={(e) => setReferrerId(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.referral.referrerIdHint', 'The user who referred (will receive XP + Premium days)')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">
              {t('admin.referral.note', 'Admin Note')} ({t('common.optional', 'optional')})
            </Label>
            <Textarea
              id="note"
              placeholder={t('admin.referral.notePlaceholder', 'Reason for manual linking...')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading}
              rows={2}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.processing', 'Processing...')}
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 mr-2" />
                {t('admin.referral.linkAndReward', 'Link & Apply Rewards')}
              </>
            )}
          </Button>
        </form>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {result.success ? (
                <div className="space-y-2">
                  <p className="font-medium flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    {t('admin.referral.rewardsApplied', 'Rewards Applied Successfully!')}
                  </p>
                  <ul className="text-sm space-y-1 ml-6">
                    {result.tier && (
                      <li>
                        {t('admin.referral.tier', 'Tier')}: <strong>{result.tier.name}</strong> (Level {result.tier.level})
                      </li>
                    )}
                    {result.referrer_xp_bonus && (
                      <li>
                        {t('admin.referral.referrerXP', 'Referrer XP')}: <strong>+{result.referrer_xp_bonus} XP</strong>
                      </li>
                    )}
                    {result.referrer_premium_days && result.referrer_premium_days > 0 && (
                      <li>
                        {t('admin.referral.referrerPremium', 'Referrer Premium')}: <strong>+{result.referrer_premium_days} days</strong>
                      </li>
                    )}
                    {result.referred_xp_bonus && (
                      <li>
                        {t('admin.referral.referredXP', 'Referred XP')}: <strong>+{result.referred_xp_bonus} XP</strong>
                      </li>
                    )}
                  </ul>
                </div>
              ) : (
                <p>{result.message || t('admin.referral.error', 'Failed to link referral')}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
