import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

const BACKUP_VERSION = '1.0';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface BackupData {
  version: string;
  exportedAt: string;
  userId: string;
  data: {
    transactions: any[];
    wallets: any[];
    categories: any[];
    categoryGoals: any[];
    creditCards: any[];
    creditCardInvoices: any[];
    loans: any[];
    transactionTemplates: any[];
    walletTransfers: any[];
    suppliers: any[];
    personalRewards: any[];
    scheduledTransactions: any[];
  };
}

interface ImportProgress {
  current: number;
  total: number;
  step: string;
}

export const useBackup = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);

  const exportBackup = useCallback(async () => {
    if (!user) {
      toast.error(t('backup.exportError'));
      return;
    }

    setIsExporting(true);

    try {
      // Fetch all data in parallel
      const [
        transactionsRes,
        walletsRes,
        categoriesRes,
        categoryGoalsRes,
        creditCardsRes,
        creditCardInvoicesRes,
        loansRes,
        templatesRes,
        transfersRes,
        suppliersRes,
        rewardsRes,
        scheduledRes,
      ] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id),
        supabase.from('wallets').select('*').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id).eq('is_default', false),
        supabase.from('category_goals').select('*').eq('user_id', user.id),
        supabase.from('credit_cards').select('*').eq('user_id', user.id),
        supabase.from('credit_card_invoices').select('*').eq('user_id', user.id),
        supabase.from('loans').select('*').eq('user_id', user.id),
        supabase.from('transaction_templates').select('*').eq('user_id', user.id),
        supabase.from('wallet_transfers').select('*').eq('user_id', user.id),
        supabase.from('suppliers').select('*').eq('user_id', user.id),
        supabase.from('personal_rewards').select('*').eq('user_id', user.id),
        supabase.from('scheduled_transactions').select('*').eq('user_id', user.id),
      ]);

      const backupData: BackupData = {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        userId: user.id,
        data: {
          transactions: transactionsRes.data || [],
          wallets: walletsRes.data || [],
          categories: categoriesRes.data || [],
          categoryGoals: categoryGoalsRes.data || [],
          creditCards: creditCardsRes.data || [],
          creditCardInvoices: creditCardInvoicesRes.data || [],
          loans: loansRes.data || [],
          transactionTemplates: templatesRes.data || [],
          walletTransfers: transfersRes.data || [],
          suppliers: suppliersRes.data || [],
          personalRewards: rewardsRes.data || [],
          scheduledTransactions: scheduledRes.data || [],
        },
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moneyquest-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t('backup.exportSuccess'));

      // Store last backup date in localStorage
      localStorage.setItem('lastBackupDate', new Date().toISOString());
    } catch (error) {
      console.error('Export backup error:', error);
      toast.error(t('backup.exportError'));
    } finally {
      setIsExporting(false);
    }
  }, [user, t]);

  const validateBackup = useCallback((data: any): data is BackupData => {
    if (!data || typeof data !== 'object') return false;
    if (!data.version || !data.exportedAt || !data.data) return false;
    if (typeof data.data !== 'object') return false;
    
    const requiredKeys = [
      'transactions', 'wallets', 'categories', 'categoryGoals',
      'creditCards', 'creditCardInvoices', 'loans', 'transactionTemplates',
      'walletTransfers', 'suppliers', 'personalRewards', 'scheduledTransactions'
    ];
    
    for (const key of requiredKeys) {
      if (!Array.isArray(data.data[key])) return false;
    }
    
    return true;
  }, []);

  const importBackup = useCallback(async (file: File): Promise<boolean> => {
    if (!user) {
      toast.error(t('backup.importError'));
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('backup.fileTooLarge'));
      return false;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: 12, step: 'reading' });

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!validateBackup(data)) {
        toast.error(t('backup.invalidFile'));
        setIsImporting(false);
        setImportProgress(null);
        return false;
      }

      const { data: backupData } = data;
      
      // Map old IDs to new IDs for foreign key relationships
      const idMaps: Record<string, Record<string, string>> = {
        wallets: {},
        categories: {},
        creditCards: {},
        invoices: {},
        suppliers: {},
      };

      // 1. Import categories (skip defaults)
      setImportProgress({ current: 1, total: 12, step: 'categories' });
      for (const category of backupData.categories) {
        if (category.is_default) continue;
        const { data: newCat, error } = await supabase
          .from('categories')
          .insert({
            user_id: user.id,
            name: category.name,
            type: category.type,
            icon: category.icon,
            color: category.color,
            is_default: false,
          })
          .select()
          .single();
        if (newCat) idMaps.categories[category.id] = newCat.id;
      }

      // 2. Import wallets
      setImportProgress({ current: 2, total: 12, step: 'wallets' });
      for (const wallet of backupData.wallets) {
        const { data: newWallet, error } = await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            name: wallet.name,
            institution: wallet.institution,
            type: wallet.type,
            currency: wallet.currency,
            initial_balance: wallet.initial_balance,
            current_balance: wallet.current_balance,
            is_active: wallet.is_active,
            icon: wallet.icon,
            color: wallet.color,
            display_order: wallet.display_order,
          })
          .select()
          .single();
        if (newWallet) idMaps.wallets[wallet.id] = newWallet.id;
      }

      // 3. Import suppliers
      setImportProgress({ current: 3, total: 12, step: 'suppliers' });
      for (const supplier of backupData.suppliers) {
        const { data: newSupplier } = await supabase
          .from('suppliers')
          .insert({
            user_id: user.id,
            name: supplier.name,
            usage_count: supplier.usage_count,
            total_spent: supplier.total_spent,
          })
          .select()
          .single();
        if (newSupplier) idMaps.suppliers[supplier.id] = newSupplier.id;
      }

      // 4. Import credit cards
      setImportProgress({ current: 4, total: 12, step: 'creditCards' });
      for (const card of backupData.creditCards) {
        const linkedWalletId = card.linked_wallet_id ? idMaps.wallets[card.linked_wallet_id] : null;
        const { data: newCard } = await supabase
          .from('credit_cards')
          .insert({
            user_id: user.id,
            name: card.name,
            bank: card.bank,
            total_limit: card.total_limit,
            available_limit: card.available_limit,
            billing_close_day: card.billing_close_day,
            due_day: card.due_day,
            linked_wallet_id: linkedWalletId,
            is_active: card.is_active,
            currency: card.currency,
          })
          .select()
          .single();
        if (newCard) idMaps.creditCards[card.id] = newCard.id;
      }

      // 5. Import credit card invoices
      setImportProgress({ current: 5, total: 12, step: 'invoices' });
      for (const invoice of backupData.creditCardInvoices) {
        const creditCardId = idMaps.creditCards[invoice.credit_card_id];
        if (!creditCardId) continue;
        const { data: newInvoice } = await supabase
          .from('credit_card_invoices')
          .insert({
            user_id: user.id,
            credit_card_id: creditCardId,
            period_start: invoice.period_start,
            period_end: invoice.period_end,
            due_date: invoice.due_date,
            total_amount: invoice.total_amount,
            status: invoice.status,
            closed_at: invoice.closed_at,
            paid_at: invoice.paid_at,
          })
          .select()
          .single();
        if (newInvoice) idMaps.invoices[invoice.id] = newInvoice.id;
      }

      // 6. Import category goals
      setImportProgress({ current: 6, total: 12, step: 'categoryGoals' });
      for (const goal of backupData.categoryGoals) {
        await supabase.from('category_goals').insert({
          user_id: user.id,
          category: goal.category,
          budget_limit: goal.budget_limit,
        });
      }

      // 7. Import transactions
      setImportProgress({ current: 7, total: 12, step: 'transactions' });
      for (const transaction of backupData.transactions) {
        const walletId = transaction.wallet_id ? idMaps.wallets[transaction.wallet_id] : null;
        const creditCardId = transaction.credit_card_id ? idMaps.creditCards[transaction.credit_card_id] : null;
        const invoiceId = transaction.invoice_id ? idMaps.invoices[transaction.invoice_id] : null;
        
        await supabase.from('transactions').insert({
          user_id: user.id,
          description: transaction.description,
          amount: transaction.amount,
          category: transaction.category,
          type: transaction.type,
          date: transaction.date,
          xp_earned: 0, // Don't duplicate XP
          currency: transaction.currency,
          wallet_id: walletId,
          credit_card_id: creditCardId,
          invoice_id: invoiceId,
          source_type: transaction.source_type,
          transaction_subtype: transaction.transaction_subtype,
          has_items: transaction.has_items,
          is_manual: transaction.is_manual,
          supplier: transaction.supplier,
        });
      }

      // 8. Import transaction templates
      setImportProgress({ current: 8, total: 12, step: 'templates' });
      for (const template of backupData.transactionTemplates) {
        await supabase.from('transaction_templates').insert({
          user_id: user.id,
          name: template.name,
          description: template.description,
          amount: template.amount,
          category: template.category,
          type: template.type,
          currency: template.currency,
          icon: template.icon,
        });
      }

      // 9. Import wallet transfers
      setImportProgress({ current: 9, total: 12, step: 'transfers' });
      for (const transfer of backupData.walletTransfers) {
        const fromWalletId = idMaps.wallets[transfer.from_wallet_id];
        const toWalletId = idMaps.wallets[transfer.to_wallet_id];
        if (!fromWalletId || !toWalletId) continue;
        
        await supabase.from('wallet_transfers').insert({
          user_id: user.id,
          from_wallet_id: fromWalletId,
          to_wallet_id: toWalletId,
          amount: transfer.amount,
          date: transfer.date,
          currency: transfer.currency,
          description: transfer.description,
        });
      }

      // 10. Import scheduled transactions
      setImportProgress({ current: 10, total: 12, step: 'scheduled' });
      for (const scheduled of backupData.scheduledTransactions) {
        const walletId = scheduled.wallet_id ? idMaps.wallets[scheduled.wallet_id] : null;
        
        await supabase.from('scheduled_transactions').insert({
          user_id: user.id,
          description: scheduled.description,
          amount: scheduled.amount,
          category: scheduled.category,
          type: scheduled.type,
          currency: scheduled.currency,
          frequency: scheduled.frequency,
          next_run_date: scheduled.next_run_date,
          wallet_id: walletId,
          day_of_week: scheduled.day_of_week,
          day_of_month: scheduled.day_of_month,
          month_of_year: scheduled.month_of_year,
          is_active: scheduled.is_active,
          total_occurrences: scheduled.total_occurrences,
          remaining_occurrences: scheduled.remaining_occurrences,
          supplier: scheduled.supplier,
        });
      }

      // 11. Import loans
      setImportProgress({ current: 11, total: 12, step: 'loans' });
      for (const loan of backupData.loans) {
        await supabase.from('loans').insert({
          user_id: user.id,
          tipo_emprestimo: loan.tipo_emprestimo,
          instituicao_pessoa: loan.instituicao_pessoa,
          valor_total: loan.valor_total,
          data_contratacao: loan.data_contratacao,
          quantidade_parcelas: loan.quantidade_parcelas,
          valor_parcela: loan.valor_parcela,
          taxa_juros: loan.taxa_juros,
          primeiro_vencimento: loan.primeiro_vencimento,
          parcelas_pagas: loan.parcelas_pagas,
          saldo_devedor: loan.saldo_devedor,
          status: loan.status,
          currency: loan.currency,
          debitar_automaticamente: loan.debitar_automaticamente,
          enviar_lembrete: loan.enviar_lembrete,
          considerar_orcamento: loan.considerar_orcamento,
          notas: loan.notas,
        });
      }

      // 12. Import personal rewards
      setImportProgress({ current: 12, total: 12, step: 'rewards' });
      for (const reward of backupData.personalRewards) {
        await supabase.from('personal_rewards').insert({
          user_id: user.id,
          name: reward.name,
          description: reward.description,
          icon: reward.icon,
          xp_threshold: reward.xp_threshold,
          is_claimed: reward.is_claimed,
          claimed_at: reward.claimed_at,
        });
      }

      toast.success(t('backup.importSuccess'));
      return true;
    } catch (error) {
      console.error('Import backup error:', error);
      toast.error(t('backup.importError'));
      return false;
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  }, [user, t, validateBackup]);

  const getLastBackupDate = useCallback((): Date | null => {
    const stored = localStorage.getItem('lastBackupDate');
    return stored ? new Date(stored) : null;
  }, []);

  return {
    isExporting,
    isImporting,
    importProgress,
    exportBackup,
    importBackup,
    validateBackup,
    getLastBackupDate,
  };
};
