import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';
import { useAuth } from './useAuth';
import { RealtimePostgresUpdatePayload } from '@supabase/supabase-js';

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
      const profileData = data as unknown as Profile;
      
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
      // Only attempt if we have a valid session with access token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!subscriptionCheckDone.current && sessionData?.session?.access_token) {
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
              setProfile(updatedData as unknown as Profile);
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

  // Realtime subscription for profile updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload: RealtimePostgresUpdatePayload<Profile>) => {
          if (payload.new) {
            setProfile(payload.new as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(updates as Record<string, unknown>)
      .eq('id', user.id);

    if (!error) {
      await fetchProfile();
    }

    return { error };
  };

  return { profile, loading, refetch: fetchProfile, updateProfile };
};
