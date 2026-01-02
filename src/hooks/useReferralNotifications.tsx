import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { RealtimePostgresUpdatePayload } from '@supabase/supabase-js';

interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
  completed_at: string | null;
  rewarded_at: string | null;
}

export const useReferralNotifications = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`referral-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_id=eq.${user.id}`
        },
        (payload: RealtimePostgresUpdatePayload<ReferralRow>) => {
          const oldStatus = (payload.old as ReferralRow)?.status;
          const newStatus = payload.new?.status;

          // Notify when referral is completed or rewarded
          if (oldStatus === 'pending' && (newStatus === 'completed' || newStatus === 'rewarded')) {
            toast.success(t('referral.notification.title'), {
              description: t('referral.notification.description'),
              duration: 8000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, t]);
};
