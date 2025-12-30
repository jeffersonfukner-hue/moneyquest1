import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';
import { useAuth } from './useAuth';

const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'America/Sao_Paulo';
  }
};

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const subscriptionCheckDone = useRef(false);

  const syncSubscriptionStatus = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      console.log('Subscription synced:', data);
    } catch (error) {
      console.error('Failed to sync subscription:', error);
    }
  }, [user]);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      subscriptionCheckDone.current = false;
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) {
      const profileData = data as Profile;
      
      // Auto-detect and set timezone on first login (when still using default)
      if (profileData.timezone === 'America/Sao_Paulo') {
        const browserTimezone = getBrowserTimezone();
        if (browserTimezone !== 'America/Sao_Paulo') {
          await supabase
            .from('profiles')
            .update({ timezone: browserTimezone })
            .eq('id', user.id);
          profileData.timezone = browserTimezone;
        }
      }
      
      setProfile(profileData);

      // Sync subscription status with Stripe (only once per session)
      if (!subscriptionCheckDone.current) {
        subscriptionCheckDone.current = true;
        syncSubscriptionStatus().then(() => {
          // Refetch profile after subscription sync
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()
            .then(({ data: updatedData }) => {
              if (updatedData) {
                setProfile(updatedData as Profile);
              }
            });
        });
      }
    }
    setLoading(false);
  }, [user, syncSubscriptionStatus]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      await fetchProfile();
    }

    return { error };
  };

  return { profile, loading, refetch: fetchProfile, updateProfile };
};
