import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Filter, Swords, Coins, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAdventureJournal } from '@/hooks/useAdventureJournal';
import { useAuth } from '@/hooks/useAuth';
import { JournalEntry } from '@/components/journal/JournalEntry';
import { JournalStats } from '@/components/journal/JournalStats';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { AdBanner } from '@/components/ads/AdBanner';
import { useAdBanner } from '@/hooks/useAdBanner';
import { cn } from '@/lib/utils';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { AddTransactionDialog } from '@/components/game/AddTransactionDialog';
import { useTransactions } from '@/hooks/useTransactions';

type FilterType = 'all' | 'income' | 'expense';
type ImpactFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

export default function AdventureJournal() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { entries, loading, hasMore, stats, loadMore, fetchJournal } = useAdventureJournal();
  const { shouldShowBanner } = useAdBanner();
  const { addTransaction } = useTransactions();
  
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>('all');
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  const handleFilterChange = (type: FilterType, impact: ImpactFilter) => {
    setTypeFilter(type);
    setImpactFilter(impact);
    
    fetchJournal({
      eventType: type === 'all' ? undefined : type === 'income' ? 'INCOME' : 'EXPENSE',
      impact: impact === 'all' ? undefined : impact,
    });
  };

  // Group entries by date
  const groupedEntries = entries.reduce((groups, entry) => {
    const date = format(new Date(entry.createdAt), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, typeof entries>);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return t('common.today');
    }
    if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return t('common.yesterday');
    }
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold">{t('journal.title')}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className={cn("px-4 py-4 max-w-2xl mx-auto space-y-4", shouldShowBanner ? "pb-[130px]" : "pb-24")}>
        {/* Stats Card */}
        <JournalStats stats={stats} />

        {/* Filters */}
        <div className="flex gap-2">
          <Select 
            value={typeFilter} 
            onValueChange={(val: FilterType) => handleFilterChange(val, impactFilter)}
          >
            <SelectTrigger className="flex-1">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('journal.filterType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="income">
                <span className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-500" />
                  {t('journal.treasures')}
                </span>
              </SelectItem>
              <SelectItem value="expense">
                <span className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-orange-500" />
                  {t('journal.battles')}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={impactFilter} 
            onValueChange={(val: ImpactFilter) => handleFilterChange(typeFilter, val)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={t('journal.filterImpact')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="low">{t('journal.impactLow')}</SelectItem>
              <SelectItem value="medium">{t('journal.impactMedium')}</SelectItem>
              <SelectItem value="high">{t('journal.impactHigh')}</SelectItem>
              <SelectItem value="critical">{t('journal.impactCritical')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Journal Entries */}
        {loading && entries.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('journal.emptyTitle')}</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {t('journal.emptyDescription')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEntries).map(([date, dayEntries]) => (
              <div key={date} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground sticky top-14 bg-background py-2 z-10">
                  📅 {formatDateHeader(date)}
                </h3>
                <div className="space-y-3">
                  {dayEntries.map((entry) => (
                    <JournalEntry key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {t('journal.loadMore')}
              </Button>
            )}
          </div>
        )}
      </main>

      <AdBanner />

      <BottomNavigation 
        activeTab="home" 
        onTabChange={(tab) => {
          if (tab === 'home') navigate('/');
          if (tab === 'transactions') navigate('/');
          if (tab === 'quests') navigate('/');
        }}
        onAddClick={() => setShowAddTransaction(true)}
      />

      <AddTransactionDialog 
        open={showAddTransaction} 
        onOpenChange={setShowAddTransaction}
        onAdd={addTransaction}
      />
    </div>
  );
}
