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
import { AppShell } from '@/components/layout/AppShell';

type FilterType = 'all' | 'income' | 'expense';
type ImpactFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

export default function AdventureJournal() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { entries, loading, hasMore, stats, loadMore, fetchJournal } = useAdventureJournal();
  
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>('all');

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
    <AppShell>
      {/* Content - AppShell controls width */}
      <div className="space-y-4 pb-24">
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
      </div>
    </AppShell>
  );
}
