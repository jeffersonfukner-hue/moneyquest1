import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { ArrowRight, Calendar, Clock, Pause, Play, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWalletTransfers, ScheduledTransfer } from '@/hooks/useWalletTransfers';
import { SupportedCurrency } from '@/types/database';

const getDateLocale = (lang: string) => {
  if (lang.startsWith('pt')) return ptBR;
  if (lang.startsWith('es')) return es;
  return enUS;
};

export const ScheduledTransfersCard = () => {
  const { t, i18n } = useTranslation();
  const { scheduledTransfers, loading, getWalletName, getWalletIcon, toggleScheduledTransfer, deleteScheduledTransfer } = useWalletTransfers();

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
        return t('wallets.frequencyDaily');
      case 'weekly':
        return `${t('wallets.frequencyWeekly')} (${t(`wallets.days.${['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][transfer.day_of_week || 0]}`)})`;
      case 'monthly':
        return `${t('wallets.frequencyMonthly')} (${t('wallets.dayNumber', { day: transfer.day_of_month })})`;
      default:
        return transfer.frequency;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('wallets.scheduledTransfers')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-full" />
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
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {t('wallets.scheduledTransfers')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scheduledTransfers.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('wallets.noScheduledTransfers')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledTransfers.map((transfer) => (
              <div
                key={transfer.id}
                className="p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
              >
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
                      className="h-7 w-7"
                      onClick={() => toggleScheduledTransfer(transfer.id, !transfer.is_active)}
                    >
                      {transfer.is_active ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
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

                <div className="mt-2">
                  <div className="flex items-center gap-1 text-sm">
                    <span className="truncate">{getWalletName(transfer.from_wallet_id)}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{getWalletName(transfer.to_wallet_id)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={transfer.is_active ? 'default' : 'secondary'}>
                        {transfer.is_active ? t('wallets.active') : t('wallets.paused')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getFrequencyLabel(transfer)}
                      </span>
                    </div>
                    <span className="font-semibold">
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
