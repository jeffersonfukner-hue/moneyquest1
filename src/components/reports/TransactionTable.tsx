import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatMoney } from '@/lib/formatters';
import { parseDateString } from '@/lib/dateUtils';
import { Transaction } from '@/types/database';
import { useWallets } from '@/hooks/useWallets';
import { useCategories } from '@/hooks/useCategories';

interface TransactionTableProps {
  transactions: Transaction[];
  className?: string;
}

type SortField = 'date' | 'category' | 'amount';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 15;

export const TransactionTable = ({ transactions, className }: TransactionTableProps) => {
  const { t, i18n } = useTranslation();
  const { currency: displayCurrency } = useCurrency();
  const { wallets } = useWallets();
  const { categories } = useCategories();
  
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const dateLocale = i18n.language === 'pt-BR' ? ptBR : i18n.language === 'es-ES' ? es : enUS;

  const walletMap = useMemo(() => {
    const map: Record<string, { name: string; icon: string }> = {};
    wallets.forEach(w => {
      map[w.id] = { name: w.name, icon: w.icon || '🏦' };
    });
    return map;
  }, [wallets]);

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
    const byDate = [...sortedTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let balance = 0;
    const withBalance = byDate.map(tx => {
      balance += tx.type === 'INCOME' ? tx.amount : -tx.amount;
      return { ...tx, runningBalance: balance };
    });

    // Re-sort based on current sort settings
    const resorted = [...withBalance].sort((a, b) => {
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

    return resorted;
  }, [sortedTransactions, sortField, sortOrder]);

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

  if (transactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">{t('premiumCashFlow.table.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            {t('premiumCashFlow.table.noTransactions')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('premiumCashFlow.table.title')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 min-w-[100px]"
                  onClick={() => handleSort('date')}
                >
                  {t('premiumCashFlow.table.date')}
                  <SortIcon field="date" />
                </TableHead>
                <TableHead className="min-w-[120px]">
                  {t('premiumCashFlow.table.description')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 min-w-[100px]"
                  onClick={() => handleSort('category')}
                >
                  {t('premiumCashFlow.table.category')}
                  <SortIcon field="category" />
                </TableHead>
                <TableHead className="min-w-[100px]">
                  {t('premiumCashFlow.table.wallet')}
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-muted/50 min-w-[100px]"
                  onClick={() => handleSort('amount')}
                >
                  {t('premiumCashFlow.table.income')}
                  <SortIcon field="amount" />
                </TableHead>
                <TableHead className="text-right min-w-[100px]">
                  {t('premiumCashFlow.table.expense')}
                </TableHead>
                <TableHead className="text-right min-w-[100px]">
                  {t('premiumCashFlow.table.balance')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.map((tx) => {
                const wallet = tx.wallet_id ? walletMap[tx.wallet_id] : null;
                const category = categoryMap[tx.category];
                
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">
                      {format(parseDateString(tx.date), 'dd/MM/yy', { locale: dateLocale })}
                    </TableCell>
                    <TableCell className="text-sm truncate max-w-[150px]" title={tx.description}>
                      {tx.description}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <span>{category?.icon || '📦'}</span>
                        <span className="truncate max-w-[80px]">{tx.category}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      {wallet ? (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span>{wallet.icon}</span>
                          <span className="truncate max-w-[80px]">{wallet.name}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.type === 'INCOME' ? (
                        <span className="text-green-500 font-medium text-sm">
                          {formatMoney(tx.amount, displayCurrency)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.type === 'EXPENSE' ? (
                        <span className="text-red-500 font-medium text-sm">
                          {formatMoney(tx.amount, displayCurrency)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'font-medium text-sm',
                          tx.runningBalance >= 0 ? 'text-green-500' : 'text-red-500'
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
      </CardContent>
    </Card>
  );
};
