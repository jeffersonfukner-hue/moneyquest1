import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getLevelFromXP, getLevelTitle } from '@/lib/gameLogic';

export interface XPChange {
  previousXP: number;
  currentXP: number;
  xpGained: number;
  previousLevel: number;
  currentLevel: number;
  levelUp: boolean;
  newLevelTitle: string | null;
}

export const useRealtimeXP = () => {
  const { user } = useAuth();
  const [xpChange, setXPChange] = useState<XPChange | null>(null);
  const previousXPRef = useRef<number | null>(null);
  const previousLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // First, fetch initial values
    const fetchInitial = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('xp, level')
        .eq('id', user.id)
        .single();
      
      if (data) {
        previousXPRef.current = data.xp;
        previousLevelRef.current = data.level;
      }
    };

    fetchInitial();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`profile-xp-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as { xp: number; level: number };
          const oldXP = previousXPRef.current ?? 0;
          const oldLevel = previousLevelRef.current ?? 1;
          
          // Only trigger if XP actually increased
          if (newData.xp > oldXP) {
            const xpGained = newData.xp - oldXP;
            // Calculate level from XP to be more robust
            const currentLevel = getLevelFromXP(newData.xp);
            const levelUp = currentLevel > oldLevel;
            
            setXPChange({
              previousXP: oldXP,
              currentXP: newData.xp,
              xpGained,
              previousLevel: oldLevel,
              currentLevel,
              levelUp,
              newLevelTitle: levelUp ? getLevelTitle(currentLevel) : null,
            });
          }
          
          // Update refs for next comparison
          previousXPRef.current = newData.xp;
          previousLevelRef.current = getLevelFromXP(newData.xp);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const clearXPChange = () => setXPChange(null);

  return { xpChange, clearXPChange };
};
