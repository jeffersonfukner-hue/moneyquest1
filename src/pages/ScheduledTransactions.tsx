import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format, addDays, addWeeks, addMonths, isBefore, isAfter, startOfDay } from 'date-fns';
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
  Filter,
  ArrowLeftRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScheduledTransferDialog } from '@/components/wallets/ScheduledTransferDialog';
import { useWalletTransfers, ScheduledTransfer } from '@/hooks/useWalletTransfers';
import { SupportedCurrency } from '@/types/database';

const getDateLocale = (lang: string) => {
  if (lang.startsWith('pt')) return ptBR;
  if (lang.startsWith('es')) return es;
  return enUS;
};

const ScheduledTransactions = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { 
    scheduledTransfers, 
    loading, 
    getWalletName, 
    getWalletIcon,
    toggleScheduledTransfer,
    deleteScheduledTransfer 
  } = useWalletTransfers();
  
  const [showScheduledDialog, setShowScheduledDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'all'>('upcoming');

  const dateLocale = getDateLocale(i18n.language);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency as SupportedCurrency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getFrequencyLabel = (transfer: ScheduledTransfer) => {
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

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return '📅';
      case 'weekly':
        return '📆';
      case 'monthly':
        return '🗓️';
      default:
        return '⏰';
    }
  };

  // Generate upcoming scheduled entries for the next 30 days
  const generateUpcomingEntries = () => {
    const entries: Array<{
      transfer: ScheduledTransfer;
      scheduledDate: Date;
    }> = [];

    const today = startOfDay(new Date());
    const endDate = addDays(today, 30);

    scheduledTransfers
      .filter(t => t.is_active)
      .forEach(transfer => {
        let currentDate = new Date(transfer.next_run_date);

        while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
          if (isAfter(currentDate, today) || currentDate.getTime() === today.getTime()) {
            entries.push({
              transfer,
              scheduledDate: new Date(currentDate),
            });
          }

          // Calculate next occurrence
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

    return entries.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  };

  const upcomingEntries = generateUpcomingEntries();

  // Group entries by date
  const groupedEntries = upcomingEntries.reduce((acc, entry) => {
    const dateKey = format(entry.scheduledDate, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, typeof upcomingEntries>);

  // Calculate totals
  const totalMonthly = scheduledTransfers
    .filter(t => t.is_active)
    .reduce((sum, t) => {
      let monthlyAmount = t.amount;
      if (t.frequency === 'daily') monthlyAmount *= 30;
      if (t.frequency === 'weekly') monthlyAmount *= 4;
      return sum + monthlyAmount;
    }, 0);

  const activeCount = scheduledTransfers.filter(t => t.is_active).length;
  const pausedCount = scheduledTransfers.filter(t => !t.is_active).length;

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
          <Button size="sm" onClick={() => setShowScheduledDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t('scheduled.add')}
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-md mx-auto pb-24">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{activeCount}</p>
              <p className="text-xs text-muted-foreground">{t('scheduled.active')}</p>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground">{pausedCount}</p>
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

        {/* Monthly Total */}
        {activeCount > 0 && (
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('scheduled.monthlyTotal')}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(totalMonthly, 'BRL')}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Repeat className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
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

          {/* Upcoming Tab */}
          <TabsContent value="upcoming" className="space-y-4 mt-4">
            {Object.keys(groupedEntries).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">{t('scheduled.noUpcoming')}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowScheduledDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t('scheduled.createFirst')}
                  </Button>
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
                      <Card key={`${entry.transfer.id}-${idx}`} className="overflow-hidden">
                        <CardContent className="p-3">
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
                                <span>{getFrequencyLabel(entry.transfer)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-foreground">
                                {formatCurrency(entry.transfer.amount, entry.transfer.currency)}
                              </p>
                            </div>
                          </div>
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
            {scheduledTransfers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">{t('scheduled.noScheduled')}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowScheduledDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t('scheduled.createFirst')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              scheduledTransfers.map((transfer) => (
                <Card 
                  key={transfer.id}
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
                            {getFrequencyIcon(transfer.frequency)} {getFrequencyLabel(transfer)}
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
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ScheduledTransferDialog
        open={showScheduledDialog}
        onOpenChange={setShowScheduledDialog}
      />
    </AppLayout>
  );
};

export default ScheduledTransactions;
