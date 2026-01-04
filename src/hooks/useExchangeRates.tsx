import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { ExchangeRate, SupportedCurrency } from '@/types/database';

// Fallback rates in case database is empty or fetch fails
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  BRL: { BRL: 1, USD: 0.17, EUR: 0.15 },
  USD: { BRL: 5.80, USD: 1, EUR: 0.92 },
  EUR: { BRL: 6.30, USD: 1.09, EUR: 1 },
};

export const useExchangeRates = () => {
  const { user } = useAuth();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false); // Start false - no loading until authenticated
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchRates = useCallback(async () => {
    // Skip if already fetched
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('updated_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (data && data.length > 0) {
        setRates(data as ExchangeRate[]);
        // Get the most recent update time
        const mostRecent = data.reduce((latest, rate) => {
          const rateTime = new Date(rate.updated_at || 0);
          return rateTime > latest ? rateTime : latest;
        }, new Date(0));
        setLastUpdate(mostRecent);
      }
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: Only fetch exchange rates when user is authenticated
    // This prevents Supabase calls on first load for public pages
    if (!user) {
      hasFetched.current = false; // Reset so we fetch when user logs in
      return;
    }

    // User is authenticated, fetch rates (deferred for performance)
    const win = window as typeof globalThis & { 
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(() => fetchRates(), { timeout: 5000 });
    } else {
      setTimeout(fetchRates, 1000);
    }
  }, [user, fetchRates]);

  const getRate = useCallback((from: SupportedCurrency, to: SupportedCurrency): number => {
    if (from === to) return 1;

    // Try to find rate in database
    const rate = rates.find(
      r => r.base_currency === from && r.target_currency === to
    );

    if (rate) {
      return rate.rate;
    }

    // Fallback to hardcoded rates
    return FALLBACK_RATES[from]?.[to] ?? 1;
  }, [rates]);

  const convertCurrency = useCallback((
    amount: number,
    from: SupportedCurrency,
    to: SupportedCurrency
  ): number => {
    const rate = getRate(from, to);
    return Number((amount * rate).toFixed(2));
  }, [getRate]);

  const refreshRates = useCallback(async () => {
    try {
      setLoading(true);
      // Call the edge function to refresh rates
      const { data, error: fnError } = await supabase.functions.invoke('update-exchange-rates');
      
      if (fnError) {
        throw fnError;
      }

      console.log('Exchange rates refreshed:', data);
      
      // Fetch updated rates from database
      await fetchRates();
    } catch (err) {
      console.error('Error refreshing exchange rates:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh rates');
    }
  }, [fetchRates]);

  const isStale = useCallback((): boolean => {
    if (!lastUpdate) return true;
    const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate > 48; // Consider stale after 48 hours
  }, [lastUpdate]);

  return {
    rates,
    loading,
    error,
    lastUpdate,
    getRate,
    convertCurrency,
    refreshRates,
    isStale,
  };
};
