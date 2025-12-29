import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface GoalHistoryRecord {
  id: string;
  user_id: string;
  goal_id: string | null;
  category: string;
  budget_limit: number;
  spent: number;
  percentage_used: number;
  status: 'excellent' | 'within_budget' | 'over_budget';
  period_month: number;
  period_year: number;
  created_at: string;
}

export interface CategoryTrend {
  category: string;
  history: GoalHistoryRecord[];
  averagePercentage: number;
  trend: 'improving' | 'declining' | 'stable';
  monthsTracked: number;
}

export const useGoalHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<GoalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('category_goal_history')
        .select('*')
        .eq('user_id', user.id)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false })
        .limit(36); // Last 3 years max

      if (error) throw error;

      setHistory((data || []).map(record => ({
        ...record,
        budget_limit: Number(record.budget_limit),
        spent: Number(record.spent),
        percentage_used: Number(record.percentage_used),
      })) as GoalHistoryRecord[]);
    } catch (error) {
      console.error('Error fetching goal history:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Archive current month's goals (called at month start or manually)
  const archiveCurrentMonth = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('archive_monthly_goals', {
        p_user_id: user.id
      });

      if (error) throw error;
      await fetchHistory();
    } catch (error) {
      console.error('Error archiving goals:', error);
    }
  }, [user, fetchHistory]);

  // Get history for a specific category
  const getCategoryHistory = (category: string): GoalHistoryRecord[] => {
    return history.filter(h => h.category === category);
  };

  // Get trends for all categories
  const getCategoryTrends = (): CategoryTrend[] => {
    const categoryMap: Record<string, GoalHistoryRecord[]> = {};
    
    history.forEach(record => {
      if (!categoryMap[record.category]) {
        categoryMap[record.category] = [];
      }
      categoryMap[record.category].push(record);
    });

    return Object.entries(categoryMap).map(([category, records]) => {
      const sortedRecords = records.sort((a, b) => {
        if (a.period_year !== b.period_year) return b.period_year - a.period_year;
        return b.period_month - a.period_month;
      });

      const avgPercentage = records.reduce((sum, r) => sum + r.percentage_used, 0) / records.length;
      
      // Calculate trend based on recent vs older performance
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (sortedRecords.length >= 2) {
        const recentAvg = sortedRecords.slice(0, Math.ceil(sortedRecords.length / 2))
          .reduce((sum, r) => sum + r.percentage_used, 0) / Math.ceil(sortedRecords.length / 2);
        const olderAvg = sortedRecords.slice(Math.ceil(sortedRecords.length / 2))
          .reduce((sum, r) => sum + r.percentage_used, 0) / Math.floor(sortedRecords.length / 2);
        
        const change = recentAvg - olderAvg;
        if (change < -10) trend = 'improving'; // Lower percentage = better
        else if (change > 10) trend = 'declining';
      }

      return {
        category,
        history: sortedRecords,
        averagePercentage: Math.round(avgPercentage * 10) / 10,
        trend,
        monthsTracked: records.length,
      };
    });
  };

  // Get summary stats
  const getSummaryStats = () => {
    if (history.length === 0) return null;

    const totalRecords = history.length;
    const excellentCount = history.filter(h => h.status === 'excellent').length;
    const withinBudgetCount = history.filter(h => h.status === 'within_budget').length;
    const overBudgetCount = history.filter(h => h.status === 'over_budget').length;

    return {
      totalRecords,
      excellentCount,
      withinBudgetCount,
      overBudgetCount,
      successRate: Math.round(((excellentCount + withinBudgetCount) / totalRecords) * 100),
    };
  };

  return {
    history,
    loading,
    fetchHistory,
    archiveCurrentMonth,
    getCategoryHistory,
    getCategoryTrends,
    getSummaryStats,
  };
};
