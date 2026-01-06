import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { SupportedCurrency } from '@/types/database';

export interface ScheduledTransaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  currency: string;
  wallet_id: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  day_of_week: number | null;
  day_of_month: number | null;
  month_of_year: number | null;
  next_run_date: string;
  last_run_date: string | null;
  is_active: boolean;
  total_occurrences: number | null;
  remaining_occurrences: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduledTransactionData {
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  currency: SupportedCurrency;
  wallet_id?: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  day_of_week?: number;
  day_of_month?: number;
  month_of_year?: number;
  total_occurrences?: number | null;
}

export interface UpdateScheduledTransactionData extends Partial<CreateScheduledTransactionData> {
  id: string;
  remaining_occurrences?: number | null;
}

export const useScheduledTransactions = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [scheduledTransactions, setScheduledTransactions] = useState<ScheduledTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduledTransactions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scheduled_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('next_run_date', { ascending: true });

      if (error) throw error;
      console.log('[ScheduledTransactions] Fetched:', data?.length, 'items');
      setScheduledTransactions((data || []) as ScheduledTransaction[]);
    } catch (error) {
      console.error('Error fetching scheduled transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchScheduledTransactions();
  }, [fetchScheduledTransactions]);

  const createScheduledTransaction = async (data: CreateScheduledTransactionData): Promise<boolean> => {
    if (!user) return false;

    // Calculate next run date
    const today = new Date();
    let nextRunDate = new Date();

    if (data.frequency === 'daily') {
      nextRunDate.setDate(today.getDate() + 1);
    } else if (data.frequency === 'weekly' && data.day_of_week !== undefined) {
      const daysUntilNext = (data.day_of_week - today.getDay() + 7) % 7 || 7;
      nextRunDate.setDate(today.getDate() + daysUntilNext);
    } else if (data.frequency === 'monthly' && data.day_of_month !== undefined) {
      nextRunDate.setDate(data.day_of_month);
      if (nextRunDate <= today) {
        nextRunDate.setMonth(nextRunDate.getMonth() + 1);
      }
    } else if (data.frequency === 'yearly' && data.day_of_month !== undefined && data.month_of_year !== undefined) {
      nextRunDate.setMonth(data.month_of_year - 1);
      nextRunDate.setDate(data.day_of_month);
      if (nextRunDate <= today) {
        nextRunDate.setFullYear(nextRunDate.getFullYear() + 1);
      }
    }

    try {
      const { error } = await supabase
        .from('scheduled_transactions')
        .insert({
          user_id: user.id,
          description: data.description,
          amount: data.amount,
          type: data.type,
          category: data.category,
          currency: data.currency,
          wallet_id: data.wallet_id || null,
          frequency: data.frequency,
          day_of_week: data.frequency === 'weekly' ? data.day_of_week : null,
          day_of_month: ['monthly', 'yearly'].includes(data.frequency) ? data.day_of_month : null,
          month_of_year: data.frequency === 'yearly' ? data.month_of_year : null,
          next_run_date: nextRunDate.toISOString().split('T')[0],
          total_occurrences: data.total_occurrences || null,
          remaining_occurrences: data.total_occurrences || null,
        });

      if (error) throw error;

      toast.success(t('scheduled.transactionCreated'));
      await fetchScheduledTransactions();
      
      return true;
    } catch (error) {
      console.error('Error creating scheduled transaction:', error);
      toast.error(t('common.error'));
      return false;
    }
  };

  const updateScheduledTransaction = async (data: UpdateScheduledTransactionData): Promise<boolean> => {
    if (!user) return false;

    // Calculate next run date if frequency changed
    const today = new Date();
    let nextRunDate: Date | null = null;

    if (data.frequency) {
      nextRunDate = new Date();
      if (data.frequency === 'daily') {
        nextRunDate.setDate(today.getDate() + 1);
      } else if (data.frequency === 'weekly' && data.day_of_week !== undefined) {
        const daysUntilNext = (data.day_of_week - today.getDay() + 7) % 7 || 7;
        nextRunDate.setDate(today.getDate() + daysUntilNext);
      } else if (data.frequency === 'monthly' && data.day_of_month !== undefined) {
        nextRunDate.setDate(data.day_of_month);
        if (nextRunDate <= today) {
          nextRunDate.setMonth(nextRunDate.getMonth() + 1);
        }
      } else if (data.frequency === 'yearly' && data.day_of_month !== undefined && data.month_of_year !== undefined) {
        nextRunDate.setMonth(data.month_of_year - 1);
        nextRunDate.setDate(data.day_of_month);
        if (nextRunDate <= today) {
          nextRunDate.setFullYear(nextRunDate.getFullYear() + 1);
        }
      }
    }

    try {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (data.description !== undefined) updateData.description = data.description;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.wallet_id !== undefined) updateData.wallet_id = data.wallet_id || null;
      if (data.frequency !== undefined) {
        updateData.frequency = data.frequency;
        updateData.day_of_week = data.frequency === 'weekly' ? data.day_of_week : null;
        updateData.day_of_month = ['monthly', 'yearly'].includes(data.frequency) ? data.day_of_month : null;
        updateData.month_of_year = data.frequency === 'yearly' ? data.month_of_year : null;
        if (nextRunDate) {
          updateData.next_run_date = nextRunDate.toISOString().split('T')[0];
        }
      }
      if (data.total_occurrences !== undefined) {
        updateData.total_occurrences = data.total_occurrences;
        updateData.remaining_occurrences = data.total_occurrences;
      }

      const { error } = await supabase
        .from('scheduled_transactions')
        .update(updateData)
        .eq('id', data.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(t('scheduled.transactionUpdated'));
      await fetchScheduledTransactions();
      
      return true;
    } catch (error) {
      console.error('Error updating scheduled transaction:', error);
      toast.error(t('common.error'));
      return false;
    }
  };

  const toggleScheduledTransaction = async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scheduled_transactions')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast.success(isActive ? t('scheduled.transactionActivated') : t('scheduled.transactionPaused'));
      await fetchScheduledTransactions();
      
      return true;
    } catch (error) {
      console.error('Error toggling scheduled transaction:', error);
      toast.error(t('common.error'));
      return false;
    }
  };

  const deleteScheduledTransaction = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scheduled_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success(t('scheduled.transactionDeleted'));
      await fetchScheduledTransactions();
      
      return true;
    } catch (error) {
      console.error('Error deleting scheduled transaction:', error);
      toast.error(t('common.error'));
      return false;
    }
  };

  return {
    scheduledTransactions,
    loading,
    createScheduledTransaction,
    updateScheduledTransaction,
    toggleScheduledTransaction,
    deleteScheduledTransaction,
    fetchScheduledTransactions,
  };
};
