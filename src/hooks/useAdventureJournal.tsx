import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface JournalEntry {
  id: string;
  transactionId: string;
  narrative: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  eventType: 'INCOME' | 'EXPENSE';
  amount: number;
  createdAt: string;
}

export interface JournalStats {
  totalEntries: number;
  combatEncounters: number;
  treasuresFound: number;
  criticalHits: number;
  totalGoldEarned: number;
  totalDamageTaken: number;
  mostDangerousCategory: string | null;
  biggestTreasure: number;
}

interface FetchOptions {
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  eventType?: 'INCOME' | 'EXPENSE';
  impact?: 'low' | 'medium' | 'high' | 'critical';
}

export const useAdventureJournal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState<JournalStats | null>(null);

  const fetchJournal = useCallback(async (options: FetchOptions = {}) => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const { limit = 20, offset = 0, dateFrom, dateTo, category, eventType, impact } = options;
    
    setLoading(true);

    let query = supabase
      .from('transaction_narratives')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    if (impact) {
      query = query.eq('impact', impact);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching journal:', error);
      setLoading(false);
      return;
    }

    const mappedEntries: JournalEntry[] = (data || []).map(item => ({
      id: item.id,
      transactionId: item.transaction_id,
      narrative: item.narrative,
      impact: item.impact as JournalEntry['impact'],
      category: item.category,
      eventType: item.event_type as JournalEntry['eventType'],
      amount: Number(item.amount),
      createdAt: item.created_at,
    }));

    if (offset === 0) {
      setEntries(mappedEntries);
    } else {
      setEntries(prev => [...prev, ...mappedEntries]);
    }

    setHasMore(mappedEntries.length === limit);
    setLoading(false);
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('transaction_narratives')
      .select('*')
      .eq('user_id', user.id);

    if (error || !data) return;

    const combatEncounters = data.filter(e => e.event_type === 'EXPENSE').length;
    const treasuresFound = data.filter(e => e.event_type === 'INCOME').length;
    const criticalHits = data.filter(e => e.impact === 'critical').length;
    
    const totalGoldEarned = data
      .filter(e => e.event_type === 'INCOME')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    const totalDamageTaken = data
      .filter(e => e.event_type === 'EXPENSE')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Find most dangerous category
    const expensesByCategory = data
      .filter(e => e.event_type === 'EXPENSE')
      .reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
      }, {} as Record<string, number>);

    const mostDangerousCategory = Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Find biggest treasure
    const biggestTreasure = data
      .filter(e => e.event_type === 'INCOME')
      .reduce((max, e) => Math.max(max, Number(e.amount)), 0);

    setStats({
      totalEntries: data.length,
      combatEncounters,
      treasuresFound,
      criticalHits,
      totalGoldEarned,
      totalDamageTaken,
      mostDangerousCategory,
      biggestTreasure,
    });
  }, [user]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchJournal({ offset: entries.length });
    }
  }, [loading, hasMore, entries.length, fetchJournal]);

  useEffect(() => {
    fetchJournal();
    fetchStats();
  }, [fetchJournal, fetchStats]);

  return {
    entries,
    loading,
    hasMore,
    stats,
    fetchJournal,
    loadMore,
    refetch: () => {
      fetchJournal();
      fetchStats();
    },
  };
};
