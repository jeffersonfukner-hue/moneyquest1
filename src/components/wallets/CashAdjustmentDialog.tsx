import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, Scale, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallets } from '@/hooks/useWallets';
import { Wallet } from '@/types/wallet';
import { SupportedCurrency } from '@/types/database';
import { cn } from '@/lib/utils';

const adjustmentSchema = z.object({
  counted_balance: z.number(),
  reason: z.string().optional(),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

interface CashAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: Wallet;
}

export const CashAdjustmentDialog = ({
  open,
  onOpenChange,
  wallet,
}: CashAdjustmentDialogProps) => {
  const { t } = useTranslation();
  const { addTransaction, refetch: refetchTransactions } = useTransactions();
  const { recalculateBalance } = useWallets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balanceDisplay, setBalanceDisplay] = useState('');

  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      counted_balance: wallet.current_balance,
      reason: '',
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        counted_balance: wallet.current_balance,
        reason: '',
      });
      setBalanceDisplay(formatNumber(wallet.current_balance));
    }
  }, [open, wallet.current_balance, form]);

  const watchCountedBalance = form.watch('counted_balance');

  // Calculate difference
  const difference = useMemo(() => {
    return watchCountedBalance - wallet.current_balance;
  }, [watchCountedBalance, wallet.current_balance]);

  const adjustmentType = difference > 0 ? 'INCOME' : 'EXPENSE';
  const hasDifference = Math.abs(difference) > 0.001;

  const formatCurrency = (amount: number, currency: SupportedCurrency) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return num.toFixed(2).replace('.', ',');
  };

  const onSubmit = async (data: AdjustmentFormData) => {
    if (!hasDifference) return;

    setIsSubmitting(true);

    // Create adjustment transaction
    const adjustmentAmount = Math.abs(difference);
    const transactionType = difference > 0 ? 'INCOME' : 'EXPENSE';

    // Build description with audit info
    const reasonPart = data.reason ? ` - ${data.reason}` : '';
    const description = t('wallets.cashAdjustment.transactionDescription', 'Ajuste de Caixa') + reasonPart;

    const result = await addTransaction({
      description: description.toUpperCase(),
      amount: adjustmentAmount,
      category: 'Ajustes',
      type: transactionType,
      date: format(new Date(), 'yyyy-MM-dd'),
      currency: wallet.currency,
      wallet_id: wallet.id,
      source_type: 'account',
      transaction_subtype: 'cash_adjustment' as any, // Special subtype for cash adjustments
      supplier: undefined,
    });

    setIsSubmitting(false);

    if (!result.error) {
      // Force wallet balance recalculation
      await recalculateBalance(wallet.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-500" />
            {t('wallets.cashAdjustment.title', 'Ajuste de Caixa')}
          </DialogTitle>
          <DialogDescription>
            {t('wallets.cashAdjustment.description', 'Corrija diferenças entre o saldo registrado e o saldo real contado.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Current Balance Display */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-1">
              <p className="text-xs text-muted-foreground">
                {t('wallets.cashAdjustment.currentBalance', 'Saldo atual no app')}
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(wallet.current_balance, wallet.currency)}
              </p>
            </div>

            {/* Counted Balance Input */}
            <FormField
              control={form.control}
              name="counted_balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('wallets.cashAdjustment.countedBalance', 'Saldo contado agora')}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        {wallet.currency}
                      </span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="pl-12"
                        placeholder="0,00"
                        value={balanceDisplay}
                        onChange={(e) => {
                          const val = e.target.value.replace(',', '.');
                          if (val === '' || val === '-' || /^-?\d*\.?\d{0,2}$/.test(val)) {
                            setBalanceDisplay(e.target.value);
                            field.onChange(val === '' || val === '-' ? 0 : parseFloat(val) || 0);
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Difference Display */}
            <div className={cn(
              "p-3 rounded-lg border-2 transition-colors",
              !hasDifference && "bg-muted/30 border-muted",
              hasDifference && difference > 0 && "bg-green-500/10 border-green-500/30",
              hasDifference && difference < 0 && "bg-red-500/10 border-red-500/30"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!hasDifference ? (
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                  ) : difference > 0 ? (
                    <ArrowUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    {t('wallets.cashAdjustment.difference', 'Diferença')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-bold",
                    !hasDifference && "text-muted-foreground",
                    hasDifference && difference > 0 && "text-green-600",
                    hasDifference && difference < 0 && "text-red-600"
                  )}>
                    {difference >= 0 ? '+' : ''}{formatCurrency(difference, wallet.currency)}
                  </span>
                  {hasDifference && (
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      difference > 0 ? "border-green-500 text-green-600" : "border-red-500 text-red-600"
                    )}>
                      {difference > 0 
                        ? t('wallets.cashAdjustment.surplus', 'Sobra')
                        : t('wallets.cashAdjustment.shortage', 'Falta')
                      }
                    </Badge>
                  )}
                </div>
              </div>
              {!hasDifference && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t('wallets.cashAdjustment.noDifference', 'Sem diferença a ajustar.')}
                </p>
              )}
            </div>

            {/* What will happen */}
            {hasDifference && (
              <Alert className={difference > 0 ? "border-green-500/30" : "border-red-500/30"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {difference > 0 
                    ? t('wallets.cashAdjustment.willCreateIncome', 'Será criada uma ENTRADA de ajuste no valor de {{amount}}.', { amount: formatCurrency(Math.abs(difference), wallet.currency) })
                    : t('wallets.cashAdjustment.willCreateExpense', 'Será criada uma SAÍDA de ajuste no valor de {{amount}}.', { amount: formatCurrency(Math.abs(difference), wallet.currency) })
                  }
                </AlertDescription>
              </Alert>
            )}

            {/* Reason Input */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('wallets.cashAdjustment.reason', 'Motivo')} ({t('common.optional')})
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('wallets.cashAdjustment.reasonPlaceholder', 'Ex: trocos, perda, gasto não registrado...')}
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !hasDifference}
            >
              {isSubmitting 
                ? t('common.loading') 
                : t('wallets.cashAdjustment.apply', 'Aplicar Ajuste')
              }
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
