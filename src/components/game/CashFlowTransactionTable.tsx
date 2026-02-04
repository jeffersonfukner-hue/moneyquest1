import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { useWallets } from '@/hooks/useWallets';
import { useCategories } from '@/hooks/useCategories';
import { useCreditCards } from '@/hooks/useCreditCards';
import { EditTransactionDialog } from './EditTransactionDialog';
import { getCategoryTranslationKey } from '@/lib/gameLogic';

interface CashFlowTransactionTableProps {
  transactions: Transaction[];
  onUpdate: (id: string, updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'xp_earned' | 'created_at'>>) => Promise<{ error: Error | null }>;
  onDelete: (id: string) => Promise<{ error: Error | null }>;
  className?: string;
}

type SortField = 'date' | 'category' | 'amount';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 20;

export const CashFlowTransactionTable = ({ 
  transactions, 
  onUpdate,
  onDelete,
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

  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [transactions, sortField, sortOrder]);

  // Calculate running balance
  const transactionsWithBalance = useMemo(() => {
    // Sort by date ascending for balance calculation
    const byDate = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let balance = 0;
    const balanceMap = new Map<string, number>();
    
    byDate.forEach(tx => {
      balance += tx.type === 'INCOME' ? tx.amount : -tx.amount;
      balanceMap.set(tx.id, balance);
    });

    // Apply balance to sorted transactions
    return sortedTransactions.map(tx => ({
      ...tx,
      runningBalance: balanceMap.get(tx.id) || 0,
    }));
  }, [transactions, sortedTransactions]);

  const totalPages = Math.ceil(transactionsWithBalance.length / ITEMS_PER_PAGE);
  const paginatedTransactions = transactionsWithBalance.slice(
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

  const getAccountLabel = (tx: Transaction) => {
    if (tx.credit_card_id) {
      const card = creditCardMap[tx.credit_card_id];
      return card ? { icon: '💳', name: card.name } : { icon: '💳', name: 'Cartão' };
    }
    if (tx.wallet_id) {
      const wallet = walletMap[tx.wallet_id];
      return wallet || { icon: '🏦', name: '-' };
    }
    return { icon: '📦', name: '-' };
  };

  if (transactions.length === 0) {
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
            {paginatedTransactions.map((tx) => {
              const category = categoryMap[tx.category];
              const account = getAccountLabel(tx);
              const categoryKey = getCategoryTranslationKey(tx.category, tx.type);
              const displayCategory = categoryKey ? t(`categories.${categoryKey}`) : tx.category;
              return (
                <TableRow 
                  key={tx.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setEditingTransaction(tx)}
                >
                  <TableCell className="text-sm font-medium">
                    {format(parseDateString(tx.date), 'dd/MM/yy', { locale: dateLocale })}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="truncate block max-w-[200px]" title={tx.description}>
                      {tx.description}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm">
                      <span>{category?.icon || '📦'}</span>
                      <span className="truncate max-w-[100px]">{displayCategory}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tx.supplier ? (
                      <span className="truncate block max-w-[100px]" title={tx.supplier}>
                        {tx.supplier}
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
                    {tx.type === 'INCOME' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm tabular-nums">
                        {formatMoney(tx.amount, displayCurrency)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {tx.type === 'EXPENSE' ? (
                      <span className="text-red-600 dark:text-red-400 font-medium text-sm tabular-nums">
                        {formatMoney(tx.amount, displayCurrency)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        'font-semibold text-sm tabular-nums',
                        tx.runningBalance >= 0 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {formatMoney(tx.runningBalance, displayCurrency)}
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
