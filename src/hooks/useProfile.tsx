import { useState, useEffect, useRef } from 'react';
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

  const fetchProfile = async () => {
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
        try {
          const { error: syncError } = await supabase.functions.invoke('check-subscription');
          if (!syncError) {
            // Refetch profile after subscription sync
            const { data: updatedData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
            if (updatedData) {
              setProfile(updatedData as Profile);
            }
          }
        } catch (e) {
          console.error('Subscription sync failed:', e);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

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
