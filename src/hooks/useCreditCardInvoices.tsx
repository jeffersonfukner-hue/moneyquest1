import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export interface CreditCardInvoice {
  id: string;
  credit_card_id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  due_date: string;
  total_amount: number;
  status: 'open' | 'closed' | 'paid';
  closed_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceTransaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
}

export const useCreditCardInvoices = (creditCardId?: string) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<CreditCardInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState(false);

  const fetchInvoices = useCallback(async () => {
    if (!user || !creditCardId) {
      setInvoices([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('credit_card_invoices')
        .select('*')
        .eq('credit_card_id', creditCardId)
        .eq('user_id', user.id)
        .order('period_end', { ascending: false });

      if (error) throw error;
      setInvoices((data || []) as CreditCardInvoice[]);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [user, creditCardId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const fetchInvoiceTransactions = async (invoiceId: string): Promise<InvoiceTransaction[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, description, amount, category, date, currency')
        .eq('invoice_id', invoiceId)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []) as InvoiceTransaction[];
    } catch (error) {
      console.error('Error fetching invoice transactions:', error);
      return [];
    }
  };

  const payInvoice = async (invoiceId: string, walletId: string): Promise<boolean> => {
    if (!user) return false;

    setPayingInvoice(true);
    try {
      const { data, error } = await supabase.rpc('pay_credit_card_invoice', {
        p_invoice_id: invoiceId,
        p_wallet_id: walletId,
        p_user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: t('creditCards.invoicePaid', 'Fatura paga!'),
        description: t('creditCards.invoicePaidDesc', 'A fatura foi paga com sucesso.'),
      });

      // Refetch invoices to update status
      await fetchInvoices();
      return true;
    } catch (error: any) {
      console.error('Error paying invoice:', error);
      
      // Handle specific error messages
      let errorMessage = t('creditCards.payError', 'Não foi possível pagar a fatura.');
      if (error.message?.includes('insufficient')) {
        errorMessage = t('creditCards.insufficientBalance', 'Saldo insuficiente na conta vinculada.');
      } else if (error.message?.includes('already paid')) {
        errorMessage = t('creditCards.alreadyPaid', 'Esta fatura já foi paga.');
      }

      toast({
        title: t('common.error', 'Erro'),
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setPayingInvoice(false);
    }
  };

  const getCurrentInvoice = async (): Promise<CreditCardInvoice | null> => {
    if (!user || !creditCardId) return null;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.rpc('get_or_create_current_invoice', {
        p_credit_card_id: creditCardId,
        p_transaction_date: today,
        p_user_id: user.id,
      });

      if (error) throw error;
      
      // Refetch to get updated list
      await fetchInvoices();
      
      // Find the invoice in the updated list
      return invoices.find(inv => inv.id === data) || null;
    } catch (error) {
      console.error('Error getting current invoice:', error);
      return null;
    }
  };

  // Separate invoices by status
  const openInvoices = invoices.filter(inv => inv.status === 'open');
  const closedInvoices = invoices.filter(inv => inv.status === 'closed');
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');

  return {
    invoices,
    openInvoices,
    closedInvoices,
    paidInvoices,
    loading,
    payingInvoice,
    refetch: fetchInvoices,
    fetchInvoiceTransactions,
    payInvoice,
    getCurrentInvoice,
  };
};
