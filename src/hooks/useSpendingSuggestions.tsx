import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CategorySuggestion {
  category: string;
  averageSpending: number;
  highestMonth: number;
  lowestMonth: number;
  monthsAnalyzed: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  suggestions: {
    conservative: number;
    balanced: number;
    flexible: number;
  };
}

export const useSpendingSuggestions = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Record<string, CategorySuggestion>>({});
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get transactions from the last 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const startDate = threeMonthsAgo.toISOString().split('T')[0];

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('category, amount, date')
        .eq('user_id', user.id)
        .eq('type', 'EXPENSE')
        .gte('date', startDate)
        .order('date', { ascending: true });

      if (error) throw error;

      // Group by category and month
      const categoryMonthlySpending: Record<string, Record<string, number>> = {};

      transactions?.forEach(tx => {
        const monthKey = tx.date.substring(0, 7); // YYYY-MM
        if (!categoryMonthlySpending[tx.category]) {
          categoryMonthlySpending[tx.category] = {};
        }
        categoryMonthlySpending[tx.category][monthKey] = 
          (categoryMonthlySpending[tx.category][monthKey] || 0) + Number(tx.amount);
      });

      // Calculate suggestions for each category
      const newSuggestions: Record<string, CategorySuggestion> = {};

      Object.entries(categoryMonthlySpending).forEach(([category, monthlyData]) => {
        const months = Object.keys(monthlyData).sort();
        const values = months.map(m => monthlyData[m]);
        
        if (values.length === 0) return;

        const average = values.reduce((a, b) => a + b, 0) / values.length;
        const highest = Math.max(...values);
        const lowest = Math.min(...values);

        // Calculate trend
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (values.length >= 2) {
          const recentAvg = values.slice(-2).reduce((a, b) => a + b, 0) / 2;
          const olderAvg = values.slice(0, -1).reduce((a, b) => a + b, 0) / Math.max(values.length - 1, 1);
          const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
          
          if (changePercent > 10) trend = 'increasing';
          else if (changePercent < -10) trend = 'decreasing';
        }

        // Round to nearest 5 for cleaner numbers
        const roundTo5 = (n: number) => Math.ceil(n / 5) * 5;

        newSuggestions[category] = {
          category,
          averageSpending: average,
          highestMonth: highest,
          lowestMonth: lowest,
          monthsAnalyzed: values.length,
          trend,
          suggestions: {
            conservative: roundTo5(average),
            balanced: roundTo5(average * 1.1),
            flexible: roundTo5(average * 1.25),
          },
        };
      });

      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error fetching spending suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const getSuggestionForCategory = (category: string): CategorySuggestion | null => {
    return suggestions[category] || null;
  };

  // Get categories that have spending history but no goals
  const getCategoriesWithoutGoals = (existingGoalCategories: string[]): CategorySuggestion[] => {
    return Object.values(suggestions).filter(
      s => !existingGoalCategories.includes(s.category)
    );
  };

  return {
    suggestions,
    loading,
    getSuggestionForCategory,
    getCategoriesWithoutGoals,
    refetch: fetchSuggestions,
  };
};
