import { useEffect, useState, useCallback } from 'react';
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

// Calculate tier from completed count
const getTierFromCount = (count: number): 'none' | 'bronze' | 'silver' | 'gold' => {
  if (count >= 15) return 'gold';
  if (count >= 5) return 'silver';
  if (count >= 1) return 'bronze';
  return 'none';
};

export const useReferralNotifications = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tierUpgrade, setTierUpgrade] = useState<'bronze' | 'silver' | 'gold' | null>(null);

  const clearTierUpgrade = useCallback(() => {
    setTierUpgrade(null);
  }, []);

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
        async (payload: RealtimePostgresUpdatePayload<ReferralRow>) => {
          const oldStatus = (payload.old as ReferralRow)?.status;
          const newStatus = payload.new?.status;

          // Notify when referral is completed or rewarded
          if (oldStatus === 'pending' && (newStatus === 'completed' || newStatus === 'rewarded')) {
            // Get current completed count to check for tier upgrade
            const { count: newCount } = await supabase
              .from('referrals')
              .select('*', { count: 'exact', head: true })
              .eq('referrer_id', user.id)
              .in('status', ['completed', 'rewarded']);

            const currentCount = newCount || 0;
            const previousCount = currentCount - 1;
            
            const oldTier = getTierFromCount(previousCount);
            const newTier = getTierFromCount(currentCount);

            // Check if tier was upgraded
            if (newTier !== oldTier && newTier !== 'none') {
              // Trigger tier upgrade celebration
              setTierUpgrade(newTier);
            } else {
              // Regular referral celebration
              triggerReferralCelebration();
              
              toast.success(t('referral.notification.title'), {
                description: t('referral.notification.description'),
                duration: 8000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, t]);

  return {
    tierUpgrade,
    clearTierUpgrade,
  };
};
