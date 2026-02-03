import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWallets } from '@/hooks/useWallets';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Json } from '@/integrations/supabase/types';

export interface WalletBalance {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export interface ClosureSnapshot {
  totalIncome: number;
  totalExpenses: number;
  netResult: number;
  transactionCount: number;
  cashAdjustmentCount: number;
  walletBalances: WalletBalance[];
}

export interface MonthlyClosure {
  id: string;
  userId: string;
  periodYear: number;
  periodMonth: number;
  status: 'open' | 'closed' | 'reopened';
  totalIncome: number;
  totalExpenses: number;
  netResult: number;
  transactionCount: number;
  cashAdjustmentCount: number;
  walletBalances: WalletBalance[];
  closedAt: string | null;
  closedBy: string | null;
  closingNotes: string | null;
  reopenedAt: string | null;
  reopenedBy: string | null;
  reopenReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClosingChecklistItem {
  id: string;
  label: string;
  status: 'ok' | 'pending' | 'warning';
  message?: string;
  actionLink?: string;
  critical: boolean;
}

export interface ClosingChecklist {
  items: ClosingChecklistItem[];
  canClose: boolean;
}

// Helper to convert WalletBalance[] to Json
const walletBalancesToJson = (balances: WalletBalance[]): Json => {
  return balances.map(b => ({
    id: b.id,
    name: b.name,
    type: b.type,
    balance: b.balance,
    currency: b.currency,
  })) as unknown as Json;
};

// Helper to parse wallet balances from Json
const parseWalletBalances = (data: Json | null): WalletBalance[] => {
  if (!data || !Array.isArray(data)) return [];
  return data.map((item: any) => ({
    id: item.id || '',
    name: item.name || '',
    type: item.type || '',
    balance: Number(item.balance) || 0,
    currency: item.currency || 'BRL',
  }));
};

export const useMonthlyClosures = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeWallets } = useWallets();
  
  const [closures, setClosures] = useState<MonthlyClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Fetch all closures for the user
  const fetchClosures = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('monthly_closures')
        .select('*')
        .eq('user_id', user.id)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

      if (error) throw error;

