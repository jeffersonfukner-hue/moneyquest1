import { useState } from 'react';
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
  ChevronDown
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
    deleteScheduledTransaction
  } = useScheduledTransactions();
  
  const { categories } = useCategories();
  
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'all'>('upcoming');
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'transfers' | 'transactions'>('all');

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

  // Generate upcoming entries for the next 30 days
  const generateUpcomingEntries = (): UpcomingEntry[] => {
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
  };

  const upcomingEntries = generateUpcomingEntries();

  // Filter entries based on sub tab
  const filteredUpcoming = upcomingEntries.filter(entry => {
    if (activeSubTab === 'all') return true;
    return entry.type === (activeSubTab === 'transfers' ? 'transfer' : 'transaction');
  });

  // Group entries by date
  const groupedEntries = filteredUpcoming.reduce((acc, entry) => {
    const dateKey = format(entry.scheduledDate, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, typeof upcomingEntries>);

  // Calculate totals
  const calculateMonthlyAmount = (amount: number, frequency: string) => {
    switch (frequency) {
      case 'daily': return amount * 30;
      case 'weekly': return amount * 4;
      case 'yearly': return amount / 12;
      default: return amount;
    }
  };

  const totalMonthlyTransfers = scheduledTransfers
    .filter(t => t.is_active)
    .reduce((sum, t) => sum + calculateMonthlyAmount(t.amount, t.frequency), 0);

  const totalMonthlyIncome = scheduledTransactions
    .filter(t => t.is_active && t.type === 'INCOME')
    .reduce((sum, t) => sum + calculateMonthlyAmount(t.amount, t.frequency), 0);

  const totalMonthlyExpenses = scheduledTransactions
    .filter(t => t.is_active && t.type === 'EXPENSE')
    .reduce((sum, t) => sum + calculateMonthlyAmount(t.amount, t.frequency), 0);

  const activeTransfersCount = scheduledTransfers.filter(t => t.is_active).length;
  const activeTransactionsCount = scheduledTransactions.filter(t => t.is_active).length;
  const totalActive = activeTransfersCount + activeTransactionsCount;
  const totalPaused = scheduledTransfers.filter(t => !t.is_active).length + 
                      scheduledTransactions.filter(t => !t.is_active).length;

  // All scheduled items for the "All" tab
  const allScheduledItems = [
    ...scheduledTransfers.map(t => ({ type: 'transfer' as const, item: t })),
    ...scheduledTransactions.map(t => ({ type: 'transaction' as const, item: t })),
  ].filter(item => {
    if (activeSubTab === 'all') return true;
    return item.type === (activeSubTab === 'transfers' ? 'transfer' : 'transaction');
  });

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
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-display font-bold text-lg text-foreground">
              {t('scheduled.title')}
            </h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                {t('scheduled.add')}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowTransactionDialog(true)}>
                <TrendingDown className="h-4 w-4 mr-2" />
                {t('scheduled.addTransaction')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowTransferDialog(true)}>
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                {t('scheduled.addTransfer')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-md mx-auto pb-24">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{totalActive}</p>
              <p className="text-xs text-muted-foreground">{t('scheduled.active')}</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground">{totalPaused}</p>
              <p className="text-xs text-muted-foreground">{t('scheduled.paused')}</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{upcomingEntries.length}</p>
              <p className="text-xs text-muted-foreground">{t('scheduled.next30Days')}</p>
            </div>
          </Card>
        </div>

        {/* Monthly Totals */}
        {totalActive > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {(totalMonthlyIncome > 0 || activeTransactionsCount > 0) && (
              <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">{t('scheduled.income')}</span>
                  </div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    +{formatCurrency(totalMonthlyIncome, 'BRL')}
                  </p>
                </CardContent>
              </Card>
            )}
            {(totalMonthlyExpenses > 0 || totalMonthlyTransfers > 0 || activeTransfersCount > 0) && (
              <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-muted-foreground">{t('scheduled.expense')}</span>
                  </div>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    -{formatCurrency(totalMonthlyExpenses, 'BRL')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Transfer total if any */}
        {totalMonthlyTransfers > 0 && (
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('scheduled.transfers')} ({t('scheduled.monthly')})</p>
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(totalMonthlyTransfers, 'BRL')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Repeat className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upcoming' | 'all')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">
              <Calendar className="h-4 w-4 mr-1" />
              {t('scheduled.upcoming')}
            </TabsTrigger>
            <TabsTrigger value="all">
              <Clock className="h-4 w-4 mr-1" />
              {t('scheduled.allScheduled')}
            </TabsTrigger>
          </TabsList>

          {/* Sub Tabs for filtering */}
          <div className="flex gap-2 mt-3">
            <Button
              variant={activeSubTab === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSubTab('all')}
            >
              {t('scheduled.allScheduled')}
            </Button>
            <Button
              variant={activeSubTab === 'transactions' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSubTab('transactions')}
            >
              {t('scheduled.transactions')}
            </Button>
            <Button
              variant={activeSubTab === 'transfers' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSubTab('transfers')}
            >
              {t('scheduled.transfers')}
            </Button>
          </div>

          {/* Upcoming Tab */}
          <TabsContent value="upcoming" className="space-y-4 mt-4">
            {Object.keys(groupedEntries).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">{t('scheduled.noUpcoming')}</p>
                  <div className="flex gap-2 justify-center mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowTransactionDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t('scheduled.addTransaction')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedEntries).map(([dateKey, entries]) => (
                <div key={dateKey}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(dateKey), 'EEEE, dd MMM', { locale: dateLocale })}
                  </h3>
                  <div className="space-y-2">
                    {entries.map((entry, idx) => (
                      <Card key={`${entry.type}-${entry.type === 'transfer' ? entry.transfer.id : entry.transaction.id}-${idx}`} className="overflow-hidden">
                        <CardContent className="p-3">
                          {entry.type === 'transfer' ? (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-lg">
                                <span>{getWalletIcon(entry.transfer.from_wallet_id)}</span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <span>{getWalletIcon(entry.transfer.to_wallet_id)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 text-sm font-medium truncate">
                                  <span className="truncate">{getWalletName(entry.transfer.from_wallet_id)}</span>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{getWalletName(entry.transfer.to_wallet_id)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{getFrequencyIcon(entry.transfer.frequency)}</span>
                                  <span>{getTransferFrequencyLabel(entry.transfer)}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-foreground">
                                  {formatCurrency(entry.transfer.amount, entry.transfer.currency)}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">
                                {getCategoryIcon(entry.transaction.category)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{entry.transaction.description}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{entry.transaction.category}</span>
                                  <span>•</span>
                                  <span>{getFrequencyIcon(entry.transaction.frequency)}</span>
                                  <span>{getTransactionFrequencyLabel(entry.transaction)}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-semibold ${entry.transaction.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {entry.transaction.type === 'INCOME' ? '+' : '-'}
                                  {formatCurrency(entry.transaction.amount, entry.transaction.currency)}
                                </p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* All Scheduled Tab */}
          <TabsContent value="all" className="space-y-3 mt-4">
            {allScheduledItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">{t('scheduled.noScheduled')}</p>
                  <div className="flex gap-2 justify-center mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowTransactionDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t('scheduled.addTransaction')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              allScheduledItems.map((scheduled) => {
                if (scheduled.type === 'transfer') {
                  const transfer = scheduled.item as ScheduledTransfer;
                  return (
                    <Card 
                      key={`transfer-${transfer.id}`}
                      className={!transfer.is_active ? 'opacity-60' : ''}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 text-lg">
                            <span>{getWalletIcon(transfer.from_wallet_id)}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span>{getWalletIcon(transfer.to_wallet_id)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleScheduledTransfer(transfer.id, !transfer.is_active)}
                            >
                              {transfer.is_active ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteScheduledTransfer(transfer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-2">
                          <div className="flex items-center gap-1 text-sm">
                            <span className="truncate">{getWalletName(transfer.from_wallet_id)}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{getWalletName(transfer.to_wallet_id)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <Badge variant={transfer.is_active ? 'default' : 'secondary'}>
                                {transfer.is_active ? t('scheduled.active') : t('scheduled.paused')}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {getFrequencyIcon(transfer.frequency)} {getTransferFrequencyLabel(transfer)}
                              </span>
                            </div>
                            <span className="font-bold text-lg">
                              {formatCurrency(transfer.amount, transfer.currency)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {t('wallets.nextRun')}: {format(new Date(transfer.next_run_date), 'dd MMM yyyy', { locale: dateLocale })}
                            </span>
                          </div>

                          {transfer.description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {transfer.description}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                } else {
                  const transaction = scheduled.item as ScheduledTransaction;
                  return (
                    <Card 
                      key={`transaction-${transaction.id}`}
                      className={!transaction.is_active ? 'opacity-60' : ''}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getCategoryIcon(transaction.category)}</span>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">{transaction.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleScheduledTransaction(transaction.id, !transaction.is_active)}
                            >
                              {transaction.is_active ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteScheduledTransaction(transaction.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={transaction.is_active ? 'default' : 'secondary'}>
                              {transaction.is_active ? t('scheduled.active') : t('scheduled.paused')}
                            </Badge>
                            <Badge variant={transaction.type === 'INCOME' ? 'outline' : 'destructive'} className="gap-1">
                              {transaction.type === 'INCOME' ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {transaction.type === 'INCOME' ? t('transactions.income') : t('transactions.expense')}
                            </Badge>
                          </div>
                          <span className={`font-bold text-lg ${transaction.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {transaction.type === 'INCOME' ? '+' : '-'}
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{getFrequencyIcon(transaction.frequency)} {getTransactionFrequencyLabel(transaction)}</span>
                        </div>

                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {t('wallets.nextRun')}: {format(new Date(transaction.next_run_date), 'dd MMM yyyy', { locale: dateLocale })}
                          </span>
                        </div>

                        {transaction.wallet_id && (
                          <p className="text-xs text-muted-foreground mt-1">
                            💳 {getTxWalletName(transaction.wallet_id)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
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
        onOpenChange={setShowTransactionDialog}
      />
    </AppLayout>
  );
};

export default ScheduledTransactions;
