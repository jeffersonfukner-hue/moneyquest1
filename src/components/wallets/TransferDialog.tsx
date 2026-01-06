import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ArrowRight, AlertTriangle, RefreshCw, Plus } from 'lucide-react';
import { format } from 'date-fns';
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
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { useWallets } from '@/hooks/useWallets';
import { useWalletTransfers, CreateTransferData } from '@/hooks/useWalletTransfers';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Wallet } from '@/types/wallet';
import { SupportedCurrency } from '@/types/database';
import { AddWalletDialog } from './AddWalletDialog';

const transferSchema = z.object({
  from_wallet_id: z.string().min(1, 'Required'),
  to_wallet_id: z.string().min(1, 'Required'),
  amount: z.number().positive('Must be positive'),
  description: z.string().optional(),
  date: z.date(),
});

type TransferFormData = z.infer<typeof transferSchema>;

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedWallet?: Wallet;
}

export const TransferDialog = ({ open, onOpenChange, preselectedWallet }: TransferDialogProps) => {
  const { t } = useTranslation();
  const { activeWallets, refetch: refetchWallets } = useWallets();
  const { createTransfer } = useWalletTransfers();
  const { convertCurrency, getRate } = useExchangeRates();
  const { formatCurrency } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddWalletDialog, setShowAddWalletDialog] = useState(false);
  const [amountDisplay, setAmountDisplay] = useState('');
  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      from_wallet_id: preselectedWallet?.id || '',
      to_wallet_id: '',
      amount: 0,
      description: '',
      date: new Date(),
    },
  });

  // Reset form when dialog opens with preselected wallet
  useEffect(() => {
    if (open && preselectedWallet) {
      form.setValue('from_wallet_id', preselectedWallet.id);
    }
  }, [open, preselectedWallet, form]);

  const watchFromWallet = form.watch('from_wallet_id');
  const watchToWallet = form.watch('to_wallet_id');
  const watchAmount = form.watch('amount');

  const fromWallet = activeWallets.find(w => w.id === watchFromWallet);
  const toWallet = activeWallets.find(w => w.id === watchToWallet);

  const hasCurrencyMismatch = fromWallet && toWallet && fromWallet.currency !== toWallet.currency;

  // Calculate converted amount
  const convertedAmount = hasCurrencyMismatch && watchAmount > 0
    ? convertCurrency(watchAmount, fromWallet.currency, toWallet.currency)
    : null;

  const exchangeRate = hasCurrencyMismatch
    ? getRate(fromWallet.currency, toWallet.currency)
    : null;

  const formatWalletCurrency = (amount: number, currency: SupportedCurrency) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const onSubmit = async (data: TransferFormData) => {
    if (!fromWallet) return;

    setIsSubmitting(true);
    
    const transferData: CreateTransferData = {
      from_wallet_id: data.from_wallet_id,
      to_wallet_id: data.to_wallet_id,
      amount: data.amount,
      currency: fromWallet.currency,
      description: data.description,
      date: format(data.date, 'yyyy-MM-dd'),
      converted_amount: convertedAmount || undefined,
    };

    const success = await createTransfer(transferData);
    
    setIsSubmitting(false);

    if (success) {
      form.reset();
      setAmountDisplay('');
      onOpenChange(false);
    }
  };

  const availableDestinations = activeWallets.filter(w => w.id !== watchFromWallet);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('wallets.transferBetweenAccounts')}
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full mt-1 text-primary"
                    onClick={() => setShowAddWalletDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {t('wallets.addWallet')}
                  </Button>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Arrow indicator */}
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

            {/* Currency conversion info */}
            {hasCurrencyMismatch && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-md space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  <span className="font-medium">{t('wallets.currencyConversion')}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>1 {fromWallet.currency} = {exchangeRate?.toFixed(4)} {toWallet.currency}</p>
                  {convertedAmount !== null && watchAmount > 0 && (
                    <p className="font-medium text-foreground">
                      {formatWalletCurrency(watchAmount, fromWallet.currency)} → {formatWalletCurrency(convertedAmount, toWallet.currency)}
                    </p>
                  )}
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
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amountDisplay}
                      onChange={(e) => {
                        const val = e.target.value.replace(',', '.');
                        if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                          setAmountDisplay(val);
                          field.onChange(val === '' ? 0 : parseFloat(val) || 0);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('common.date')}</FormLabel>
                  <FormControl>
                    <DatePickerInput
                      value={field.value}
                      onChange={field.onChange}
                      disabled={(date) => date > new Date()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('wallets.transfer')}
            </Button>
          </form>
        </Form>

        {/* Add Wallet Dialog */}
        <AddWalletDialog
          open={showAddWalletDialog}
          onOpenChange={setShowAddWalletDialog}
          onWalletCreated={() => {
            refetchWallets();
            setShowAddWalletDialog(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