      const mapped: MonthlyClosure[] = (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        periodYear: row.period_year,
        periodMonth: row.period_month,
        status: row.status as 'open' | 'closed' | 'reopened',
        totalIncome: Number(row.total_income),
        totalExpenses: Number(row.total_expenses),
        netResult: Number(row.net_result),
        transactionCount: row.transaction_count,
        cashAdjustmentCount: row.cash_adjustment_count,
        walletBalances: parseWalletBalances(row.wallet_balances),
        closedAt: row.closed_at,
        closedBy: row.closed_by,
        closingNotes: row.closing_notes,
        reopenedAt: row.reopened_at,
        reopenedBy: row.reopened_by,
        reopenReason: row.reopen_reason,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setClosures(mapped);
    } catch (error) {
      console.error('Error fetching closures:', error);
      toast.error(t('closing.fetchError', 'Erro ao carregar fechamentos'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchClosures();
  }, [fetchClosures]);

  // Check if a specific month is closed
  const isMonthClosed = useCallback((year: number, month: number): boolean => {
    const closure = closures.find(
      c => c.periodYear === year && c.periodMonth === month
    );
    return closure?.status === 'closed';
  }, [closures]);

  // Get closure for a specific month
  const getClosureForMonth = useCallback((year: number, month: number): MonthlyClosure | undefined => {
    return closures.find(
      c => c.periodYear === year && c.periodMonth === month
    );
  }, [closures]);

  // Generate checklist for closing a month
  const generateChecklist = useCallback(async (year: number, month: number): Promise<ClosingChecklist> => {
    if (!user) return { items: [], canClose: false };

    const items: ClosingChecklistItem[] = [];
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    try {
      // Check 1: All bank accounts reconciled
      const bankAccounts = activeWallets.filter(w => w.type !== 'cash');
      
      const { data: pendingLines } = await supabase
        .from('bank_statement_lines')
        .select('id, wallet_id')
        .eq('user_id', user.id)
        .eq('reconciliation_status', 'pending')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      const hasPendingReconciliation = (pendingLines?.length || 0) > 0;
      
      items.push({
        id: 'reconciliation',
        label: t('closing.checklist.reconciliation', 'Todas as contas bancárias conciliadas'),
        status: hasPendingReconciliation ? 'pending' : 'ok',
        message: hasPendingReconciliation 
          ? t('closing.checklist.pendingReconciliation', '{{count}} lançamento(s) pendente(s)', { count: pendingLines?.length })
          : undefined,
        actionLink: '/wallets/reconciliation',
        critical: true,
      });

      // Check 2: No pending transactions (unclassified)
      const { data: uncategorized } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .or('category.is.null,category.eq.');

      const hasUncategorized = (uncategorized?.length || 0) > 0;
      
      items.push({
        id: 'categorized',
        label: t('closing.checklist.categorized', 'Todas as transações categorizadas'),
        status: hasUncategorized ? 'warning' : 'ok',
        message: hasUncategorized 
          ? t('closing.checklist.uncategorized', '{{count}} transação(ões) sem categoria', { count: uncategorized?.length })
          : undefined,
        actionLink: '/reports',
        critical: false,
      });

      // Check 3: Cash wallet verified
      const cashWallet = activeWallets.find(w => w.type === 'cash');
      items.push({
        id: 'cash',
        label: t('closing.checklist.cashVerified', 'Saldo de dinheiro (CASH) conferido'),
        status: cashWallet ? 'ok' : 'ok', // User must manually verify
        message: cashWallet 
          ? t('closing.checklist.cashBalance', 'Saldo atual: {{balance}}', { 
              balance: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: cashWallet.currency || 'BRL' }).format(cashWallet.current_balance) 
            })
          : t('closing.checklist.noCashWallet', 'Nenhuma carteira de dinheiro'),
        actionLink: '/wallets/accounts',
        critical: false,
      });

      // Check 4: Category goals reviewed (if any)
      const { data: goals } = await supabase
        .from('category_goals')
        .select('id')
        .eq('user_id', user.id);

      const hasGoals = (goals?.length || 0) > 0;
      
      items.push({
        id: 'goals',
        label: t('closing.checklist.goalsReviewed', 'Metas de categoria revisadas'),
        status: 'ok',
        message: hasGoals 
          ? t('closing.checklist.goalsCount', '{{count}} meta(s) definida(s)', { count: goals?.length })
          : t('closing.checklist.noGoals', 'Nenhuma meta definida'),
        actionLink: '/goals',
        critical: false,
      });

      // Check 5: Credit card invoices closed
      const { data: openInvoices } = await supabase
        .from('credit_card_invoices')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .gte('due_date', startDate)
        .lte('due_date', endDate);

      const hasOpenInvoices = (openInvoices?.length || 0) > 0;
      
      items.push({
        id: 'invoices',
        label: t('closing.checklist.invoicesClosed', 'Faturas de cartão do período fechadas'),
        status: hasOpenInvoices ? 'warning' : 'ok',
        message: hasOpenInvoices 
          ? t('closing.checklist.openInvoices', '{{count}} fatura(s) aberta(s)', { count: openInvoices?.length })
          : undefined,
        actionLink: '/wallets/cards',
        critical: false,
      });

      // Determine if can close
      const canClose = !items.some(item => item.critical && item.status === 'pending');

      return { items, canClose };
    } catch (error) {
      console.error('Error generating checklist:', error);
      return { items: [], canClose: false };
    }
  }, [user, activeWallets, t]);

  // Generate snapshot data for a month
  const generateSnapshot = useCallback(async (year: number, month: number): Promise<ClosureSnapshot> => {
    if (!user) return {
      totalIncome: 0,
      totalExpenses: 0,
      netResult: 0,
      transactionCount: 0,
      cashAdjustmentCount: 0,
      walletBalances: [],
    };

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    try {
      // Fetch transactions for the period
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type, transaction_subtype')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      let totalIncome = 0;
      let totalExpenses = 0;
      let cashAdjustmentCount = 0;

      (transactions || []).forEach(tx => {
        if (tx.transaction_subtype === 'cash_adjustment') {
          cashAdjustmentCount++;
        }
        if (tx.transaction_subtype === 'transfer') return; // Skip transfers
        
        if (tx.type === 'INCOME') {
          totalIncome += Number(tx.amount);
        } else {
          totalExpenses += Number(tx.amount);
        }
      });

      // Wallet balances
      const walletBalances: WalletBalance[] = activeWallets.map(w => ({
        id: w.id,
        name: w.name,
        type: w.type,
        balance: w.current_balance,
        currency: w.currency,
      }));

      return {
        totalIncome,
        totalExpenses,
        netResult: totalIncome - totalExpenses,
        transactionCount: transactions?.length || 0,
        cashAdjustmentCount,
        walletBalances,
      };
    } catch (error) {
      console.error('Error generating snapshot:', error);
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netResult: 0,
        transactionCount: 0,
        cashAdjustmentCount: 0,
        walletBalances: [],
      };
    }
  }, [user, activeWallets]);

  // Close a month
  const closeMonth = useCallback(async (
    year: number, 
    month: number, 
    notes?: string
  ): Promise<boolean> => {
    if (!user) return false;

    setProcessing(true);
    try {
      // Generate snapshot
      const snapshot = await generateSnapshot(year, month);

      // Check if closure record exists
      const existing = getClosureForMonth(year, month);

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('monthly_closures')
          .update({
            status: 'closed',
            total_income: snapshot.totalIncome,
            total_expenses: snapshot.totalExpenses,
            net_result: snapshot.netResult,
            transaction_count: snapshot.transactionCount,
            cash_adjustment_count: snapshot.cashAdjustmentCount,
            wallet_balances: walletBalancesToJson(snapshot.walletBalances),
            closed_at: new Date().toISOString(),
            closed_by: user.id,
            closing_notes: notes || null,
          })
          .eq('id', existing.id);

        if (error) throw error;

        // Audit log
        await supabase.from('monthly_closure_audit').insert([{
          closure_id: existing.id,
          user_id: user.id,
          action: 'close',
          snapshot_data: walletBalancesToJson(snapshot.walletBalances),
        }]);
      } else {
        // Create new
        const { data: newClosure, error } = await supabase
          .from('monthly_closures')
          .insert([{
            user_id: user.id,
            period_year: year,
            period_month: month,
            status: 'closed',
            total_income: snapshot.totalIncome,
            total_expenses: snapshot.totalExpenses,
            net_result: snapshot.netResult,
            transaction_count: snapshot.transactionCount,
            cash_adjustment_count: snapshot.cashAdjustmentCount,
            wallet_balances: walletBalancesToJson(snapshot.walletBalances),
            closed_at: new Date().toISOString(),
            closed_by: user.id,
            closing_notes: notes || null,
          }])
          .select()
          .single();

        if (error) throw error;

        // Audit log
        if (newClosure) {
          await supabase.from('monthly_closure_audit').insert([{
            closure_id: newClosure.id,
            user_id: user.id,
            action: 'close',
            snapshot_data: walletBalancesToJson(snapshot.walletBalances),
          }]);
        }
      }

      toast.success(t('closing.closeSuccess', 'Mês fechado com sucesso'));
      await fetchClosures();
      return true;
    } catch (error) {
      console.error('Error closing month:', error);
      toast.error(t('closing.closeError', 'Erro ao fechar o mês'));
      return false;
    } finally {
      setProcessing(false);
    }
  }, [user, generateSnapshot, getClosureForMonth, fetchClosures, t]);

  // Reopen a closed month
  const reopenMonth = useCallback(async (
    year: number, 
    month: number, 
    reason: string
  ): Promise<boolean> => {
    if (!user || !reason.trim()) return false;

    setProcessing(true);
    try {
      const existing = getClosureForMonth(year, month);
      if (!existing || existing.status !== 'closed') {
        toast.error(t('closing.notClosed', 'Este mês não está fechado'));
        return false;
      }

      // Store previous snapshot before reopening
      const previousSnapshot = {
        totalIncome: existing.totalIncome,
        totalExpenses: existing.totalExpenses,
        netResult: existing.netResult,
        transactionCount: existing.transactionCount,
        walletBalances: existing.walletBalances,
        closedAt: existing.closedAt,
      } as unknown as Json;

      const { error } = await supabase
        .from('monthly_closures')
        .update({
          status: 'reopened',
          reopened_at: new Date().toISOString(),
          reopened_by: user.id,
          reopen_reason: reason,
          previous_closure_snapshot: previousSnapshot,
        })
        .eq('id', existing.id);

      if (error) throw error;

      // Audit log
      await supabase.from('monthly_closure_audit').insert([{
        closure_id: existing.id,
        user_id: user.id,
        action: 'reopen',
        reason,
        snapshot_data: previousSnapshot,
      }]);

      toast.success(t('closing.reopenSuccess', 'Mês reaberto com sucesso'));
      await fetchClosures();
      return true;
    } catch (error) {
      console.error('Error reopening month:', error);
      toast.error(t('closing.reopenError', 'Erro ao reabrir o mês'));
      return false;
    } finally {
      setProcessing(false);
    }
  }, [user, getClosureForMonth, fetchClosures, t]);

  // Get available months for closing (last 12 months)
  const availableMonths = useMemo(() => {
    const months: { year: number; month: number; label: string }[] = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      });
    }
    
    return months;
  }, []);

  return {
    closures,
    loading,
    processing,
    availableMonths,
    isMonthClosed,
    getClosureForMonth,
    generateChecklist,
    generateSnapshot,
    closeMonth,
    reopenMonth,
    refetch: fetchClosures,
  };
};
