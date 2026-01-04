import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export type DateRange = '7d' | '30d' | '90d' | 'custom';

export interface TrafficAnalytics {
  total_views: number;
  unique_users: number;
  unique_sessions: number;
  avg_pages_per_session: number;
  avg_time_on_page: number;
  bounce_rate: number;
  views_by_day: Array<{ date: string; views: number; sessions: number }>;
  views_by_hour: Array<{ hour: number; views: number }>;
  views_by_device: Array<{ device: string; views: number }>;
}

export interface TopPage {
  page_url: string;
  page_title: string;
  total_views: number;
  unique_users: number;
  avg_time: number;
  exit_rate: number;
}

export interface TrafficSource {
  by_source: Array<{ source: string; views: number }>;
  by_utm: Array<{ utm_source: string; utm_medium: string; utm_campaign: string; views: number }>;
  by_country: Array<{ country: string; views: number }>;
  by_language: Array<{ language: string; views: number }>;
}

export interface TrafficError {
  page_url: string;
  error_code: number;
  origin: string;
  occurrences: number;
  last_occurrence: string;
}

export interface SuspiciousAccess {
  high_frequency: Array<{
    session_id: string;
    request_count: number;
    first_request: string;
    last_request: string;
  }>;
  admin_attempts: Array<{
    page_url: string;
    session_id: string;
    attempts: number;
    last_attempt: string;
  }>;
  unusual_origins: Array<{
    country: string;
    views: number;
    sessions: number;
  }>;
}

export const useTrafficAnalytics = () => {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [customDates, setCustomDates] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });

  const getDateParams = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case '30d':
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      case '90d':
        return { start: startOfDay(subDays(now, 90)), end: endOfDay(now) };
      case 'custom':
        return { start: startOfDay(customDates.start), end: endOfDay(customDates.end) };
    }
  };

  const { start, end } = getDateParams();

  const analyticsQuery = useQuery({
    queryKey: ['traffic-analytics', dateRange, start.toISOString(), end.toISOString()],
    queryFn: async (): Promise<TrafficAnalytics> => {
      const { data, error } = await supabase.rpc('admin_get_traffic_analytics', {
        p_start_date: start.toISOString(),
        p_end_date: end.toISOString(),
      });
      if (error) throw error;
      return data as unknown as TrafficAnalytics;
    },
  });

  const topPagesQuery = useQuery({
    queryKey: ['traffic-top-pages', dateRange, start.toISOString(), end.toISOString()],
    queryFn: async (): Promise<TopPage[]> => {
      const { data, error } = await supabase.rpc('admin_get_top_pages', {
        p_start_date: start.toISOString(),
        p_end_date: end.toISOString(),
        p_limit: 50,
      });
      if (error) throw error;
      return (data as unknown as TopPage[]) || [];
    },
  });

  const sourcesQuery = useQuery({
    queryKey: ['traffic-sources', dateRange, start.toISOString(), end.toISOString()],
    queryFn: async (): Promise<TrafficSource> => {
      const { data, error } = await supabase.rpc('admin_get_traffic_sources', {
        p_start_date: start.toISOString(),
        p_end_date: end.toISOString(),
      });
      if (error) throw error;
      return data as unknown as TrafficSource;
    },
  });

  const errorsQuery = useQuery({
    queryKey: ['traffic-errors', dateRange, start.toISOString(), end.toISOString()],
    queryFn: async (): Promise<TrafficError[]> => {
      const { data, error } = await supabase.rpc('admin_get_traffic_errors', {
        p_start_date: start.toISOString(),
        p_end_date: end.toISOString(),
      });
      if (error) throw error;
      return (data as unknown as TrafficError[]) || [];
    },
  });

  const suspiciousQuery = useQuery({
    queryKey: ['traffic-suspicious', dateRange],
    queryFn: async (): Promise<SuspiciousAccess> => {
      const { data, error } = await supabase.rpc('admin_get_suspicious_access', {
        p_start_date: subDays(new Date(), 7).toISOString(),
        p_end_date: new Date().toISOString(),
      });
      if (error) throw error;
      return data as unknown as SuspiciousAccess;
    },
  });

  return {
    dateRange,
    setDateRange,
    customDates,
    setCustomDates,
    analytics: analyticsQuery.data,
    topPages: topPagesQuery.data,
    sources: sourcesQuery.data,
    errors: errorsQuery.data,
    suspicious: suspiciousQuery.data,
    isLoading: analyticsQuery.isLoading || topPagesQuery.isLoading || sourcesQuery.isLoading,
    isError: analyticsQuery.isError,
    refetch: () => {
      analyticsQuery.refetch();
      topPagesQuery.refetch();
      sourcesQuery.refetch();
      errorsQuery.refetch();
      suspiciousQuery.refetch();
    },
  };
};
