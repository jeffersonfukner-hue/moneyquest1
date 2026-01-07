import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWallets } from '@/hooks/useWallets';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { SupportedCurrency } from '@/types/database';
import {
  emitTransfersChanged,
  emitWalletsChanged,
  onTransfersChanged,
} from '@/lib/appEvents';

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
  const { wallets, refetch: refetchWallets, recalculateBalance } = useWallets();
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

  // Keep multiple instances of this hook in sync (dialogs vs list cards)
  useEffect(() => {
    return onTransfersChanged(() => {
      fetchTransfers();
      fetchScheduledTransfers();
    });
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

      // Recalculate both wallets to avoid drift from stale client balances
      await Promise.all([
        recalculateBalance(from_wallet_id),
        recalculateBalance(to_wallet_id),
      ]);

      toast.success(t('wallets.transferSuccess'));

      await Promise.all([fetchTransfers(), refetchWallets()]);

      // Notify the rest of the app (Wallets screen, history cards, etc.)
      emitTransfersChanged();
      emitWalletsChanged();

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

      emitTransfersChanged();
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

      emitTransfersChanged();
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

      emitTransfersChanged();
      return true;
    } catch (error) {
      console.error('Error deleting scheduled transfer:', error);
      toast.error(t('common.error'));
      return false;
    }
  };

  const updateTransfer = async (id: string, updates: Partial<WalletTransfer>): Promise<boolean> => {
    if (!user) return false;

    const originalTransfer = transfers.find(t => t.id === id);
    if (!originalTransfer) return false;

    const oldFromWallet = wallets.find(w => w.id === originalTransfer.from_wallet_id);
    const oldToWallet = wallets.find(w => w.id === originalTransfer.to_wallet_id);
    const newFromWallet = wallets.find(w => w.id === (updates.from_wallet_id || originalTransfer.from_wallet_id));
    const newToWallet = wallets.find(w => w.id === (updates.to_wallet_id || originalTransfer.to_wallet_id));

    if (!oldFromWallet || !oldToWallet || !newFromWallet || !newToWallet) {
      toast.error(t('common.error'));
      return false;
    }

    try {
      const newFromWalletId = updates.from_wallet_id || originalTransfer.from_wallet_id;
      const newToWalletId = updates.to_wallet_id || originalTransfer.to_wallet_id;

      // Update the transfer record
      const { error: updateError } = await supabase
        .from('wallet_transfers')
        .update({
          from_wallet_id: updates.from_wallet_id,
          to_wallet_id: updates.to_wallet_id,
          amount: updates.amount,
          currency: updates.currency,
          description: updates.description,
          date: updates.date,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Recalculate all involved wallets (old and new) to avoid drift
      const affectedWalletIds = Array.from(new Set([
        originalTransfer.from_wallet_id,
        originalTransfer.to_wallet_id,
        newFromWalletId,
        newToWalletId,
      ]));

      await Promise.all(affectedWalletIds.map(wid => recalculateBalance(wid)));

      toast.success(t('wallets.transferUpdated', 'Transferência atualizada'));
      await Promise.all([fetchTransfers(), refetchWallets()]);

      emitTransfersChanged();
      emitWalletsChanged();

      return true;
    } catch (error) {
      console.error('Error updating transfer:', error);
      toast.error(t('common.error'));
      return false;
    }
  };

  const deleteTransfer = async (id: string): Promise<boolean> => {
    if (!user) return false;

    const transfer = transfers.find(t => t.id === id);
    if (!transfer) return false;

    const fromWallet = wallets.find(w => w.id === transfer.from_wallet_id);
    const toWallet = wallets.find(w => w.id === transfer.to_wallet_id);

    if (!fromWallet || !toWallet) {
      toast.error(t('common.error'));
      return false;
    }

    try {
      // Delete transfer record first
      const { error } = await supabase
        .from('wallet_transfers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Recalculate both wallets to avoid drift
      await Promise.all([
        recalculateBalance(transfer.from_wallet_id),
        recalculateBalance(transfer.to_wallet_id),
      ]);

      toast.success(t('wallets.transferDeleted', 'Transferência excluída'));
      await Promise.all([fetchTransfers(), refetchWallets()]);

      emitTransfersChanged();
      emitWalletsChanged();

      return true;
    } catch (error) {
      console.error('Error deleting transfer:', error);
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
    updateTransfer,
    deleteTransfer,
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
