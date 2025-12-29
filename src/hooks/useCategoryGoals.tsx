import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { SupportedCurrency } from '@/types/database';
import { useCurrency } from '@/contexts/CurrencyContext';

export interface CategoryGoal {
  id: string;
  user_id: string;
  category: string;
  budget_limit: number;
  created_at: string;
  spent?: number;
}

export const useCategoryGoals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { convertToUserCurrency } = useCurrency();
  const [goals, setGoals] = useState<CategoryGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Archive previous month's goals if needed (runs at start of new month)
      const today = new Date();
      const isFirstWeekOfMonth = today.getDate() <= 7;
      if (isFirstWeekOfMonth) {
        try {
          await supabase.rpc('archive_monthly_goals', { p_user_id: user.id });
        } catch (archiveError) {
          // Silently fail - archiving is not critical
          console.log('Goal archiving skipped or already done');
        }
      }
      
      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('category_goals')
        .select('*')
        .eq('user_id', user.id);

      if (goalsError) throw goalsError;

      // Fetch current month's spending per category
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('category, amount, currency')
        .eq('user_id', user.id)
        .eq('type', 'EXPENSE')
        .gte('date', monthStartStr);

      if (txError) throw txError;

      // Calculate spent per category with currency conversion
      const spentByCategory: Record<string, number> = {};
      transactions?.forEach(tx => {
        const txCurrency = (tx.currency || 'BRL') as SupportedCurrency;
        const convertedAmount = convertToUserCurrency(Number(tx.amount), txCurrency);
        spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + convertedAmount;
      });

      // Merge goals with spending data
      const goalsWithSpending = (goalsData || []).map(goal => ({
        ...goal,
        budget_limit: Number(goal.budget_limit),
        spent: spentByCategory[goal.category] || 0,
      }));

      setGoals(goalsWithSpending);
    } catch (error) {
      console.error('Error fetching category goals:', error);
      toast({
        title: t('common.error'),
        description: t('categoryGoals.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, t, convertToUserCurrency]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = async (category: string, budgetLimit: number) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('category_goals')
        .insert({
          user_id: user.id,
          category,
          budget_limit: budgetLimit,
        });

      if (error) throw error;

      await fetchGoals();
      toast({
        title: t('common.success'),
        description: t('categoryGoals.addSuccess'),
      });
      return { error: null };
    } catch (error) {
      console.error('Error adding goal:', error);
      toast({
        title: t('common.error'),
        description: t('categoryGoals.addError'),
        variant: 'destructive',
      });
      return { error: error as Error };
    }
  };

  const updateGoal = async (id: string, budgetLimit: number) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('category_goals')
        .update({ budget_limit: budgetLimit })
        .eq('id', id);

      if (error) throw error;

      await fetchGoals();
      toast({
        title: t('common.success'),
        description: t('categoryGoals.updateSuccess'),
      });
      return { error: null };
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: t('common.error'),
        description: t('categoryGoals.updateError'),
        variant: 'destructive',
      });
      return { error: error as Error };
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('category_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchGoals();
      toast({
        title: t('common.success'),
        description: t('categoryGoals.deleteSuccess'),
      });
      return { error: null };
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: t('common.error'),
        description: t('categoryGoals.deleteError'),
        variant: 'destructive',
      });
      return { error: error as Error };
    }
  };

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals,
  };
};
