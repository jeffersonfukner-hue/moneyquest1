import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Clock, RefreshCw, Repeat } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWallets } from '@/hooks/useWallets';
import { useWalletTransfers, CreateScheduledTransferData } from '@/hooks/useWalletTransfers';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { SupportedCurrency } from '@/types/database';

const scheduledTransferSchema = z.object({
  from_wallet_id: z.string().min(1, 'Required'),
  to_wallet_id: z.string().min(1, 'Required'),
  amount: z.number().positive('Must be positive'),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  day_of_week: z.number().optional(),
  day_of_month: z.number().optional(),
  has_limit: z.boolean().optional(),
  total_occurrences: z.number().min(1).optional(),
});

type ScheduledTransferFormData = z.infer<typeof scheduledTransferSchema>;

interface ScheduledTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'sunday' },
  { value: 1, label: 'monday' },
  { value: 2, label: 'tuesday' },
  { value: 3, label: 'wednesday' },
  { value: 4, label: 'thursday' },
  { value: 5, label: 'friday' },
  { value: 6, label: 'saturday' },
];

export const ScheduledTransferDialog = ({ open, onOpenChange }: ScheduledTransferDialogProps) => {
  const { t } = useTranslation();
  const { activeWallets } = useWallets();
  const { createScheduledTransfer } = useWalletTransfers();
  const { getRate } = useExchangeRates();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ScheduledTransferFormData>({
    resolver: zodResolver(scheduledTransferSchema),
    defaultValues: {
      from_wallet_id: '',
      to_wallet_id: '',
      amount: 0,
      description: '',
      frequency: 'monthly',
      day_of_week: 1,
      day_of_month: 5,
      has_limit: false,
      total_occurrences: 12,
    },
  });

  const watchFromWallet = form.watch('from_wallet_id');
  const watchToWallet = form.watch('to_wallet_id');
  const watchFrequency = form.watch('frequency');
  const watchHasLimit = form.watch('has_limit');

  const fromWallet = activeWallets.find(w => w.id === watchFromWallet);
  const toWallet = activeWallets.find(w => w.id === watchToWallet);

  const hasCurrencyMismatch = fromWallet && toWallet && fromWallet.currency !== toWallet.currency;

  const formatWalletCurrency = (amount: number, currency: SupportedCurrency) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getFrequencyLabel = () => {
    switch (watchFrequency) {
      case 'daily': return 'dias';
      case 'weekly': return 'semanas';
      case 'monthly': return 'meses';
      default: return 'vezes';
    }
  };

  const onSubmit = async (data: ScheduledTransferFormData) => {
    if (!fromWallet) return;

    setIsSubmitting(true);
    
    const transferData: CreateScheduledTransferData = {
      from_wallet_id: data.from_wallet_id,
      to_wallet_id: data.to_wallet_id,
      amount: data.amount,
      currency: fromWallet.currency,
      description: data.description,
      frequency: data.frequency,
      day_of_week: data.frequency === 'weekly' ? data.day_of_week : undefined,
      day_of_month: data.frequency === 'monthly' ? data.day_of_month : undefined,
      total_occurrences: data.has_limit ? data.total_occurrences : null,
    };

    const success = await createScheduledTransfer(transferData);
    
    setIsSubmitting(false);

    if (success) {
      form.reset();
      onOpenChange(false);
    }
  };

  const availableDestinations = activeWallets.filter(w => w.id !== watchFromWallet);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('wallets.scheduleTransfer')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* From Wallet */}
            <FormField
              control={form.control}
              name="from_wallet_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('wallets.fromWallet')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('wallets.selectWallet')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeWallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          <div className="flex items-center gap-2">
                            <span>{wallet.icon}</span>
                            <span>{wallet.name}</span>
                            <span className="text-muted-foreground text-sm">
                              ({formatWalletCurrency(wallet.current_balance, wallet.currency)})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* To Wallet */}
            <FormField
              control={form.control}
              name="to_wallet_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('wallets.toWallet')}</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!watchFromWallet}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('wallets.selectWallet')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableDestinations.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          <div className="flex items-center gap-2">
                            <span>{wallet.icon}</span>
                            <span>{wallet.name}</span>
                            <span className="text-muted-foreground text-sm">
                              ({formatWalletCurrency(wallet.current_balance, wallet.currency)})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Currency conversion note */}
            {hasCurrencyMismatch && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  <span>{t('wallets.autoConversionNote')}</span>
                </div>
              </div>
            )}

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('wallets.transferAmount')}
                    {fromWallet && <span className="text-muted-foreground ml-1">({fromWallet.currency})</span>}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Frequency */}
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('wallets.frequency')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">{t('wallets.frequencyDaily')}</SelectItem>
                      <SelectItem value="weekly">{t('wallets.frequencyWeekly')}</SelectItem>
                      <SelectItem value="monthly">{t('wallets.frequencyMonthly')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Day of Week (for weekly) */}
            {watchFrequency === 'weekly' && (
              <FormField
                control={form.control}
                name="day_of_week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('wallets.dayOfWeek')}</FormLabel>
                    <Select 
                      onValueChange={(v) => field.onChange(parseInt(v))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {t(`wallets.days.${day.label}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Day of Month (for monthly) */}
            {watchFrequency === 'monthly' && (
              <FormField
                control={form.control}
                name="day_of_month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('wallets.dayOfMonth')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.description')} ({t('common.optional')})</FormLabel>
                  <FormControl>
                    <Input placeholder={t('wallets.transferDescriptionPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Occurrence Limit */}
            <div className="space-y-3 pt-2 border-t border-border">
              <FormField
                control={form.control}
                name="has_limit"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-input"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 font-normal flex items-center gap-2">
                      <Repeat className="h-4 w-4" />
                      Limitar número de repetições
                    </FormLabel>
                  </FormItem>
                )}
              />

              {watchHasLimit && (
                <FormField
                  control={form.control}
                  name="total_occurrences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repetir por quantos {getFrequencyLabel()}?</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={120}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Após {field.value || 1} execuções, a transferência será desativada automaticamente.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('wallets.createScheduledTransfer')}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
