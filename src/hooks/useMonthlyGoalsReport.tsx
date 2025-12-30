import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/contexts/CurrencyContext';
import { SupportedCurrency } from '@/types/database';

export interface CategoryPerformance {
  category: string;
  budgetLimit: number;
  spent: number;
  percentage: number;
  status: 'excellent' | 'good' | 'warning' | 'over';
  previousMonthSpent?: number;
  changeFromLastMonth?: number;
}

export interface MonthlyReportData {
  month: string;
  year: number;
  totalBudget: number;
  totalSpent: number;
  adherenceRate: number;
  categoriesWithinBudget: number;
  categoriesOverBudget: number;
  bestCategory: CategoryPerformance | null;
  worstCategory: CategoryPerformance | null;
  categories: CategoryPerformance[];
}

export const useMonthlyGoalsReport = () => {
  const { user } = useAuth();
  const { convertToUserCurrency } = useCurrency();
  const [report, setReport] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch goals
      const { data: goals } = await supabase
        .from('category_goals')
        .select('*')
        .eq('user_id', user.id);

      if (!goals || goals.length === 0) {
        setReport(null);
        return;
      }

      // Current month dates
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthStartStr = currentMonthStart.toISOString().split('T')[0];

      // Previous month dates
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const prevMonthStartStr = prevMonthStart.toISOString().split('T')[0];
      const prevMonthEndStr = prevMonthEnd.toISOString().split('T')[0];

      // Fetch current month transactions with currency
      const { data: currentTx } = await supabase
        .from('transactions')
        .select('category, amount, currency')
        .eq('user_id', user.id)
        .eq('type', 'EXPENSE')
        .gte('date', currentMonthStartStr);

      // Fetch previous month transactions with currency
      const { data: prevTx } = await supabase
        .from('transactions')
        .select('category, amount, currency')
        .eq('user_id', user.id)
        .eq('type', 'EXPENSE')
        .gte('date', prevMonthStartStr)
        .lte('date', prevMonthEndStr);

      // Calculate spending by category with currency conversion
      const currentSpending: Record<string, number> = {};
      const prevSpending: Record<string, number> = {};

      currentTx?.forEach(tx => {
        const txCurrency = (tx.currency || 'BRL') as SupportedCurrency;
        const convertedAmount = convertToUserCurrency(Number(tx.amount), txCurrency);
        currentSpending[tx.category] = (currentSpending[tx.category] || 0) + convertedAmount;
      });

      prevTx?.forEach(tx => {
        const txCurrency = (tx.currency || 'BRL') as SupportedCurrency;
        const convertedAmount = convertToUserCurrency(Number(tx.amount), txCurrency);
        prevSpending[tx.category] = (prevSpending[tx.category] || 0) + convertedAmount;
      });

      // Build category performances
      const categories: CategoryPerformance[] = goals.map(goal => {
        const spent = currentSpending[goal.category] || 0;
        const budgetLimit = Number(goal.budget_limit);
        const percentage = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;
        const previousMonthSpent = prevSpending[goal.category] || 0;
        const changeFromLastMonth = previousMonthSpent > 0 
          ? ((spent - previousMonthSpent) / previousMonthSpent) * 100 
          : 0;

        let status: CategoryPerformance['status'];
        if (percentage <= 50) status = 'excellent';
        else if (percentage <= 80) status = 'good';
        else if (percentage < 100) status = 'warning';
        else status = 'over';

        return {
          category: goal.category,
          budgetLimit,
          spent,
          percentage,
          status,
          previousMonthSpent,
          changeFromLastMonth,
        };
      });

      // Sort to find best and worst
      const sortedByPercentage = [...categories].sort((a, b) => a.percentage - b.percentage);
      const bestCategory = sortedByPercentage[0] || null;
      const worstCategory = sortedByPercentage[sortedByPercentage.length - 1] || null;

      // Calculate totals
      const totalBudget = categories.reduce((sum, c) => sum + c.budgetLimit, 0);
      const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
      const adherenceRate = totalBudget > 0 
        ? Math.round(((totalBudget - Math.max(0, totalSpent - totalBudget)) / totalBudget) * 100)
        : 100;
      const categoriesWithinBudget = categories.filter(c => c.percentage <= 100).length;
      const categoriesOverBudget = categories.filter(c => c.percentage > 100).length;

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

      setReport({
        month: monthNames[now.getMonth()],
        year: now.getFullYear(),
        totalBudget,
        totalSpent,
        adherenceRate: Math.min(100, adherenceRate),
        categoriesWithinBudget,
        categoriesOverBudget,
        bestCategory,
        worstCategory,
        categories: sortedByPercentage,
      });
    } catch (error) {
      console.error('Error fetching monthly report:', error);
    } finally {
      setLoading(false);
    }
  }, [user, convertToUserCurrency]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { report, loading, refetch: fetchReport };
};
