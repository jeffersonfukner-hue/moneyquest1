import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatMoney } from '@/lib/formatters';
import { parseDateString } from '@/lib/dateUtils';
import { Transaction } from '@/types/database';
import { WalletTransfer } from '@/hooks/useWalletTransfers';
import { useWallets } from '@/hooks/useWallets';
import { useCategories } from '@/hooks/useCategories';
import { useCreditCards } from '@/hooks/useCreditCards';
import { EditTransactionDialog } from './EditTransactionDialog';
import { getCategoryTranslationKey } from '@/lib/gameLogic';

interface CashFlowTransactionTableProps {
  transactions: Transaction[];
  transfers?: WalletTransfer[];
  onUpdate: (id: string, updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'xp_earned' | 'created_at'>>) => Promise<{ error: Error | null }>;
  onDelete: (id: string) => Promise<{ error: Error | null }>;
  onEditTransfer?: (transfer: WalletTransfer) => void;
  onDeleteTransfer?: (id: string) => Promise<boolean>;
  className?: string;
}

// Unified type for table rows
interface CashFlowEntry {
  id: string;
  date: string;
  created_at: string; // For stable sorting when multiple entries have same date
  description: string;
  category?: string;
  supplier?: string | null;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  currency: string;
  wallet_id?: string | null;
  credit_card_id?: string | null;
  from_wallet_id?: string;
  to_wallet_id?: string;
  isTransfer: boolean;
  originalTransaction?: Transaction;
  originalTransfer?: WalletTransfer;
}

type SortField = 'date' | 'category' | 'amount';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

