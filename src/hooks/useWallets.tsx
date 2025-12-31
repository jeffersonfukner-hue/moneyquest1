import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Wallet, WalletFormData, WalletType } from '@/types/wallet';
import { SupportedCurrency } from '@/types/database';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
        .order('created_at', { ascending: true });

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
      const { error } = await supabase
        .from('wallets')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setWallets(prev => prev.map(w => 
        w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w
      ));
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
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) return;

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('wallet_id', walletId)
        .eq('user_id', user.id);

      if (error) throw error;

      let balance = wallet.initial_balance;
      (transactions || []).forEach(t => {
        if (t.type === 'INCOME') {
          balance += Number(t.amount);
        } else {
          balance -= Number(t.amount);
        }
      });

      await supabase
        .from('wallets')
        .update({ current_balance: balance })
        .eq('id', walletId);

      setWallets(prev => prev.map(w => 
        w.id === walletId ? { ...w, current_balance: balance } : w
      ));
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
    } catch (error) {
      console.error('Error updating wallet balance:', error);
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
    refetch: fetchWallets,
  };
};
