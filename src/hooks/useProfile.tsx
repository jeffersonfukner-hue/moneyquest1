import { useState, useEffect, useRef } from 'react';
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
  const { user, session } = useAuth();
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
      // Use session from context to ensure we have a valid token
      if (!subscriptionCheckDone.current && session?.access_token) {
        subscriptionCheckDone.current = true;
        
        const syncSubscription = async (retryCount = 0): Promise<void> => {
          try {
            // Refresh session before calling edge function to ensure valid token
            const { data: refreshedSession } = await supabase.auth.refreshSession();
            if (!refreshedSession?.session?.access_token) {
              console.log('Session refresh failed, skipping subscription sync');
              return;
            }
            
            const { error: syncError } = await supabase.functions.invoke('check-subscription');
            
            // If auth error and haven't retried, wait and retry once
            if (syncError?.message?.includes('Auth session missing') && retryCount === 0) {
              console.log('Session sync delay, retrying subscription check...');
              await new Promise(resolve => setTimeout(resolve, 2000));
              return syncSubscription(1);
            }
            
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
            // Silently fail - subscription sync is not critical for app functionality
            console.log('Subscription sync skipped:', e);
          }
        };
        
        // Delay initial sync to allow session to stabilize
        setTimeout(() => syncSubscription(), 500);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user, session?.access_token]);

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
