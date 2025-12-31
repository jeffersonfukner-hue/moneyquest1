import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface XPHistoryEntry {
  id: string;
  user_id: string;
  xp_before: number;
  xp_after: number;
  xp_change: number;
  source: 'transaction' | 'quest' | 'daily_reward' | 'badge' | 'bonus';
  source_id: string | null;
  description: string | null;
  created_at: string;
}

export const useXPHistory = (limit = 20) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<XPHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('xp_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && data) {
      setHistory(data as XPHistoryEntry[]);
    }
    setLoading(false);
  }, [user, limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Realtime subscription for new entries
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`xp-history-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'xp_history',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new) {
            setHistory(prev => [payload.new as XPHistoryEntry, ...prev].slice(0, limit));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, limit]);

  return { history, loading, refetch: fetchHistory };
};
