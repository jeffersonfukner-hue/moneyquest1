import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format, addDays, addWeeks, addMonths, addYears, isBefore, isAfter, startOfDay } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Repeat, 
  Trash2, 
  Pause, 
  Play,
  CalendarClock,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScheduledTransferDialog } from '@/components/wallets/ScheduledTransferDialog';
import { ScheduledTransactionDialog } from '@/components/wallets/ScheduledTransactionDialog';
import { useWalletTransfers, ScheduledTransfer } from '@/hooks/useWalletTransfers';
import { useScheduledTransactions, ScheduledTransaction } from '@/hooks/useScheduledTransactions';
import { useCategories } from '@/hooks/useCategories';
import { SupportedCurrency } from '@/types/database';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const getDateLocale = (lang: string) => {
  if (lang.startsWith('pt')) return ptBR;
  if (lang.startsWith('es')) return es;
  return enUS;
};

type UpcomingEntry = {
  type: 'transfer';
  transfer: ScheduledTransfer;
  scheduledDate: Date;
} | {
  type: 'transaction';
  transaction: ScheduledTransaction;
  scheduledDate: Date;
};

const ScheduledTransactions = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { 
    scheduledTransfers, 
    loading: loadingTransfers, 
    getWalletName, 
    getWalletIcon,
    toggleScheduledTransfer,
    deleteScheduledTransfer 
  } = useWalletTransfers();
  
  const {
    scheduledTransactions,
    loading: loadingTransactions,
    toggleScheduledTransaction,
    deleteScheduledTransaction,
    createScheduledTransaction,
    updateScheduledTransaction,
  } = useScheduledTransactions();
  
  const { categories } = useCategories();
  
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ScheduledTransaction | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'all'>('upcoming');
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'transfers' | 'transactions'>('all');

  const handleEditTransaction = (transaction: ScheduledTransaction) => {
    setEditingTransaction(transaction);
    setShowTransactionDialog(true);
  };

  const handleCloseTransactionDialog = (open: boolean) => {
    setShowTransactionDialog(open);
    if (!open) {
      setEditingTransaction(null);
    }
  };

  const dateLocale = getDateLocale(i18n.language);
  const loading = loadingTransfers || loadingTransactions;

  // Helper functions using shared data
  const getCategoryIcon = (categoryName: string): string => {
    const category = categories.find(c => c.name === categoryName);
    return category?.icon || '📋';
  };

  const getTxWalletName = (walletId: string | null): string => {
    return getWalletName(walletId);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency as SupportedCurrency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getTransferFrequencyLabel = (transfer: ScheduledTransfer) => {
    switch (transfer.frequency) {
      case 'daily':
        return t('scheduled.daily');
      case 'weekly':
        return `${t('scheduled.weekly')} (${t(`wallets.days.${['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][transfer.day_of_week || 0]}`)})`;
      case 'monthly':
        return `${t('scheduled.monthly')} (${t('wallets.dayNumber', { day: transfer.day_of_month })})`;
      default:
        return transfer.frequency;
    }
  };

  const getTransactionFrequencyLabel = (tx: ScheduledTransaction) => {
    switch (tx.frequency) {
      case 'daily':
        return t('scheduled.daily');
      case 'weekly':
        return `${t('scheduled.weekly')} (${t(`wallets.days.${['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][tx.day_of_week || 0]}`)})`;
      case 'monthly':
        return `${t('scheduled.monthly')} (${t('wallets.dayNumber', { day: tx.day_of_month })})`;
      case 'yearly':
        return `${t('scheduled.yearly')} (${t(`scheduled.months.${['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'][tx.month_of_year ? tx.month_of_year - 1 : 0]}`)})`;
      default:
        return tx.frequency;
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return '📅';
      case 'weekly':
        return '📆';
      case 'monthly':
        return '🗓️';
      case 'yearly':
        return '📋';
      default:
        return '⏰';
    }
  };

  // Generate upcoming entries for the next 30 days - memoized to prevent flickering
  const upcomingEntries = useMemo((): UpcomingEntry[] => {
    const entries: UpcomingEntry[] = [];
    const today = startOfDay(new Date());
    const endDate = addDays(today, 30);

    // Add transfers
    scheduledTransfers
      .filter(t => t.is_active)
      .forEach(transfer => {
        let currentDate = new Date(transfer.next_run_date);

        while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
          if (isAfter(currentDate, today) || currentDate.getTime() === today.getTime()) {
            entries.push({
              type: 'transfer',
              transfer,
              scheduledDate: new Date(currentDate),
            });
          }

          if (transfer.frequency === 'daily') {
            currentDate = addDays(currentDate, 1);
          } else if (transfer.frequency === 'weekly') {
            currentDate = addWeeks(currentDate, 1);
          } else if (transfer.frequency === 'monthly') {
            currentDate = addMonths(currentDate, 1);
          } else {
            break;
          }
        }
      });

    // Add transactions
    scheduledTransactions
      .filter(t => t.is_active)
      .forEach(transaction => {
        let currentDate = new Date(transaction.next_run_date);

        while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
          if (isAfter(currentDate, today) || currentDate.getTime() === today.getTime()) {
            entries.push({
              type: 'transaction',
              transaction,
              scheduledDate: new Date(currentDate),
            });
          }

          if (transaction.frequency === 'daily') {
            currentDate = addDays(currentDate, 1);
          } else if (transaction.frequency === 'weekly') {
            currentDate = addWeeks(currentDate, 1);
          } else if (transaction.frequency === 'monthly') {
            currentDate = addMonths(currentDate, 1);
          } else if (transaction.frequency === 'yearly') {
            currentDate = addYears(currentDate, 1);
          } else {
            break;
          }
        }
      });

    return entries.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }, [scheduledTransfers, scheduledTransactions]);

  // Filter entries based on sub tab - memoized
  const filteredUpcoming = useMemo(() => 
    upcomingEntries.filter(entry => {
      if (activeSubTab === 'all') return true;
      return entry.type === (activeSubTab === 'transfers' ? 'transfer' : 'transaction');
    }), [upcomingEntries, activeSubTab]);

  // Group entries by date - memoized
  const groupedEntries = useMemo(() => 
    filteredUpcoming.reduce((acc, entry) => {
      const dateKey = format(entry.scheduledDate, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(entry);
      return acc;
    }, {} as Record<string, typeof upcomingEntries>), [filteredUpcoming]);

  // Calculate totals
  const calculateMonthlyAmount = (amount: number, frequency: string) => {
    switch (frequency) {
      case 'daily': return amount * 30;
      case 'weekly': return amount * 4;
      case 'yearly': return amount / 12;
      default: return amount;
    }
  };

  // Memoized calculations to prevent flickering
  const { totalMonthlyTransfers, totalMonthlyIncome, totalMonthlyExpenses, activeTransfersCount, activeTransactionsCount, totalActive, totalPaused } = useMemo(() => {
    const transfers = scheduledTransfers.filter(t => t.is_active);
    const activeIncome = scheduledTransactions.filter(t => t.is_active && t.type === 'INCOME');
    const activeExpenses = scheduledTransactions.filter(t => t.is_active && t.type === 'EXPENSE');
    
    return {
      totalMonthlyTransfers: transfers.reduce((sum, t) => sum + calculateMonthlyAmount(t.amount, t.frequency), 0),
      totalMonthlyIncome: activeIncome.reduce((sum, t) => sum + calculateMonthlyAmount(t.amount, t.frequency), 0),
      totalMonthlyExpenses: activeExpenses.reduce((sum, t) => sum + calculateMonthlyAmount(t.amount, t.frequency), 0),
      activeTransfersCount: transfers.length,
      activeTransactionsCount: scheduledTransactions.filter(t => t.is_active).length,
      totalActive: transfers.length + scheduledTransactions.filter(t => t.is_active).length,
      totalPaused: scheduledTransfers.filter(t => !t.is_active).length + scheduledTransactions.filter(t => !t.is_active).length,
    };
  }, [scheduledTransfers, scheduledTransactions]);

  // All scheduled items for the "All" tab - memoized
  const allScheduledItems = useMemo(() => 
    [
      ...scheduledTransfers.map(t => ({ type: 'transfer' as const, item: t })),
      ...scheduledTransactions.map(t => ({ type: 'transaction' as const, item: t })),
    ].filter(item => {
      if (activeSubTab === 'all') return true;
      return item.type === (activeSubTab === 'transfers' ? 'transfer' : 'transaction');
    }), [scheduledTransfers, scheduledTransactions, activeSubTab]);

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border safe-area-top">
        <div className="flex items-center justify-between h-14 px-4 max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-display font-bold text-lg text-foreground">
              {t('scheduled.title')}
            </h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-9 gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">{t('scheduled.add')}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowTransactionDialog(true)} className="gap-2">
                <TrendingDown className="h-4 w-4" />
                {t('scheduled.addTransaction')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowTransferDialog(true)} className="gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                {t('scheduled.addTransfer')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="p-3 space-y-3 max-w-md mx-auto pb-24">
        {/* Summary Row - More Compact */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="flex-shrink-0 bg-primary/10 rounded-full px-3 py-1.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium">{totalActive} {t('scheduled.active')}</span>
          </div>
          {totalPaused > 0 && (
            <div className="flex-shrink-0 bg-muted rounded-full px-3 py-1.5">
              <span className="text-sm text-muted-foreground">{totalPaused} {t('scheduled.paused')}</span>
            </div>
          )}
          <div className="flex-shrink-0 bg-muted/50 rounded-full px-3 py-1.5">
            <span className="text-sm text-muted-foreground">{upcomingEntries.length} próx.</span>
          </div>
        </div>

        {/* Monthly Totals - Compact Cards */}
        {totalActive > 0 && (totalMonthlyIncome > 0 || totalMonthlyExpenses > 0) && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-3 border border-green-500/20">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Receitas</span>
              </div>
              <p className="text-base font-bold text-green-600 dark:text-green-400">
                +{formatCurrency(totalMonthlyIncome, 'BRL')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl p-3 border border-red-500/20">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Despesas</span>
              </div>
              <p className="text-base font-bold text-red-600 dark:text-red-400">
                -{formatCurrency(totalMonthlyExpenses, 'BRL')}
              </p>
            </div>
          </div>
        )}

        {/* Transfer total if any */}
        {totalMonthlyTransfers > 0 && (
          <div className="flex items-center justify-between bg-primary/5 rounded-xl p-3 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowLeftRight className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Transferências/mês</p>
                <p className="text-base font-bold text-foreground">
                  {formatCurrency(totalMonthlyTransfers, 'BRL')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upcoming' | 'all')}>
          <TabsList className="grid w-full grid-cols-2 h-10">
            <TabsTrigger value="upcoming" className="gap-1.5 text-sm">
              <Calendar className="h-4 w-4" />
              {t('scheduled.upcoming')}
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-1.5 text-sm">
              <Clock className="h-4 w-4" />
              {t('scheduled.allScheduled')}
            </TabsTrigger>
          </TabsList>

          {/* Sub Tabs for filtering - Scrollable chips */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setActiveSubTab('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeSubTab === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveSubTab('transactions')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeSubTab === 'transactions'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Receitas/Despesas
            </button>
            <button
              onClick={() => setActiveSubTab('transfers')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeSubTab === 'transfers'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Transferências
            </button>
          </div>

          {/* Upcoming Tab */}
          <TabsContent value="upcoming" className="space-y-3 mt-3">
            {Object.keys(groupedEntries).length === 0 ? (
              <div className="text-center py-12">
                <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">{t('scheduled.noUpcoming')}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTransactionDialog(true)}
                  className="mt-4 gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  {t('scheduled.addTransaction')}
                </Button>
              </div>
            ) : (
              Object.entries(groupedEntries).map(([dateKey, entries]) => (
                <div key={dateKey} className="space-y-1.5">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 px-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(dateKey), 'EEEE, dd MMM', { locale: dateLocale })}
                  </h3>
                  <div className="space-y-1.5">
                    {entries.map((entry, idx) => (
                      <div 
                        key={`${entry.type}-${entry.type === 'transfer' ? entry.transfer.id : entry.transaction.id}-${idx}`} 
                        className="bg-card rounded-xl border border-border/50 p-3 shadow-sm"
                      >
                        {entry.type === 'transfer' ? (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <ArrowLeftRight className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 text-sm font-medium">
                                <span className="truncate">{getWalletName(entry.transfer.from_wallet_id)}</span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{getWalletName(entry.transfer.to_wallet_id)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                <span>{getTransferFrequencyLabel(entry.transfer)}</span>
                                {entry.transfer.total_occurrences && (
                                  <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                    {entry.transfer.remaining_occurrences}/{entry.transfer.total_occurrences}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <p className="font-semibold text-sm text-foreground">
                                {formatCurrency(entry.transfer.amount, entry.transfer.currency)}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => deleteScheduledTransfer(entry.transfer.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0 text-lg">
                              {getCategoryIcon(entry.transaction.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{entry.transaction.description}</p>
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                <span>{entry.transaction.category}</span>
                                <span>•</span>
                                <span>{getTransactionFrequencyLabel(entry.transaction)}</span>
                                {entry.transaction.total_occurrences && (
                                  <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                    {entry.transaction.remaining_occurrences}/{entry.transaction.total_occurrences}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <p className={`font-semibold text-sm ${entry.transaction.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {entry.transaction.type === 'INCOME' ? '+' : '-'}
                                {formatCurrency(entry.transaction.amount, entry.transaction.currency)}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleEditTransaction(entry.transaction)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => deleteScheduledTransaction(entry.transaction.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* All Scheduled Tab */}
          <TabsContent value="all" className="space-y-2 mt-3">
            {allScheduledItems.length === 0 ? (
              <div className="text-center py-12">
                <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">{t('scheduled.noScheduled')}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTransactionDialog(true)}
                  className="mt-4 gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  {t('scheduled.addTransaction')}
                </Button>
              </div>
            ) : (
              allScheduledItems.map((scheduled) => {
                if (scheduled.type === 'transfer') {
                  const transfer = scheduled.item as ScheduledTransfer;
                  return (
                    <div 
                      key={`transfer-${transfer.id}`}
                      className={`bg-card rounded-xl border border-border/50 p-3 shadow-sm ${!transfer.is_active ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <ArrowLeftRight className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <span className="truncate">{getWalletName(transfer.from_wallet_id)}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{getWalletName(transfer.to_wallet_id)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${transfer.is_active ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                              {transfer.is_active ? 'Ativo' : 'Pausado'}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {getTransferFrequencyLabel(transfer)}
                            </span>
                            {transfer.total_occurrences && (
                              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                {transfer.remaining_occurrences}/{transfer.total_occurrences}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className="font-semibold text-sm">
                            {formatCurrency(transfer.amount, transfer.currency)}
                          </p>
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleScheduledTransfer(transfer.id, !transfer.is_active)}
                            >
                              {transfer.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => deleteScheduledTransfer(transfer.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground pl-[52px]">
                        <Calendar className="h-3 w-3" />
                        <span>Próximo: {format(new Date(transfer.next_run_date), 'dd MMM', { locale: dateLocale })}</span>
                        {transfer.description && (
                          <>
                            <span>•</span>
                            <span className="truncate">{transfer.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  const transaction = scheduled.item as ScheduledTransaction;
                  return (
                    <div 
                      key={`transaction-${transaction.id}`}
                      className={`bg-card rounded-xl border border-border/50 p-3 shadow-sm ${!transaction.is_active ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${
                          transaction.type === 'INCOME' ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                          {getCategoryIcon(transaction.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{transaction.description}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${transaction.is_active ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                              {transaction.is_active ? 'Ativo' : 'Pausado'}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              transaction.type === 'INCOME' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                            }`}>
                              {transaction.type === 'INCOME' ? 'Receita' : 'Despesa'}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {getTransactionFrequencyLabel(transaction)}
                            </span>
                            {transaction.total_occurrences && (
                              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                {transaction.remaining_occurrences}/{transaction.total_occurrences}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <p className={`font-semibold text-sm ${transaction.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {transaction.type === 'INCOME' ? '+' : '-'}
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </p>
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEditTransaction(transaction)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleScheduledTransaction(transaction.id, !transaction.is_active)}
                            >
                              {transaction.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => deleteScheduledTransaction(transaction.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground pl-[52px]">
                        <Calendar className="h-3 w-3" />
                        <span>Próximo: {format(new Date(transaction.next_run_date), 'dd MMM', { locale: dateLocale })}</span>
                        {transaction.wallet_id && (
                          <>
                            <span>•</span>
                            <span>💳 {getTxWalletName(transaction.wallet_id)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
              })
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ScheduledTransferDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
      />
      
      <ScheduledTransactionDialog
        open={showTransactionDialog}
        onOpenChange={handleCloseTransactionDialog}
        editTransaction={editingTransaction}
        createScheduledTransaction={createScheduledTransaction}
        updateScheduledTransaction={updateScheduledTransaction}
      />
    </AppLayout>
  );
};

export default ScheduledTransactions;
