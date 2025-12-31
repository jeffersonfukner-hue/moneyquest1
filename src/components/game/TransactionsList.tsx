import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Locale } from 'date-fns';
import { Transaction, SupportedCurrency } from '@/types/database';
import { ArrowUpCircle, ArrowDownCircle, Trash2, Pencil, MoreVertical, CheckSquare, X, Wallet, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subDays } from 'date-fns';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { parseDateString } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/formatters';
import { getCategoryTranslationKey } from '@/lib/gameLogic';
import { EditTransactionDialog } from './EditTransactionDialog';
import { BatchWalletAssignDialog } from './BatchWalletAssignDialog';
import { useWallets } from '@/hooks/useWallets';
import { useIsMobile } from '@/hooks/use-mobile';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TransactionsListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'xp_earned' | 'created_at'>>) => Promise<{ error: Error | null }>;
  onBatchUpdateWallet?: (transactionIds: string[], walletId: string) => Promise<{ error: Error | null; updatedCount: number }>;
}

type FilterPeriod = 'all' | 'week' | 'month' | 'year';

export const TransactionsList = ({ transactions, onDelete, onUpdate, onBatchUpdateWallet }: TransactionsListProps) => {
  const { t } = useTranslation();
  const { dateLocale } = useLanguage();
  const { formatCurrency, currency: userCurrency, formatConverted } = useCurrency();
  const { wallets } = useWallets();
  const { isPremium, checkFeature } = useSubscription();
  const [filter, setFilter] = useState<FilterPeriod>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const canBatchEdit = checkFeature('batch_edit') || isPremium;

  // Create wallet lookup map
  const walletMap = useMemo(() => {
    return wallets.reduce((acc, w) => {
      acc[w.id] = w;
      return acc;
    }, {} as Record<string, typeof wallets[0]>);
  }, [wallets]);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const txDate = parseDateString(t.date);
      switch (filter) {
        case 'week': return txDate >= subDays(now, 7);
        case 'month': return txDate >= subDays(now, 30);
        case 'year': return txDate >= subDays(now, 365);
        default: return true;
      }
    });
  }, [transactions, filter]);

  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((groups, transaction) => {
      const date = transaction.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, Transaction[]>);
  }, [filteredTransactions]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleEnterSelectionMode = () => {
    if (canBatchEdit) {
      setIsSelectionMode(true);
    } else {
      setShowUpgradeDialog(true);
    }
  };

  const handleBatchConfirm = async (walletId: string) => {
    if (!onBatchUpdateWallet) {
      return { error: new Error('Batch update not available'), updatedCount: 0 };
    }
    const result = await onBatchUpdateWallet(Array.from(selectedIds), walletId);
    if (!result.error) {
      exitSelectionMode();
    }
    return result;
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-8 shadow-md text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
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
    <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-md animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-foreground">
            {t('transactions.title')}
          </h3>
          {!isSelectionMode && onBatchUpdateWallet && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnterSelectionMode}
              className="gap-2"
            >
              {canBatchEdit ? (
                <>
                  <CheckSquare className="w-4 h-4" />
                  {t('transactions.batchActions.select')}
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  {t('transactions.batchActions.select')}
                </>
              )}
            </Button>
          )}
        </div>
        <ToggleGroup 
          type="single" 
          value={filter} 
          onValueChange={(v) => v && setFilter(v as FilterPeriod)}
          className="bg-muted/50 rounded-lg p-1 self-start"
        >
          <ToggleGroupItem value="all" className="text-xs px-3 py-1.5 min-h-[36px] data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
            {t('common.all')}
          </ToggleGroupItem>
          <ToggleGroupItem value="week" className="text-xs px-3 py-1.5 min-h-[36px] data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
            {t('common.week')}
          </ToggleGroupItem>
          <ToggleGroupItem value="month" className="text-xs px-3 py-1.5 min-h-[36px] data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
            {t('common.month')}
          </ToggleGroupItem>
          <ToggleGroupItem value="year" className="text-xs px-3 py-1.5 min-h-[36px] data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
            {t('common.year')}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Selection mode action bar */}
      {isSelectionMode && (
        <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3 mb-4 border border-primary/20">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              {t('transactions.batchActions.selected', { count: selectedIds.size })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => setShowBatchDialog(true)}
              disabled={selectedIds.size === 0}
              className="gap-2"
            >
              <Wallet className="w-4 h-4" />
              {t('transactions.batchActions.assignWallet')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={exitSelectionMode}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            {t('transactions.noTransactionsForPeriod')}
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {Object.entries(groupedTransactions).map(([date, txs]) => (
            <div key={date}>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {format(parseDateString(date), "EEEE, d MMMM", { locale: dateLocale })}
              </p>
              <div className="space-y-2">
                {txs.map(transaction => (
                  <TransactionItem 
                    key={transaction.id} 
                    transaction={transaction} 
                    onDelete={onDelete}
                    onEdit={() => setEditingTransaction(transaction)}
                    dateLocale={dateLocale}
                    formatCurrency={formatCurrency}
                    userCurrency={userCurrency}
                    formatConverted={formatConverted}
                    walletName={transaction.wallet_id ? (walletMap[transaction.wallet_id]?.institution || walletMap[transaction.wallet_id]?.name) : undefined}
                    walletIcon={transaction.wallet_id ? walletMap[transaction.wallet_id]?.icon : undefined}
                    t={t}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedIds.has(transaction.id)}
                    onToggleSelect={() => toggleSelection(transaction.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
          onUpdate={onUpdate}
        />
      )}

      <BatchWalletAssignDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        selectedCount={selectedIds.size}
        onConfirm={handleBatchConfirm}
      />

      {/* Upgrade dialog for non-premium users */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {t('transactions.batchActions.premiumOnly')}
            </DialogTitle>
            <DialogDescription>
              {t('subscription.featureLockedDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => {
              setShowUpgradeDialog(false);
              window.location.href = '/upgrade';
            }}>
              {t('subscription.upgrade')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const TransactionItem = ({ 
  transaction, 
  onDelete,
  onEdit,
  dateLocale,
  formatCurrency,
  userCurrency,
  formatConverted,
  walletName,
  walletIcon,
  t,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}: { 
  transaction: Transaction; 
  onDelete: (id: string) => void;
  onEdit: () => void;
  dateLocale: Locale;
  formatCurrency: (amount: number) => string;
  userCurrency: SupportedCurrency;
  formatConverted: (amount: number, from: SupportedCurrency) => string;
  walletName?: string;
  walletIcon?: string;
  t: (key: string) => string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) => {
  const isMobile = useIsMobile();
  const transactionCurrency = transaction.currency || 'BRL';
  const isDifferentCurrency = transactionCurrency !== userCurrency;
  
  // Translate category name if it's a default category
  const categoryKey = getCategoryTranslationKey(transaction.category, transaction.type);
  const displayCategory = categoryKey ? t(`transactions.categories.${categoryKey}`) : transaction.category;

  const formattedAmount = isDifferentCurrency 
    ? formatConverted(transaction.amount, transactionCurrency as SupportedCurrency)
    : formatCurrency(transaction.amount);

  const handleClick = () => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect();
    }
  };

  const ActionsMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="min-w-[44px] min-h-[44px] flex-shrink-0 text-muted-foreground"
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-popover z-50"
      >
        <DropdownMenuItem 
          onClick={onEdit}
          className="min-h-[44px] gap-3 cursor-pointer"
        >
          <Pencil className="w-4 h-4" />
          {t('common.edit')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onDelete(transaction.id)}
          className="min-h-[44px] gap-3 text-destructive focus:text-destructive cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          {t('common.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  
  return (
    <div 
      className={`p-3 sm:p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors group overflow-hidden ${
        isSelectionMode ? 'cursor-pointer' : ''
      } ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}
      onClick={handleClick}
    >
      {/* Mobile Layout - Stacked */}
      {isMobile ? (
        <div className="flex flex-col gap-2">
          {/* Header row: Checkbox/Icon, Description, Menu */}
          <div className="flex items-start gap-3">
            {isSelectionMode ? (
              <div className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center flex-shrink-0">
                <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
              </div>
            ) : (
              <div className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
                transaction.type === 'INCOME' 
                  ? 'bg-income/20' 
                  : 'bg-expense/20'
              }`}>
                {transaction.type === 'INCOME' ? (
                  <ArrowUpCircle className="w-5 h-5 text-income" />
                ) : (
                  <ArrowDownCircle className="w-5 h-5 text-expense" />
                )}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {transaction.description}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {format(parseDateString(transaction.date), "d MMM yyyy", { locale: dateLocale })}
                {walletName && (
                  <span> • {walletIcon} {walletName}</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {displayCategory} • +{transaction.xp_earned} XP
              </p>
            </div>

            {!isSelectionMode && <ActionsMenu />}
          </div>

          {/* Amount row */}
          <div className="ml-[56px]">
            <p className={`text-sm font-bold ${
              transaction.type === 'INCOME' ? 'text-income' : 'text-expense'
            }`}>
              {transaction.type === 'INCOME' ? '+' : '-'}{formattedAmount}
            </p>
            {isDifferentCurrency && (
              <p className="text-xs text-muted-foreground">
                ({formatMoney(transaction.amount, transactionCurrency as SupportedCurrency)})
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Desktop Layout - Horizontal */
        <div className="flex items-center gap-3">
          {isSelectionMode ? (
            <div className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center flex-shrink-0">
              <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
            </div>
          ) : (
            <div className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
              transaction.type === 'INCOME' 
                ? 'bg-income/20' 
                : 'bg-expense/20'
            }`}>
              {transaction.type === 'INCOME' ? (
                <ArrowUpCircle className="w-5 h-5 text-income" />
              ) : (
                <ArrowDownCircle className="w-5 h-5 text-expense" />
              )}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {transaction.description}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(parseDateString(transaction.date), "d MMM yyyy", { locale: dateLocale })}
              {walletName && (
                <span> • {walletIcon} {walletName}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {displayCategory} • +{transaction.xp_earned} XP
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className={`text-sm font-bold ${
              transaction.type === 'INCOME' ? 'text-income' : 'text-expense'
            }`}>
              {transaction.type === 'INCOME' ? '+' : '-'}{formattedAmount}
            </p>
            {isDifferentCurrency && (
              <p className="text-xs text-muted-foreground">
                ({formatMoney(transaction.amount, transactionCurrency as SupportedCurrency)})
              </p>
            )}
          </div>

          {!isSelectionMode && (
            <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="min-w-[44px] min-h-[44px] text-muted-foreground hover:text-foreground"
                onClick={onEdit}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="min-w-[44px] min-h-[44px] text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(transaction.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
