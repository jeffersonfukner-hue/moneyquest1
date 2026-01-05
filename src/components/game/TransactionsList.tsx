import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Locale } from 'date-fns';
import { Transaction, SupportedCurrency } from '@/types/database';
import { ArrowUpCircle, ArrowDownCircle, Trash2, Pencil, MoreVertical, CheckSquare, X, Wallet, Lock, Copy, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Calendar, CreditCard, Landmark, Banknote } from 'lucide-react';
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
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

type SourceTab = 'account' | 'card' | 'loan';

export const TransactionsList = ({ transactions, onDelete, onUpdate, onBatchUpdateWallet, onBatchDelete, onDuplicate }: TransactionsListProps) => {
  const { t } = useTranslation();
  const { dateLocale } = useLanguage();
  const { formatCurrency, currency: userCurrency, formatConverted } = useCurrency();
  const { wallets } = useWallets();
  const { isPremium, checkFeature } = useSubscription();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
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

  // Create wallet lookup map
  const walletMap = useMemo(() => {
    return wallets.reduce((acc, w) => {
      acc[w.id] = w;
      return acc;
    }, {} as Record<string, typeof wallets[0]>);
  }, [wallets]);

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
    };
  }, [transactions]);

  // Group transactions by month with summaries
  const monthGroups = useMemo(() => {
    const groups: Record<string, MonthGroup> = {};
    
    filteredBySource.forEach(tx => {
      const txDate = parseDateString(tx.date);
      const monthKey = format(txDate, 'yyyy-MM');
      const monthLabel = format(txDate, 'MMMM yyyy', { locale: dateLocale });
      
      if (!groups[monthKey]) {
        groups[monthKey] = {
          key: monthKey,
          label: monthLabel,
          transactions: [],
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
        };
      }
      
      groups[monthKey].transactions.push(tx);
      
      if (tx.type === 'INCOME') {
        groups[monthKey].totalIncome += tx.amount;
      } else {
        groups[monthKey].totalExpense += tx.amount;
      }
    });
    
    // Calculate balance and sort transactions within each month
    Object.values(groups).forEach(group => {
      group.balance = group.totalIncome - group.totalExpense;
      group.transactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });
    
    // Sort months from newest to oldest
    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
  }, [filteredBySource, dateLocale]);

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
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="account" className="flex items-center gap-1.5 py-2 text-xs">
            <Landmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Contas</span>
            {sourceCounts.account > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5">
                {sourceCounts.account}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="card" className="flex items-center gap-1.5 py-2 text-xs">
            <CreditCard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cartões</span>
            {sourceCounts.card > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5">
                {sourceCounts.card}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="loan" className="flex items-center gap-1.5 py-2 text-xs">
            <Banknote className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Empréstimos</span>
            {sourceCounts.loan > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5">
                {sourceCounts.loan}
              </Badge>
            )}
          </TabsTrigger>
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

      {/* Month cards or empty state */}
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
}

const MonthCard = ({
  group,
  isExpanded,
  onToggle,
  userCurrency,
  walletMap,
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
}: MonthCardProps) => {
  const isPositive = group.balance >= 0;
  
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
                  {group.transactions.length} {group.transactions.length === 1 ? 'lançamento' : 'lançamentos'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-income flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  {formatMoney(group.totalIncome, userCurrency)}
                </span>
                <span className="text-[10px] text-expense flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" />
                  {formatMoney(group.totalExpense, userCurrency)}
                </span>
              </div>
            </div>
            
            <div className="text-right shrink-0">
              <p className={cn(
                "font-bold text-sm",
                isPositive ? "text-income" : "text-expense"
              )}>
                {isPositive ? '+' : ''}{formatMoney(group.balance, userCurrency)}
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
            {group.transactions.map(transaction => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onDelete={onDelete}
                onEdit={() => onEdit(transaction)}
                onDuplicate={onDuplicate ? () => onDuplicate(transaction) : undefined}
                dateLocale={dateLocale}
                formatCurrency={formatCurrency}
                userCurrency={userCurrency}
                formatConverted={formatConverted}
                walletName={transaction.wallet_id ? (walletMap[transaction.wallet_id]?.institution || walletMap[transaction.wallet_id]?.name) : undefined}
                walletIcon={transaction.wallet_id ? walletMap[transaction.wallet_id]?.icon : undefined}
                t={t}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(transaction.id)}
                onToggleSelect={() => onToggleSelect(transaction.id)}
              />
            ))}
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
  t,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
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
  t: (key: string) => string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
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
            {' • '}{displayCategory}
            {walletName && <span> • {walletIcon} {walletName}</span>}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <p className={cn(
          "text-sm font-medium",
          transaction.type === 'INCOME' ? 'text-income' : 'text-expense'
        )}>
          {transaction.type === 'INCOME' ? '+' : '-'}{formattedAmount}
        </p>
        
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
