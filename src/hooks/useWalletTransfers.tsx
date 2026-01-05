import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWallets } from '@/hooks/useWallets';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { SupportedCurrency } from '@/types/database';

export interface WalletTransfer {
  id: string;
  user_id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  currency: string;
  description: string | null;
  date: string;
  created_at: string;
}

export interface ScheduledTransfer {
  id: string;
  user_id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  currency: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week: number | null;
  day_of_month: number | null;
  next_run_date: string;
  last_run_date: string | null;
  is_active: boolean;
  total_occurrences: number | null;
  remaining_occurrences: number | null;
  created_at: string;
}

export interface CreateTransferData {
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  currency: SupportedCurrency;
  description?: string;
  date: string;
  converted_amount?: number;
}

export interface CreateScheduledTransferData {
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  currency: SupportedCurrency;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week?: number;
  day_of_month?: number;
  total_occurrences?: number | null;
}

export interface TransferFilters {
  startDate?: Date;
  endDate?: Date;
  walletId?: string;
}

export const useWalletTransfers = () => {
  const { user } = useAuth();
  const { wallets, refetch: refetchWallets } = useWallets();
  const { convertCurrency } = useExchangeRates();
  const { t } = useTranslation();
  const [transfers, setTransfers] = useState<WalletTransfer[]>([]);
  const [scheduledTransfers, setScheduledTransfers] = useState<ScheduledTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TransferFilters>({});

  const fetchTransfers = useCallback(async (customFilters?: TransferFilters) => {
    if (!user) return;

    try {
      let query = supabase
        .from('wallet_transfers')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      const activeFilters = customFilters || filters;

      if (activeFilters.startDate) {
        query = query.gte('date', activeFilters.startDate.toISOString().split('T')[0]);
      }
      if (activeFilters.endDate) {
        query = query.lte('date', activeFilters.endDate.toISOString().split('T')[0]);
      }
      if (activeFilters.walletId) {
        query = query.or(`from_wallet_id.eq.${activeFilters.walletId},to_wallet_id.eq.${activeFilters.walletId}`);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setTransfers(data || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  const fetchScheduledTransfers = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('scheduled_transfers')
        .select('*')
        .eq('user_id', user.id)
        .order('next_run_date', { ascending: true });

      if (error) throw error;
      setScheduledTransfers((data || []) as ScheduledTransfer[]);
    } catch (error) {
      console.error('Error fetching scheduled transfers:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchTransfers();
    fetchScheduledTransfers();
  }, [fetchTransfers, fetchScheduledTransfers]);

  const createTransfer = async (transferData: CreateTransferData): Promise<boolean> => {
    if (!user) return false;

    const { from_wallet_id, to_wallet_id, amount, currency, description, date, converted_amount } = transferData;

    if (from_wallet_id === to_wallet_id) {
      toast.error(t('wallets.sameWalletError'));
      return false;
    }

    const fromWallet = wallets.find(w => w.id === from_wallet_id);
    const toWallet = wallets.find(w => w.id === to_wallet_id);

    if (!fromWallet || !toWallet) {
      toast.error(t('common.error'));
      return false;
    }

    // Calculate amount to add to destination wallet (with conversion if needed)
    const amountToAdd = converted_amount || 
      (fromWallet.currency !== toWallet.currency 
        ? convertCurrency(amount, fromWallet.currency, toWallet.currency)
        : amount);

    try {
      const { error: transferError } = await supabase
        .from('wallet_transfers')
        .insert({
          user_id: user.id,
          from_wallet_id,
          to_wallet_id,
          amount,
          currency,
          description: description || null,
          date,
        });

      if (transferError) throw transferError;

      // Subtract from source wallet
      const { error: fromError } = await supabase
        .from('wallets')
        .update({ 
          current_balance: fromWallet.current_balance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', from_wallet_id);

      if (fromError) throw fromError;

      // Add to destination wallet (with conversion)
      const { error: toError } = await supabase
        .from('wallets')
        .update({ 
          current_balance: toWallet.current_balance + amountToAdd,
          updated_at: new Date().toISOString()
        })
        .eq('id', to_wallet_id);

      if (toError) throw toError;

      toast.success(t('wallets.transferSuccess'));
      
      await Promise.all([fetchTransfers(), refetchWallets()]);
      
      return true;
    } catch (error) {
      console.error('Error creating transfer:', error);
      toast.error(t('common.error'));
      return false;
    }
  };

  const createScheduledTransfer = async (data: CreateScheduledTransferData): Promise<boolean> => {
    if (!user) return false;

    const { from_wallet_id, to_wallet_id, amount, currency, description, frequency, day_of_week, day_of_month } = data;

    if (from_wallet_id === to_wallet_id) {
      toast.error(t('wallets.sameWalletError'));
      return false;
    }

    // Calculate next run date
    const today = new Date();
    let nextRunDate = new Date();

    if (frequency === 'daily') {
      nextRunDate.setDate(today.getDate() + 1);
    } else if (frequency === 'weekly' && day_of_week !== undefined) {
      const daysUntilNext = (day_of_week - today.getDay() + 7) % 7 || 7;
      nextRunDate.setDate(today.getDate() + daysUntilNext);
    } else if (frequency === 'monthly' && day_of_month !== undefined) {
      nextRunDate.setDate(day_of_month);
      if (nextRunDate <= today) {
        nextRunDate.setMonth(nextRunDate.getMonth() + 1);
      }
    }

    try {
      const { error } = await supabase
        .from('scheduled_transfers')
        .insert({
          user_id: user.id,
          from_wallet_id,
          to_wallet_id,
          amount,
          currency,
          description: description || null,
          frequency,
          day_of_week: frequency === 'weekly' ? day_of_week : null,
          day_of_month: frequency === 'monthly' ? day_of_month : null,
          next_run_date: nextRunDate.toISOString().split('T')[0],
          total_occurrences: data.total_occurrences || null,
          remaining_occurrences: data.total_occurrences || null,
        });

      if (error) throw error;

      toast.success(t('wallets.scheduledTransferCreated'));
      await fetchScheduledTransfers();
      
      return true;
    } catch (error) {
      console.error('Error creating scheduled transfer:', error);
      toast.error(t('common.error'));
      return false;
    }
  };

  const toggleScheduledTransfer = async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scheduled_transfers')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast.success(isActive ? t('wallets.scheduledTransferActivated') : t('wallets.scheduledTransferPaused'));
      await fetchScheduledTransfers();
      
      return true;
    } catch (error) {
      console.error('Error toggling scheduled transfer:', error);
      toast.error(t('common.error'));
      return false;
    }
  };

  const deleteScheduledTransfer = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scheduled_transfers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success(t('wallets.scheduledTransferDeleted'));
      await fetchScheduledTransfers();
      
      return true;
    } catch (error) {
      console.error('Error deleting scheduled transfer:', error);
      toast.error(t('common.error'));
      return false;
    }
  };

  const getWalletName = (walletId: string): string => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet?.name || 'Unknown';
  };

  const getWalletIcon = (walletId: string): string => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet?.icon || '💳';
  };

  const getWallet = (walletId: string) => {
    return wallets.find(w => w.id === walletId);
  };

  const applyFilters = (newFilters: TransferFilters) => {
    setFilters(newFilters);
    fetchTransfers(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    fetchTransfers({});
  };

  return {
    transfers,
    scheduledTransfers,
    loading,
    filters,
    createTransfer,
    createScheduledTransfer,
    toggleScheduledTransfer,
    deleteScheduledTransfer,
    fetchTransfers,
    getWalletName,
    getWalletIcon,
    getWallet,
    applyFilters,
    clearFilters,
  };
};
