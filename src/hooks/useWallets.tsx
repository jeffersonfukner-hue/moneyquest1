import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Wallet, WalletFormData, WalletType } from '@/types/wallet';
import { SupportedCurrency } from '@/types/database';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { emitWalletsChanged, onWalletsChanged } from '@/lib/appEvents';

export const useWallets = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallets = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });

      if (error) throw error;

      setWallets((data || []).map(w => ({
        ...w,
        type: w.type as WalletType,
        currency: w.currency as SupportedCurrency,
      })));
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  // Keep multiple instances of this hook in sync across the app
  useEffect(() => {
    return onWalletsChanged(() => {
      fetchWallets();
    });
  }, [fetchWallets]);

  const addWallet = async (walletData: WalletFormData): Promise<Wallet | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          name: walletData.name,
          institution: walletData.institution || null,
          type: walletData.type,
          currency: walletData.currency,
          initial_balance: walletData.initial_balance,
          current_balance: walletData.initial_balance,
          icon: walletData.icon,
          color: walletData.color,
        })
        .select()
        .single();

      if (error) throw error;

      const newWallet: Wallet = {
        ...data,
        type: data.type as WalletType,
        currency: data.currency as SupportedCurrency,
      };

      setWallets(prev => [...prev, newWallet]);
      emitWalletsChanged();
      toast.success(t('wallets.created'));
      return newWallet;
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast.error(t('wallets.createError'));
      return null;
    }
  };

  const updateWallet = async (id: string, updates: Partial<WalletFormData>): Promise<boolean> => {
    if (!user) return false;

    try {
      const wallet = wallets.find(w => w.id === id);
      if (!wallet) return false;

      // If initial_balance changed, adjust current_balance accordingly
      let newCurrentBalance = wallet.current_balance;
      if (updates.initial_balance !== undefined && updates.initial_balance !== wallet.initial_balance) {
        const balanceDiff = updates.initial_balance - wallet.initial_balance;
        newCurrentBalance = wallet.current_balance + balanceDiff;
      }

      const updateData: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Include current_balance adjustment if initial_balance changed
      if (updates.initial_balance !== undefined && updates.initial_balance !== wallet.initial_balance) {
        updateData.current_balance = newCurrentBalance;
      }

      const { data: updatedWallet, error } = await supabase
        .from('wallets')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error || !updatedWallet) throw error || new Error('Update failed');

      setWallets(prev => prev.map(w =>
        w.id === id ? {
          ...w,
          ...updatedWallet,
          type: updatedWallet.type as WalletType,
          currency: updatedWallet.currency as SupportedCurrency,
        } : w
      ));

      emitWalletsChanged();
      toast.success(t('wallets.updated'));
      return true;
    } catch (error) {
      console.error('Error updating wallet:', error);
      toast.error(t('wallets.updateError'));
      return false;
    }
  };

  const deleteWallet = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Soft delete - just deactivate
      const { error } = await supabase
        .from('wallets')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setWallets(prev => prev.map(w =>
        w.id === id ? { ...w, is_active: false } : w
      ));
      emitWalletsChanged();
      toast.success(t('wallets.deactivated'));
      return true;
    } catch (error) {
      console.error('Error deactivating wallet:', error);
      toast.error(t('wallets.deactivateError'));
      return false;
    }
  };

  const reactivateWallet = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('wallets')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setWallets(prev => prev.map(w =>
        w.id === id ? { ...w, is_active: true } : w
      ));
      emitWalletsChanged();
      toast.success(t('wallets.reactivated'));
      return true;
    } catch (error) {
      console.error('Error reactivating wallet:', error);
      return false;
    }
  };

  const recalculateBalance = async (walletId: string): Promise<void> => {
    if (!user) return;

    try {
      // Fetch wallet from DB to get fresh initial_balance (avoid stale state)
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('initial_balance')
        .eq('id', walletId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletError) throw walletError;
      if (!walletData) return;

      // Fetch transactions
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('wallet_id', walletId)
        .eq('user_id', user.id);

      if (txError) throw txError;

      // Fetch transfers OUT (this wallet is the source)
      const { data: transfersOut, error: outError } = await supabase
        .from('wallet_transfers')
        .select('amount')
        .eq('from_wallet_id', walletId)
        .eq('user_id', user.id);

      if (outError) throw outError;

      // Fetch transfers IN (this wallet is the destination)
      const { data: transfersIn, error: inError } = await supabase
        .from('wallet_transfers')
        .select('amount')
        .eq('to_wallet_id', walletId)
        .eq('user_id', user.id);

      if (inError) throw inError;

      let balance = walletData.initial_balance;

      // Apply transactions
      (transactions || []).forEach(t => {
        if (t.type === 'INCOME') {
          balance += Number(t.amount);
        } else {
          balance -= Number(t.amount);
        }
      });

      // Apply transfers out (subtract)
      (transfersOut || []).forEach(t => {
        balance -= Number(t.amount);
      });

      // Apply transfers in (add)
      (transfersIn || []).forEach(t => {
        balance += Number(t.amount);
      });

      await supabase
        .from('wallets')
        .update({ current_balance: balance, updated_at: new Date().toISOString() })
        .eq('id', walletId);

      setWallets(prev => prev.map(w =>
        w.id === walletId ? { ...w, current_balance: balance } : w
      ));
      emitWalletsChanged();
    } catch (error) {
      console.error('Error recalculating balance:', error);
    }
  };

  const updateWalletBalance = async (walletId: string, amount: number, type: 'INCOME' | 'EXPENSE'): Promise<void> => {
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet) return;

    const newBalance = type === 'INCOME'
      ? wallet.current_balance + amount
      : wallet.current_balance - amount;

    try {
      await supabase
        .from('wallets')
        .update({ current_balance: newBalance })
        .eq('id', walletId);

      setWallets(prev => prev.map(w =>
        w.id === walletId ? { ...w, current_balance: newBalance } : w
      ));
      emitWalletsChanged();
    } catch (error) {
      console.error('Error updating wallet balance:', error);
    }
  };

  const reorderWallets = async (walletIds: string[]): Promise<boolean> => {
    if (!user) return false;

    try {
      // Update display_order for each wallet
      const updates = walletIds.map((id, index) =>
        supabase
          .from('wallets')
          .update({ display_order: index + 1, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id)
      );

      await Promise.all(updates);

      // Update local state
      setWallets(prev => {
        const reordered = walletIds.map((id, index) => {
          const wallet = prev.find(w => w.id === id);
          return wallet ? { ...wallet, display_order: index + 1 } : null;
        }).filter(Boolean) as Wallet[];

        // Add any wallets not in the reorder list (inactive ones)
        const remaining = prev.filter(w => !walletIds.includes(w.id));
        return [...reordered, ...remaining];
      });

      emitWalletsChanged();
      return true;
    } catch (error) {
      console.error('Error reordering wallets:', error);
      toast.error(t('wallets.reorderError'));
      return false;
    }
  };

  const activeWallets = wallets.filter(w => w.is_active);
  const inactiveWallets = wallets.filter(w => !w.is_active);

  return {
    wallets,
    activeWallets,
    inactiveWallets,
    loading,
    addWallet,
    updateWallet,
    deleteWallet,
    reactivateWallet,
    recalculateBalance,
    updateWalletBalance,
    reorderWallets,
    refetch: fetchWallets,
  };
};
