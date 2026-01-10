import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Locale } from 'date-fns';
import { Transaction, SupportedCurrency } from '@/types/database';
import { ArrowUpCircle, ArrowDownCircle, Trash2, Pencil, MoreVertical, CheckSquare, X, Wallet, Lock, Copy, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Calendar, CreditCard, Landmark, Banknote, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subDays, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { parseDateString } from '@/lib/dateUtils';
import { formatMoney } from '@/lib/formatters';
import { getCategoryTranslationKey } from '@/lib/gameLogic';
import { EditTransactionDialog } from './EditTransactionDialog';
import { BatchWalletAssignDialog } from './BatchWalletAssignDialog';
import { useWallets } from '@/hooks/useWallets';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useWalletTransfers, WalletTransfer } from '@/hooks/useWalletTransfers';
import { EditTransferDialog } from '@/components/wallets/EditTransferDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  onBatchDelete?: (transactionIds: string[]) => Promise<{ error: Error | null; deletedCount: number }>;
  onDuplicate?: (transaction: Transaction) => void;
}

interface MonthGroup {
  key: string;
  label: string;
  transactions: Transaction[];
  transfers: WalletTransfer[];
  totalIncome: number;
  totalExpense: number;
  totalTransfers: number;
  openingBalance: number;
  closingBalance: number;
}

type SourceTab = 'account' | 'card' | 'loan' | 'transfer';