export const CashFlowTransactionTable = ({ 
  transactions, 
  transfers = [],
  onUpdate,
  onDelete,
  onEditTransfer,
  onDeleteTransfer,
  className 
}: CashFlowTransactionTableProps) => {
  const { t } = useTranslation();
  const { currency: displayCurrency } = useCurrency();
  const { dateLocale } = useLanguage();
  const { wallets } = useWallets();
  const { categories } = useCategories();
  const { creditCards } = useCreditCards();
  
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const walletMap = useMemo(() => {
    const map: Record<string, { name: string; icon: string }> = {};
    wallets.forEach(w => {
      map[w.id] = { name: w.name, icon: w.icon || '🏦' };
    });
    return map;
  }, [wallets]);

  const creditCardMap = useMemo(() => {
    const map: Record<string, { name: string; bank: string }> = {};
    creditCards.forEach(c => {
      map[c.id] = { name: c.name, bank: c.bank };
    });
    return map;
  }, [creditCards]);

  const categoryMap = useMemo(() => {
    const map: Record<string, { icon: string; color: string }> = {};
    categories.forEach(c => {
      map[c.name] = { icon: c.icon || '📦', color: c.color || '#8B5CF6' };
    });
    return map;
  }, [categories]);

  // Unify transactions and transfers into a single list
  const unifiedEntries = useMemo((): CashFlowEntry[] => {
    // Convert transactions to entries
    const txEntries: CashFlowEntry[] = transactions.map(tx => ({
      id: tx.id,
      date: tx.date,
      created_at: tx.created_at,
      description: tx.description,
      category: tx.category,
      supplier: tx.supplier,
      type: tx.type as 'INCOME' | 'EXPENSE',
      amount: tx.amount,
      currency: tx.currency,
      wallet_id: tx.wallet_id,
      credit_card_id: tx.credit_card_id,
      isTransfer: false,
      originalTransaction: tx,
    }));

    // Convert transfers to entries
    const transferEntries: CashFlowEntry[] = transfers.map(t => {
      const fromWallet = walletMap[t.from_wallet_id];
      const toWallet = walletMap[t.to_wallet_id];
      const fromName = fromWallet?.name || '?';
      const toName = toWallet?.name || '?';
      
      return {
        id: t.id,
        date: t.date,
        created_at: t.created_at,
        description: t.description || `${fromName} → ${toName}`,
        type: 'TRANSFER' as const,
        amount: t.amount,
        currency: t.currency,
        from_wallet_id: t.from_wallet_id,
        to_wallet_id: t.to_wallet_id,
        isTransfer: true,
        originalTransfer: t,
      };
    });

    return [...txEntries, ...transferEntries];
  }, [transactions, transfers, walletMap]);

  const sortedEntries = useMemo(() => {
    const sorted = [...unifiedEntries].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'category':
          comparison = (a.category || 'Transferência').localeCompare(b.category || 'Transferência');
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [unifiedEntries, sortField, sortOrder]);

  // Calculate running balance following visual table order (top to bottom)
  // Recalculates when sortedEntries changes (includes sort/filter changes)
  const entriesWithBalance = useMemo(() => {
    let balance = 0;
    
    return sortedEntries.map(entry => {
      // Transfers don't affect consolidated balance (internal movement)
      if (entry.type !== 'TRANSFER') {
        balance += entry.type === 'INCOME' ? entry.amount : -entry.amount;
      }
      return {
        ...entry,
        runningBalance: balance,
      };
    });
  }, [sortedEntries]);

  const totalPages = Math.ceil(entriesWithBalance.length / ITEMS_PER_PAGE);
  const paginatedEntries = entriesWithBalance.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  const getAccountLabel = (entry: CashFlowEntry) => {
    if (entry.isTransfer) {
      const fromWallet = entry.from_wallet_id ? walletMap[entry.from_wallet_id] : null;
      const toWallet = entry.to_wallet_id ? walletMap[entry.to_wallet_id] : null;
      return { 
        icon: '↔️', 
        name: `${fromWallet?.name || '?'} → ${toWallet?.name || '?'}` 
      };
    }
    if (entry.credit_card_id) {
      const card = creditCardMap[entry.credit_card_id];
      return card ? { icon: '💳', name: card.name } : { icon: '💳', name: 'Cartão' };
    }
    if (entry.wallet_id) {
      const wallet = walletMap[entry.wallet_id];
      return wallet || { icon: '🏦', name: '-' };
    }
    return { icon: '📦', name: '-' };
  };

  const handleRowClick = (entry: CashFlowEntry & { runningBalance: number }) => {
    if (entry.isTransfer && entry.originalTransfer && onEditTransfer) {
      onEditTransfer(entry.originalTransfer);
    } else if (!entry.isTransfer && entry.originalTransaction) {
      setEditingTransaction(entry.originalTransaction);
    }
  };

  if (transactions.length === 0 && transfers.length === 0) {
    return (
      <div className={cn("bg-card rounded-2xl p-8 shadow-md text-center", className)}>
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📝</span>
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">
          {t('transactions.noTransactions')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('transactions.startTracking')}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("bg-card rounded-xl border shadow-sm overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors min-w-[100px]"
                onClick={() => handleSort('date')}
              >
                {t('transactions.table.date')}
                <SortIcon field="date" />
              </TableHead>
              <TableHead className="min-w-[150px]">
                {t('transactions.table.description')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors min-w-[120px]"
                onClick={() => handleSort('category')}
              >
                {t('transactions.table.category')}
                <SortIcon field="category" />
              </TableHead>
              <TableHead className="min-w-[100px]">
                {t('transactions.table.supplier')}
              </TableHead>
              <TableHead className="min-w-[120px]">
                {t('transactions.table.wallet')}
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-muted/80 transition-colors min-w-[100px]"
                onClick={() => handleSort('amount')}
              >
                {t('transactions.table.income')}
                <SortIcon field="amount" />
              </TableHead>
              <TableHead className="text-right min-w-[100px]">
                {t('transactions.table.expense')}
              </TableHead>
              <TableHead className="text-right min-w-[110px]">
                {t('transactions.table.balance')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEntries.map((entry) => {
              const category = entry.category ? categoryMap[entry.category] : null;
              const account = getAccountLabel(entry);
              
              // Resolve translated category name with proper fallback
              const getTranslatedCategory = () => {
                if (entry.isTransfer) {
                  return t('transactions.transfer');
                }
                if (!entry.category) return '-';
                
                // Try translation key first
                const categoryKey = getCategoryTranslationKey(entry.category, entry.type === 'TRANSFER' ? 'EXPENSE' : entry.type);
                if (categoryKey) {
                  const translated = t(`categories.${categoryKey}`);
                  // Check if translation was successful (not returning the key itself)
                  if (!translated.startsWith('categories.')) {
                    return translated;
                  }
                }
                // Fallback to original category name
                return entry.category;
              };
              
              const displayCategory = getTranslatedCategory();
              
              return (
                <TableRow 
                  key={entry.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50 transition-colors",
                    entry.isTransfer && "bg-primary/5 hover:bg-primary/10"
                  )}
                  onClick={() => handleRowClick(entry)}
                >
                  <TableCell className="text-sm font-medium">
                    {format(parseDateString(entry.date), 'dd/MM/yy', { locale: dateLocale })}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className={cn(
                      "truncate block max-w-[200px]",
                      entry.isTransfer && "flex items-center gap-1.5"
                    )} title={entry.description}>
                      {entry.isTransfer && <ArrowRightLeft className="w-3.5 h-3.5 text-primary shrink-0" />}
                      {entry.description}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm" title={displayCategory}>
                      <span>{entry.isTransfer ? '↔️' : (category?.icon || '📦')}</span>
                      <span className="truncate max-w-[120px]">{displayCategory}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.supplier ? (
                      <span className="truncate block max-w-[100px]" title={entry.supplier}>
                        {entry.supplier}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span>{account.icon}</span>
                      <span className="truncate max-w-[100px]">{account.name}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.type === 'INCOME' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm tabular-nums">
                        {formatMoney(entry.amount, displayCurrency)}
                      </span>
                    ) : entry.type === 'TRANSFER' ? (
                      <span className="text-blue-500 dark:text-blue-400 font-medium text-sm tabular-nums">
                        {formatMoney(entry.amount, displayCurrency)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.type === 'EXPENSE' ? (
                      <span className="text-red-600 dark:text-red-400 font-medium text-sm tabular-nums">
                        {formatMoney(entry.amount, displayCurrency)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        'font-semibold text-sm tabular-nums',
                        entry.runningBalance >= 0 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {formatMoney(entry.runningBalance, displayCurrency)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-sm text-muted-foreground">
            {t('common.page')} {currentPage} / {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};
