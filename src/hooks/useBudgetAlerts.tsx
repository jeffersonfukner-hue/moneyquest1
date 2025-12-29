import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useSound } from '@/contexts/SoundContext';

export type BudgetAlertType = 'warning' | 'critical' | null;

interface BudgetAlertResult {
  alertType: BudgetAlertType;
  category: string;
  percentage: number;
  spent: number;
  limit: number;
}

export const useBudgetAlerts = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { playSound } = useSound();

  const checkBudgetAlert = useCallback(async (
    userId: string,
    category: string,
    newAmount: number
  ): Promise<BudgetAlertResult | null> => {
    try {
      // Check if category has a goal
      const { data: goal } = await supabase
        .from('category_goals')
        .select('budget_limit')
        .eq('user_id', userId)
        .eq('category', category)
        .maybeSingle();

      if (!goal) return null;

      const budgetLimit = Number(goal.budget_limit);

      // Get current month's spending for this category (before the new transaction)
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('category', category)
        .eq('type', 'EXPENSE')
        .gte('date', monthStartStr);

      const previousSpent = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
      const previousPercentage = (previousSpent / budgetLimit) * 100;
      
      // Calculate new spending including this transaction
      const newSpent = previousSpent + newAmount;
      const newPercentage = (newSpent / budgetLimit) * 100;

      // Check if we just crossed a threshold
      let alertType: BudgetAlertType = null;

      if (previousPercentage < 100 && newPercentage >= 100) {
        alertType = 'critical';
      } else if (previousPercentage < 80 && newPercentage >= 80) {
        alertType = 'warning';
      }

      if (alertType) {
        return {
          alertType,
          category,
          percentage: Math.round(newPercentage),
          spent: newSpent,
          limit: budgetLimit,
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking budget alert:', error);
      return null;
    }
  }, []);

  const showBudgetAlert = useCallback((alert: BudgetAlertResult) => {
    if (alert.alertType === 'critical') {
      playSound('levelUp'); // Use existing sound for critical alerts
      toast({
        title: t('categoryGoals.alert100Title'),
        description: t('categoryGoals.alert100', { 
          category: alert.category,
          percentage: alert.percentage 
        }),
        variant: 'destructive',
      });
    } else if (alert.alertType === 'warning') {
      playSound('xpGain'); // Use existing sound for warnings
      toast({
        title: t('categoryGoals.alert80Title'),
        description: t('categoryGoals.alert80', { 
          category: alert.category,
          percentage: alert.percentage 
        }),
      });
    }
  }, [toast, t, playSound]);

  return { checkBudgetAlert, showBudgetAlert };
};