export const TransactionsList = ({ transactions, onDelete, onUpdate, onBatchUpdateWallet, onBatchDelete, onDuplicate }: TransactionsListProps) => {
  const { t } = useTranslation();
  const { dateLocale } = useLanguage();
  const { formatCurrency, currency: userCurrency, formatConverted } = useCurrency();
  const { wallets, activeWallets, inactiveWallets } = useWallets();
  const { creditCards } = useCreditCards();
  const { transfers, updateTransfer, deleteTransfer, getWalletName, getWalletIcon } = useWalletTransfers();
  const { isPremium, checkFeature } = useSubscription();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<WalletTransfer | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [activeSourceTab, setActiveSourceTab] = useState<SourceTab>('account');
  
  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canBatchEdit = checkFeature('batch_edit') || isPremium;

  // Calculate total wallet balance
  const totalWalletBalance = useMemo(() => {
    return activeWallets.reduce((sum, w) => sum + w.current_balance, 0);
  }, [activeWallets]);

  // Create wallet lookup map
  const walletMap = useMemo(() => {
    return wallets.reduce((acc, w) => {
      acc[w.id] = w;
      return acc;
    }, {} as Record<string, typeof wallets[0]>);
  }, [wallets]);

  // Create credit card lookup map
  const creditCardMap = useMemo(() => {
    return creditCards.reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {} as Record<string, typeof creditCards[0]>);
  }, [creditCards]);

  // Filter transactions by source type
  const filteredBySource = useMemo(() => {
    return transactions.filter(tx => {
      const sourceType = tx.source_type || 'account';
      if (activeSourceTab === 'account') {
        return sourceType === 'account' && !tx.credit_card_id;
      } else if (activeSourceTab === 'card') {
        return sourceType === 'card' || tx.credit_card_id;
      } else if (activeSourceTab === 'loan') {
        return sourceType === 'loan';
      }
      return true;
    });
  }, [transactions, activeSourceTab]);

  // Count transactions by source for badges
  const sourceCounts = useMemo(() => {
    const accountTxs = transactions.filter(tx => (tx.source_type === 'account' || !tx.source_type) && !tx.credit_card_id);
    const cardTxs = transactions.filter(tx => tx.source_type === 'card' || tx.credit_card_id);
    const loanTxs = transactions.filter(tx => tx.source_type === 'loan');
    return {
      account: accountTxs.length,
      card: cardTxs.length,
      loan: loanTxs.length,
      transfer: transfers.length,
    };
  }, [transactions, transfers]);

  // Group transactions by month with summaries (including transfers)
  const monthGroups = useMemo(() => {
    const groups: Record<string, MonthGroup> = {};
    
    // Add transactions to groups
    filteredBySource.forEach(tx => {
      const txDate = parseDateString(tx.date);
      const monthKey = format(txDate, 'yyyy-MM');
      const monthLabel = format(txDate, 'MMMM yyyy', { locale: dateLocale });
      
      if (!groups[monthKey]) {
        groups[monthKey] = {
          key: monthKey,
          label: monthLabel,
          transactions: [],
          transfers: [],
          totalIncome: 0,
          totalExpense: 0,
          totalTransfers: 0,
          openingBalance: 0,
          closingBalance: 0,
        };
      }
      
      groups[monthKey].transactions.push(tx);
      
      if (tx.type === 'INCOME') {
        groups[monthKey].totalIncome += tx.amount;
      } else {
        groups[monthKey].totalExpense += tx.amount;
      }
    });
    
    // Add transfers to their respective months
    transfers.forEach(transfer => {
      const transferDate = parseDateString(transfer.date);
      const monthKey = format(transferDate, 'yyyy-MM');
      const monthLabel = format(transferDate, 'MMMM yyyy', { locale: dateLocale });
      
      if (!groups[monthKey]) {
        groups[monthKey] = {
          key: monthKey,
          label: monthLabel,
          transactions: [],
          transfers: [],
          totalIncome: 0,
          totalExpense: 0,
          totalTransfers: 0,
          openingBalance: 0,
          closingBalance: 0,
        };
      }
      
      groups[monthKey].transfers.push(transfer);
      groups[monthKey].totalTransfers += transfer.amount;
    });
    
    // Calculate opening/closing balance (rolling) and sort items within each month
    const sortedMonthKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    let rollingBalance = 0;

    sortedMonthKeys.forEach((monthKey) => {
      const group = groups[monthKey];
      group.openingBalance = rollingBalance;
      group.closingBalance = rollingBalance + group.totalIncome + group.totalTransfers - group.totalExpense;
      rollingBalance = group.closingBalance;

      group.transactions.sort((a, b) => parseDateString(b.date).getTime() - parseDateString(a.date).getTime());
      group.transfers.sort((a, b) => parseDateString(b.date).getTime() - parseDateString(a.date).getTime());
    });
    
    // Sort months from newest to oldest
    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
  }, [filteredBySource, transfers, dateLocale]);

  // Reset expanded months when switching tabs
  useEffect(() => {
    setExpandedMonths(new Set());
  }, [activeSourceTab]);

  // Auto-expand current month
  useMemo(() => {
    if (monthGroups.length > 0 && expandedMonths.size === 0) {
      const currentMonthKey = format(new Date(), 'yyyy-MM');
      const hasCurrentMonth = monthGroups.some(g => g.key === currentMonthKey);
      if (hasCurrentMonth) {
        setExpandedMonths(new Set([currentMonthKey]));
      } else if (monthGroups[0]) {
        setExpandedMonths(new Set([monthGroups[0].key]));
      }
    }
  }, [monthGroups]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

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
    if (selectedIds.size === filteredBySource.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBySource.map(t => t.id)));
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

  const handleBatchDelete = async () => {
    if (!onBatchDelete) return;
    
    setIsDeleting(true);
    const result = await onBatchDelete(Array.from(selectedIds));
    setIsDeleting(false);
    
    if (!result.error) {
      setShowDeleteDialog(false);
      exitSelectionMode();
    }
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
    <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.4s' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-1">
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
                <span className="hidden sm:inline">{t('transactions.batchActions.select')}</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">{t('transactions.batchActions.select')}</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Source Type Tabs */}
      <Tabs value={activeSourceTab} onValueChange={(v) => setActiveSourceTab(v as SourceTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="account" className="flex items-center gap-1.5 py-2 text-xs">
                  <Landmark className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Contas</span>
                  {sourceCounts.account > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5">
                      {sourceCounts.account}
                    </Badge>
                  )}
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Transações de contas bancárias</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="card" className="flex items-center gap-1.5 py-2 text-xs">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cartões</span>
                  {sourceCounts.card > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5">
                      {sourceCounts.card}
                    </Badge>
                  )}
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Transações de cartões de crédito</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="loan" className="flex items-center gap-1.5 py-2 text-xs">
                  <Banknote className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Empréstimos</span>
                  {sourceCounts.loan > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5">
                      {sourceCounts.loan}
                    </Badge>
                  )}
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Transações de empréstimos e financiamentos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="transfer" className="flex items-center gap-1.5 py-2 text-xs">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Transferências</span>
                  {sourceCounts.transfer > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5">
                      {sourceCounts.transfer}
                    </Badge>
                  )}
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Transferências entre carteiras</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TabsList>
      </Tabs>

      {/* Selection mode action bar */}
      {isSelectionMode && (
        <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3 border border-primary/20">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedIds.size === filteredBySource.length && filteredBySource.length > 0}
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
              <span className="hidden sm:inline">{t('transactions.batchActions.assignWallet')}</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={selectedIds.size === 0}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('transactions.batchActions.delete')}</span>
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

      {/* Month cards or empty state - for transactions */}
      {activeSourceTab !== 'transfer' && (
        <>
          {filteredBySource.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 shadow-md text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                {activeSourceTab === 'account' && <Landmark className="w-6 h-6 text-muted-foreground" />}
                {activeSourceTab === 'card' && <CreditCard className="w-6 h-6 text-muted-foreground" />}
                {activeSourceTab === 'loan' && <Banknote className="w-6 h-6 text-muted-foreground" />}
              </div>
              <p className="text-sm text-muted-foreground">
                {activeSourceTab === 'account' && 'Nenhuma transação de conta bancária'}
                {activeSourceTab === 'card' && 'Nenhuma transação de cartão de crédito'}
                {activeSourceTab === 'loan' && 'Nenhuma transação de empréstimo'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {monthGroups.map((group) => (
                <MonthCard
                  key={group.key}
                  group={group}
                  isExpanded={expandedMonths.has(group.key)}
                  onToggle={() => toggleMonth(group.key)}
                  userCurrency={userCurrency}
                  walletMap={walletMap}
                  creditCardMap={creditCardMap}
                  dateLocale={dateLocale}
                  formatCurrency={formatCurrency}
                  formatConverted={formatConverted}
                  t={t}
                  onDelete={onDelete}
                  onEdit={setEditingTransaction}
                  onDuplicate={onDuplicate}
                  isSelectionMode={isSelectionMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelection}
                  totalWalletBalance={totalWalletBalance}
                  getWalletName={getWalletName}
                  getWalletIcon={getWalletIcon}
                  onEditTransfer={setEditingTransfer}
                />
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
        </>
      )}

      {/* Transfers list */}
      {activeSourceTab === 'transfer' && (
        <>
          {transfers.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 shadow-md text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <ArrowRightLeft className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhuma transferência entre carteiras
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transfers.map((transfer) => (
                <TransferListItem
                  key={transfer.id}
                  transfer={transfer}
                  getWalletName={getWalletName}
                  getWalletIcon={getWalletIcon}
                  dateLocale={dateLocale}
                  formatCurrency={(amt, cur) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: cur }).format(amt)}
                  onEdit={() => setEditingTransfer(transfer)}
                />
              ))}
            </div>
          )}

          {editingTransfer && (
            <EditTransferDialog
              transfer={editingTransfer}
              wallets={[...activeWallets, ...inactiveWallets]}
              open={!!editingTransfer}
              onOpenChange={(open) => !open && setEditingTransfer(null)}
              onUpdate={updateTransfer}
              onDelete={deleteTransfer}
            />
          )}
        </>
      )}

      <BatchWalletAssignDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        selectedCount={selectedIds.size}
        onConfirm={handleBatchConfirm}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              {t('transactions.batchActions.deleteTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('transactions.batchActions.deleteDescription', { count: selectedIds.size })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleBatchDelete} disabled={isDeleting}>
              {isDeleting ? t('common.loading') : t('transactions.batchActions.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              window.location.href = '/premium';
            }}>
              {t('subscription.upgrade')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface MonthCardProps {
  group: MonthGroup;
  isExpanded: boolean;
  onToggle: () => void;
  userCurrency: SupportedCurrency;
  walletMap: Record<string, any>;
  creditCardMap: Record<string, any>;
  dateLocale: Locale;
  formatCurrency: (amount: number) => string;
  formatConverted: (amount: number, from: SupportedCurrency) => string;
  t: (key: string) => string;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onDuplicate?: (transaction: Transaction) => void;
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  totalWalletBalance: number;
  getWalletName: (id: string) => string;
  getWalletIcon: (id: string) => string;
  onEditTransfer: (transfer: WalletTransfer) => void;
}

const MonthCard = ({
  group,
  isExpanded,
  onToggle,
  userCurrency,
  walletMap,
  creditCardMap,
  dateLocale,
  formatCurrency,
  formatConverted,
  t,
  onDelete,
  onEdit,
  onDuplicate,
  isSelectionMode,
  selectedIds,
  onToggleSelect,
  totalWalletBalance,
  getWalletName,
  getWalletIcon,
  onEditTransfer,
}: MonthCardProps) => {
  const openingBalance = group.openingBalance;
  const closingBalance = group.closingBalance;
  const isPositive = closingBalance >= 0;
  
  return (
    <Card className="overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger className="w-full">
          <div className="p-3 flex items-center gap-2 hover:bg-muted/50 transition-colors">
            <div className={cn(
              "p-1.5 rounded-lg shrink-0",
              isPositive ? "bg-income/10" : "bg-expense/10"
            )}>
              <Calendar className={cn(
                "w-4 h-4",
                isPositive ? "text-income" : "text-expense"
              )} />
            </div>
            
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-medium text-sm capitalize truncate">{group.label}</p>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {group.transactions.length + group.transfers.length} {(group.transactions.length + group.transfers.length) === 1 ? 'lançamento' : 'lançamentos'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Wallet className="w-3 h-3" />
                  Saldo inicial: {formatMoney(openingBalance, userCurrency)}
                </span>
              </div>
            </div>
            
            <div className="text-right shrink-0">
              <p className={cn(
                "font-bold text-sm",
                isPositive ? "text-income" : "text-expense"
              )}>
                {isPositive ? '+' : ''}{formatMoney(closingBalance, userCurrency)}
              </p>
            </div>
            
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-1.5 border-t bg-muted/30 pt-2">
            {/* Combined and sorted by date with running balance */}
            {(() => {
              // Priority for same-day sorting: transfers first, then income, then expenses
              const getPriority = (entry: { type: 'transaction' | 'transfer', item: Transaction | WalletTransfer }) => {
                if (entry.type === 'transfer') return 0; // Transfers first
                const tx = entry.item as Transaction;
                return tx.type === 'INCOME' ? 1 : 2; // Income before expenses
              };

              // Combine and sort: oldest first, then by priority (transfers > income > expenses)
              const allItems = [
                ...group.transactions.map(tx => ({ 
                  type: 'transaction' as const, 
                  item: tx, 
                  date: parseDateString(tx.date),
                  effect: tx.type === 'INCOME' ? tx.amount : -tx.amount
                })),
                ...group.transfers.map(tf => ({ 
                  type: 'transfer' as const, 
                  item: tf, 
                  date: parseDateString(tf.date),
                  effect: tf.amount
                })),
              ].sort((a, b) => {
                const dateCompare = a.date.getTime() - b.date.getTime();
                if (dateCompare !== 0) return dateCompare;
                // Same day: sort by priority (transfers > income > expenses)
                return getPriority(a) - getPriority(b);
              });

              // Calculate running balance for each item
              let runningBalance = group.openingBalance;
              const itemsWithBalance = allItems.map(entry => {
                runningBalance += entry.effect;
                return { ...entry, balanceAfter: runningBalance };
              });

              // Reverse to show newest first
              return itemsWithBalance.reverse().map(entry => 
                entry.type === 'transaction' ? (
                  <TransactionItem
                    key={entry.item.id}
                    transaction={entry.item as Transaction}
                    onDelete={onDelete}
                    onEdit={() => onEdit(entry.item as Transaction)}
                    onDuplicate={onDuplicate ? () => onDuplicate(entry.item as Transaction) : undefined}
                    dateLocale={dateLocale}
                    formatCurrency={formatCurrency}
                    userCurrency={userCurrency}
                    formatConverted={formatConverted}
                    walletName={(entry.item as Transaction).wallet_id ? (walletMap[(entry.item as Transaction).wallet_id!]?.institution || walletMap[(entry.item as Transaction).wallet_id!]?.name) : undefined}
                    walletIcon={(entry.item as Transaction).wallet_id ? walletMap[(entry.item as Transaction).wallet_id!]?.icon : undefined}
                    creditCardName={(entry.item as Transaction).credit_card_id ? creditCardMap[(entry.item as Transaction).credit_card_id!]?.name : undefined}
                    t={t}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedIds.has(entry.item.id)}
                    onToggleSelect={() => onToggleSelect(entry.item.id)}
                    runningBalance={entry.balanceAfter}
                  />
                ) : (
                  <MonthTransferItem
                    key={entry.item.id}
                    transfer={entry.item as WalletTransfer}
                    getWalletName={getWalletName}
                    getWalletIcon={getWalletIcon}
                    dateLocale={dateLocale}
                    userCurrency={userCurrency}
                    onEdit={() => onEditTransfer(entry.item as WalletTransfer)}
                    runningBalance={entry.balanceAfter}
                  />
                )
              );
            })()}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

const TransactionItem = ({ 
  transaction, 
  onDelete,
  onEdit,
  onDuplicate,
  dateLocale,
  formatCurrency,
  userCurrency,
  formatConverted,
  walletName,
  walletIcon,
  creditCardName,
  t,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  runningBalance,
}: {
  transaction: Transaction; 
  onDelete: (id: string) => void;
  onEdit: () => void;
  onDuplicate?: () => void;
  dateLocale: Locale;
  formatCurrency: (amount: number) => string;
  userCurrency: SupportedCurrency;
  formatConverted: (amount: number, from: SupportedCurrency) => string;
  walletName?: string;
  walletIcon?: string;
  creditCardName?: string;
  t: (key: string) => string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  runningBalance?: number;
}) => {
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
  
  return (
    <div 
      className={cn(
        "flex items-center justify-between py-2 px-3 bg-background rounded-lg group",
        isSelectionMode && "cursor-pointer",
        isSelected && "ring-2 ring-primary bg-primary/5"
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isSelectionMode ? (
          <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
        ) : (
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            transaction.type === 'INCOME' ? 'bg-income/20' : 'bg-expense/20'
          )}>
            {transaction.type === 'INCOME' ? (
              <ArrowUpCircle className="w-4 h-4 text-income" />
            ) : (
              <ArrowDownCircle className="w-4 h-4 text-expense" />
            )}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{transaction.description}</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {format(parseDateString(transaction.date), "d MMM", { locale: dateLocale })}
            {transaction.supplier && <span> • {transaction.supplier}</span>}
            {' • '}{displayCategory}
            {walletName && <span> • {walletIcon} {walletName}</span>}
            {creditCardName && <span> • 💳 {creditCardName}</span>}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <div className="flex flex-col items-end">
          <p className={cn(
            "text-sm font-medium",
            transaction.type === 'INCOME' ? 'text-income' : 'text-expense'
          )}>
            {transaction.type === 'INCOME' ? '+' : '-'}{formattedAmount}
          </p>
          {runningBalance !== undefined && (
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded mt-0.5",
              "bg-muted",
              runningBalance >= 0 ? "text-income" : "text-expense"
            )}>
              {formatMoney(runningBalance, userCurrency)}
            </span>
          )}
        </div>
        
        {!isSelectionMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Pencil className="w-4 h-4" />
                {t('common.edit')}
              </DropdownMenuItem>
              {onDuplicate && (
                <DropdownMenuItem onClick={onDuplicate} className="gap-2">
                  <Copy className="w-4 h-4" />
                  {t('transactions.duplicate')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(transaction.id)}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

// Transfer list item component (for separate tab)
interface TransferListItemProps {
  transfer: WalletTransfer;
  getWalletName: (id: string) => string;
  getWalletIcon: (id: string) => string;
  dateLocale: Locale;
  formatCurrency: (amount: number, currency: string) => string;
  onEdit: () => void;
}

const TransferListItem = ({ transfer, getWalletName, getWalletIcon, dateLocale, formatCurrency, onEdit }: TransferListItemProps) => {
  return (
    <div 
      className="flex items-center gap-3 p-3 bg-card rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={onEdit}
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <ArrowRightLeft className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-sm font-medium truncate">
          <span>{getWalletIcon(transfer.from_wallet_id)}</span>
          <span className="truncate">{getWalletName(transfer.from_wallet_id)}</span>
          <ArrowRightLeft className="w-3 h-3 text-muted-foreground flex-shrink-0 mx-1" />
          <span>{getWalletIcon(transfer.to_wallet_id)}</span>
          <span className="truncate">{getWalletName(transfer.to_wallet_id)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {format(parseDateString(transfer.date), 'd MMM yyyy', { locale: dateLocale })}
          {transfer.description && ` • ${transfer.description}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(transfer.amount, transfer.currency)}
        </span>
        <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

// Transfer item for inside month cards (compact version)
interface MonthTransferItemProps {
  transfer: WalletTransfer;
  getWalletName: (id: string) => string;
  getWalletIcon: (id: string) => string;
  dateLocale: Locale;
  userCurrency: SupportedCurrency;
  onEdit: () => void;
  runningBalance?: number;
}

const MonthTransferItem = ({ transfer, getWalletName, getWalletIcon, dateLocale, userCurrency, onEdit, runningBalance }: MonthTransferItemProps) => {
  return (
    <div 
      className="flex items-center gap-2 p-2 bg-card/50 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={onEdit}
    >
      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
        <ArrowRightLeft className="w-4 h-4 text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-xs font-medium truncate">
          <span>{getWalletIcon(transfer.from_wallet_id)}</span>
          <span className="truncate max-w-[60px]">{getWalletName(transfer.from_wallet_id)}</span>
          <ArrowRightLeft className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
          <span>{getWalletIcon(transfer.to_wallet_id)}</span>
          <span className="truncate max-w-[60px]">{getWalletName(transfer.to_wallet_id)}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {format(parseDateString(transfer.date), 'd MMM', { locale: dateLocale })}
          {transfer.description && ` • ${transfer.description}`}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex flex-col items-end">
          <span className="text-xs font-semibold text-blue-500">
            {formatMoney(transfer.amount, userCurrency)}
          </span>
          {runningBalance !== undefined && (
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded mt-0.5",
              "bg-muted",
              runningBalance >= 0 ? "text-income" : "text-expense"
            )}>
              {formatMoney(runningBalance, userCurrency)}
            </span>
          )}
        </div>
        <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};
