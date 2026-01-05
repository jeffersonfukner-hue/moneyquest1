import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWallets } from '@/hooks/useWallets';
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

export interface CreateTransferData {
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  currency: SupportedCurrency;
  description?: string;
  date: string;
}

export const useWalletTransfers = () => {
  const { user } = useAuth();
  const { wallets, refetch: refetchWallets } = useWallets();
  const { t } = useTranslation();
  const [transfers, setTransfers] = useState<WalletTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallet_transfers')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransfers(data || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const createTransfer = async (transferData: CreateTransferData): Promise<boolean> => {
    if (!user) return false;

    const { from_wallet_id, to_wallet_id, amount, currency, description, date } = transferData;

    // Validate different wallets
    if (from_wallet_id === to_wallet_id) {
      toast.error(t('wallets.sameWalletError'));
      return false;
    }

    // Get wallets
    const fromWallet = wallets.find(w => w.id === from_wallet_id);
    const toWallet = wallets.find(w => w.id === to_wallet_id);

    if (!fromWallet || !toWallet) {
      toast.error(t('common.error'));
      return false;
    }

    try {
      // 1. Create transfer record
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

      // 2. Update source wallet balance (subtract)
      const { error: fromError } = await supabase
        .from('wallets')
        .update({ 
          current_balance: fromWallet.current_balance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', from_wallet_id);

      if (fromError) throw fromError;

      // 3. Update destination wallet balance (add)
      const { error: toError } = await supabase
        .from('wallets')
        .update({ 
          current_balance: toWallet.current_balance + amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', to_wallet_id);

      if (toError) throw toError;

      toast.success(t('wallets.transferSuccess'));
      
      // Refresh data
      await Promise.all([fetchTransfers(), refetchWallets()]);
      
      return true;
    } catch (error) {
      console.error('Error creating transfer:', error);
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

  return {
    transfers,
    loading,
    createTransfer,
    fetchTransfers,
    getWalletName,
    getWalletIcon,
  };
};
