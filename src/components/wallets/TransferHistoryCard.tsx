import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subMonths, startOfMonth, endOfMonth, Locale } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { ArrowRight, Calendar, Filter, X, History, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useWalletTransfers, WalletTransfer } from '@/hooks/useWalletTransfers';
import { useWallets } from '@/hooks/useWallets';
import { SupportedCurrency } from '@/types/database';
import { cn } from '@/lib/utils';
import { EditTransferDialog } from './EditTransferDialog';

const getDateLocale = (lang: string) => {
  if (lang.startsWith('pt')) return ptBR;
  if (lang.startsWith('es')) return es;
  return enUS;
};

interface TransferHistoryCardProps {
  expanded?: boolean;
}

export const TransferHistoryCard = ({ expanded = false }: TransferHistoryCardProps) => {
  const { t, i18n } = useTranslation();
  const { transfers, loading, getWalletName, getWalletIcon, applyFilters, clearFilters, filters, updateTransfer, deleteTransfer } = useWalletTransfers();
  const { activeWallets, inactiveWallets } = useWallets();
  const allWallets = [...activeWallets, ...inactiveWallets];

  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(filters.startDate);
  const [endDate, setEndDate] = useState<Date | undefined>(filters.endDate);
  const [selectedWallet, setSelectedWallet] = useState<string>(filters.walletId || 'all');
  const [editingTransfer, setEditingTransfer] = useState<WalletTransfer | null>(null);

  const dateLocale = getDateLocale(i18n.language);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency as SupportedCurrency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleApplyFilters = () => {
    applyFilters({
      startDate,
      endDate,
      walletId: selectedWallet !== 'all' ? selectedWallet : undefined,
    });
  };

  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedWallet('all');
    clearFilters();
  };

  const handleQuickFilter = (months: number) => {
    const end = new Date();
    const start = subMonths(startOfMonth(end), months - 1);
    setStartDate(start);
    setEndDate(endOfMonth(end));
    applyFilters({ startDate: start, endDate: endOfMonth(end), walletId: selectedWallet !== 'all' ? selectedWallet : undefined });
  };

  const hasActiveFilters = filters.startDate || filters.endDate || filters.walletId;

  const displayedTransfers = expanded ? transfers : transfers.slice(0, 5);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            {t('wallets.recentTransfers')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-8 w-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            {t('wallets.recentTransfers')}
            {hasActiveFilters && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {t('wallets.filtered')}
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && 'bg-muted')}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {showFilters && (
        <div className="px-6 pb-4 space-y-3 border-b border-border">
          {/* Quick filters */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => handleQuickFilter(1)}>
              {t('wallets.thisMonth')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickFilter(3)}>
              {t('wallets.last3Months')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickFilter(6)}>
              {t('wallets.last6Months')}
            </Button>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  {startDate ? format(startDate, 'dd/MM/yy', { locale: dateLocale }) : t('wallets.startDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  locale={dateLocale}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  {endDate ? format(endDate, 'dd/MM/yy', { locale: dateLocale }) : t('wallets.endDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  locale={dateLocale}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Wallet filter */}
          <Select value={selectedWallet} onValueChange={setSelectedWallet}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder={t('wallets.selectWallet')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('wallets.allWallets')}</SelectItem>
              {allWallets.map((wallet) => (
                <SelectItem key={wallet.id} value={wallet.id}>
                  <div className="flex items-center gap-2">
                    <span>{wallet.icon}</span>
                    <span>{wallet.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleApplyFilters} className="flex-1">
              {t('wallets.applyFilters')}
            </Button>
            {hasActiveFilters && (
              <Button size="sm" variant="outline" onClick={handleClearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      <CardContent className="pt-4">
        {transfers.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('wallets.noTransfers')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedTransfers.map((transfer) => (
              <TransferItem 
                key={transfer.id} 
                transfer={transfer} 
                formatCurrency={formatCurrency} 
                getWalletName={getWalletName} 
                getWalletIcon={getWalletIcon} 
                dateLocale={dateLocale}
                onEdit={() => setEditingTransfer(transfer)}
              />
            ))}
            
            {!expanded && transfers.length > 5 && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                {t('wallets.moreTransfers', { count: transfers.length - 5 })}
              </p>
            )}
          </div>
        )}
      </CardContent>

      {editingTransfer && (
        <EditTransferDialog
          transfer={editingTransfer}
          wallets={allWallets}
          open={!!editingTransfer}
          onOpenChange={(open) => !open && setEditingTransfer(null)}
          onUpdate={updateTransfer}
          onDelete={deleteTransfer}
        />
      )}
    </Card>
  );
};

interface TransferItemProps {
  transfer: WalletTransfer;
  formatCurrency: (amount: number, currency: string) => string;
  getWalletName: (id: string) => string;
  getWalletIcon: (id: string) => string;
  dateLocale: Locale;
  onEdit: () => void;
}

const TransferItem = ({ transfer, formatCurrency, getWalletName, getWalletIcon, dateLocale, onEdit }: TransferItemProps) => {
  return (
    <div 
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={onEdit}
    >
      <div className="flex items-center gap-1 text-lg">
        <span>{getWalletIcon(transfer.from_wallet_id)}</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span>{getWalletIcon(transfer.to_wallet_id)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-sm font-medium truncate">
          <span className="truncate">{getWalletName(transfer.from_wallet_id)}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="truncate">{getWalletName(transfer.to_wallet_id)}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {format(new Date(transfer.date), 'dd MMM yyyy', { locale: dateLocale })}
          {transfer.description && ` • ${transfer.description}`}
        </div>
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
