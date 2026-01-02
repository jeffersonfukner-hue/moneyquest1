import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { RealtimePostgresUpdatePayload } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';

interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
  completed_at: string | null;
  rewarded_at: string | null;
}

const triggerReferralCelebration = () => {
  // First burst from left
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.2, y: 0.6 },
    colors: ['#F4B400', '#3D2A5D', '#22c55e', '#fbbf24'],
  });

  // Second burst from right
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.8, y: 0.6 },
      colors: ['#F4B400', '#3D2A5D', '#22c55e', '#fbbf24'],
    });
  }, 150);

  // Center celebration burst
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#F4B400', '#3D2A5D', '#22c55e', '#fbbf24'],
    });
  }, 300);
};

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
            // Trigger confetti celebration
            triggerReferralCelebration();
            
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
