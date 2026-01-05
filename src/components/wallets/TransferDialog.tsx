import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ArrowRight, AlertTriangle } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallets } from '@/hooks/useWallets';
import { useWalletTransfers, CreateTransferData } from '@/hooks/useWalletTransfers';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Wallet } from '@/types/wallet';

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
  const { activeWallets } = useWallets();
  const { createTransfer } = useWalletTransfers();
  const { formatCurrency } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const watchFromWallet = form.watch('from_wallet_id');
  const watchToWallet = form.watch('to_wallet_id');

  const fromWallet = activeWallets.find(w => w.id === watchFromWallet);
  const toWallet = activeWallets.find(w => w.id === watchToWallet);

  const hasCurrencyMismatch = fromWallet && toWallet && fromWallet.currency !== toWallet.currency;

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
    };

    const success = await createTransfer(transferData);
    
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
                              ({formatCurrency(wallet.current_balance)})
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
                              ({formatCurrency(wallet.current_balance)})
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

            {/* Currency mismatch warning */}
            {hasCurrencyMismatch && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/30 rounded-md text-sm">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span>{t('wallets.currencyWarning')}</span>
              </div>
            )}

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('wallets.transferAmount')}</FormLabel>
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>{t('common.selectDate')}</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('wallets.transfer')}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
