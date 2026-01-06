import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Profile } from "@/types/database";
import { RealtimePostgresUpdatePayload } from "@supabase/supabase-js";

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  refetch: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  /**
   * Immediate client-side update to keep UI in sync while network/realtime catches up.
   * Use only with fields that were just changed by an action (ex: conversion).
   */
  optimisticUpdate: (updates: Partial<Profile>) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
  } catch {
    return "America/Sao_Paulo";
  }
};

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const subscriptionCheckDone = useRef(false);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      subscriptionCheckDone.current = false;
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      const profileData = data as unknown as Profile;

      // Auto-detect timezone on first login
      if (profileData.timezone === "America/Sao_Paulo") {
        const browserTimezone = getBrowserTimezone();
        if (browserTimezone !== "America/Sao_Paulo") {
          await supabase.from("profiles").update({ timezone: browserTimezone }).eq("id", user.id);
          profileData.timezone = browserTimezone;
        }
      }

      setProfile(profileData);

      // Subscription sync (only once per session)
      if (!subscriptionCheckDone.current && session?.access_token) {
        subscriptionCheckDone.current = true;
        setTimeout(async () => {
          try {
            const { error: syncError } = await supabase.functions.invoke("check-subscription");
            if (!syncError) {
              const { data: updatedData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();
              if (updatedData) setProfile(updatedData as unknown as Profile);
            }
          } catch {
            // non-critical
          }
        }, 1000);
      }
    }

    setLoading(false);
  }, [user, session?.access_token]);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload: RealtimePostgresUpdatePayload<Profile>) => {
          if (payload.new) setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const optimisticUpdate = useCallback((updates: Partial<Profile>) => {
    setProfile((prev) => (prev ? ({ ...prev, ...updates } as Profile) : prev));
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) return { error: new Error("Not authenticated") };

      const { error } = await supabase.from("profiles").update(updates as Record<string, unknown>).eq("id", user.id);

      if (!error) {
        await fetchProfile();
      }

      return { error: (error as unknown as Error) || null };
    },
    [user, fetchProfile]
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      loading,
      refetch: fetchProfile,
      updateProfile,
      optimisticUpdate,
    }),
    [profile, loading, fetchProfile, updateProfile, optimisticUpdate]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfileContext = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    // Resilient default (keeps app from crashing on unexpected provider ordering)
    return {
      profile: null,
      loading: true,
      refetch: async () => {},
      updateProfile: async () => ({ error: new Error("ProfileProvider not mounted") }),
      optimisticUpdate: () => {},
    } satisfies ProfileContextValue;
  }
  return ctx;
};
