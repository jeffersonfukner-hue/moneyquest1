import { useState, useEffect } from 'react';
import { useForm, useController } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Clock, TrendingUp, TrendingDown, Repeat } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallets } from '@/hooks/useWallets';
import { useCategories } from '@/hooks/useCategories';
import {
  useScheduledTransactions,
  CreateScheduledTransactionData,
  UpdateScheduledTransactionData,
  ScheduledTransaction,
} from '@/hooks/useScheduledTransactions';
import { useProfile } from '@/hooks/useProfile';
import { SupportedCurrency } from '@/types/database';

const scheduledTransactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number({ required_error: 'Valor é obrigatório', invalid_type_error: 'Valor é obrigatório' }).positive('Valor deve ser maior que zero'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Categoria é obrigatória'),
  wallet_id: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  day_of_week: z.number().min(0).max(6).optional(),
  day_of_month: z.number().min(1, 'Dia deve ser entre 1 e 31').max(31, 'Dia deve ser entre 1 e 31').optional(),
  month_of_year: z.number().min(1).max(12).optional(),
  has_limit: z.boolean().optional(),
  total_occurrences: z.number({ invalid_type_error: 'Informe a quantidade' }).min(1, 'Quantidade deve ser no mínimo 1').optional(),
}).superRefine((data, ctx) => {
  if (data.frequency === 'weekly' && data.day_of_week === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecione o dia da semana',
      path: ['day_of_week'],
    });
  }
  if (['monthly', 'yearly'].includes(data.frequency) && data.day_of_month === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe o dia do mês',
      path: ['day_of_month'],
    });
  }
  if (data.frequency === 'yearly' && data.month_of_year === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecione o mês',
      path: ['month_of_year'],
    });
  }
  if (data.has_limit && data.total_occurrences === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe a quantidade de repetições',
      path: ['total_occurrences'],
    });
  }
});

type ScheduledTransactionFormData = z.infer<typeof scheduledTransactionSchema>;

interface ScheduledTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTransaction?: ScheduledTransaction | null;
  createScheduledTransaction?: (data: CreateScheduledTransactionData) => Promise<boolean>;
  updateScheduledTransaction?: (data: UpdateScheduledTransactionData) => Promise<boolean>;
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

const MONTHS = [
  { value: 1, label: 'january' },
  { value: 2, label: 'february' },
  { value: 3, label: 'march' },
  { value: 4, label: 'april' },
  { value: 5, label: 'may' },
  { value: 6, label: 'june' },
  { value: 7, label: 'july' },
  { value: 8, label: 'august' },
  { value: 9, label: 'september' },
  { value: 10, label: 'october' },
  { value: 11, label: 'november' },
  { value: 12, label: 'december' },
];

// Separate component for amount input to use hooks properly
const AmountInput = ({ control }: { control: any }) => {
  const { t } = useTranslation();
  const { field, fieldState } = useController({ control, name: 'amount' });
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    // Only sync if field has a real value (not 0 or undefined)
    if (field.value && field.value > 0) {
      setDisplayValue(String(field.value));
    } else {
      setDisplayValue('');
    }
  }, [field.value]);

  return (
    <FormItem>
      <FormLabel>{t('transactions.amount')}</FormLabel>
      <FormControl>
        <Input
          type="text"
          inputMode="decimal"
          placeholder=""
          value={displayValue}
          onChange={(e) => {
            const val = e.target.value.replace(',', '.');
            if (val === '' || /^\d*\.?\d*$/.test(val)) {
              setDisplayValue(e.target.value);
              if (val === '') {
                field.onChange(undefined);
              } else {
                const parsed = parseFloat(val);
                if (!isNaN(parsed)) {
                  field.onChange(parsed);
                }
              }
            }
          }}
          onBlur={() => {
            if (displayValue.trim() === '') {
              field.onChange(undefined);
              return;
            }
            const parsed = parseFloat(displayValue.replace(',', '.'));
            if (!isNaN(parsed) && parsed > 0) {
              field.onChange(parsed);
              setDisplayValue(String(parsed));
            }
          }}
        />
      </FormControl>
      {fieldState.error && (
        <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p>
      )}
    </FormItem>
  );
};

// Separate component for occurrences input to use hooks properly
const OccurrencesInput = ({ control, getFrequencyLabel }: { control: any; getFrequencyLabel: () => string }) => {
  const { field, fieldState } = useController({ control, name: 'total_occurrences' });
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (field.value && field.value > 0) {
      setDisplayValue(String(field.value));
    } else {
      setDisplayValue('');
    }
  }, [field.value]);

  return (
    <FormItem>
      <FormLabel>Repetir por quantos {getFrequencyLabel()}?</FormLabel>
      <FormControl>
        <Input
          type="text"
          inputMode="numeric"
          placeholder=""
          value={displayValue}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setDisplayValue(val);
            if (val === '') {
              field.onChange(undefined);
            } else {
              const num = Math.min(parseInt(val, 10), 999);
              field.onChange(num);
            }
          }}
          onBlur={() => {
            if (displayValue.trim() === '') {
              field.onChange(undefined);
              return;
            }
            const parsed = parseInt(displayValue, 10);
            if (!isNaN(parsed) && parsed >= 1) {
              const clamped = Math.min(parsed, 999);
              field.onChange(clamped);
              setDisplayValue(String(clamped));
            }
          }}
        />
      </FormControl>
      {field.value ? (
        <p className="text-xs text-muted-foreground">
          Após {field.value} execuções, o agendamento será desativado automaticamente.
        </p>
      ) : null}
      {fieldState.error && (
        <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p>
      )}
    </FormItem>
  );
};

export const ScheduledTransactionDialog = ({
  open,
  onOpenChange,
  editTransaction,
  createScheduledTransaction: createFromProps,
  updateScheduledTransaction: updateFromProps,
}: ScheduledTransactionDialogProps) => {
  const { t } = useTranslation();
  const { activeWallets } = useWallets();
  const { categories } = useCategories();
  const { profile } = useProfile();
  const {
    createScheduledTransaction: createDefault,
    updateScheduledTransaction: updateDefault,
  } = useScheduledTransactions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createScheduledTransaction = createFromProps ?? createDefault;
  const updateScheduledTransaction = updateFromProps ?? updateDefault;

  const isEditMode = !!editTransaction;

  const form = useForm<ScheduledTransactionFormData>({
    resolver: zodResolver(scheduledTransactionSchema),
    defaultValues: {
      description: '',
      amount: undefined,
      type: 'EXPENSE',
      category: '',
      wallet_id: '',
      frequency: 'monthly',
      day_of_week: undefined,
      day_of_month: undefined,
      month_of_year: undefined,
      has_limit: false,
      total_occurrences: undefined,
    },
  });

  // Reset form when dialog opens with edit data
  useEffect(() => {
    if (open && editTransaction) {
      form.reset({
        description: editTransaction.description,
        amount: editTransaction.amount,
        type: editTransaction.type,
        category: editTransaction.category,
        wallet_id: editTransaction.wallet_id || 'none',
        frequency: editTransaction.frequency,
        day_of_week: editTransaction.day_of_week ?? undefined,
        day_of_month: editTransaction.day_of_month ?? undefined,
        month_of_year: editTransaction.month_of_year ?? undefined,
        has_limit: editTransaction.total_occurrences !== null,
        total_occurrences: editTransaction.total_occurrences ?? undefined,
      });
    } else if (open && !editTransaction) {
      form.reset({
        description: '',
        amount: undefined,
        type: 'EXPENSE',
        category: '',
        wallet_id: '',
        frequency: 'monthly',
        day_of_week: undefined,
        day_of_month: undefined,
        month_of_year: undefined,
        has_limit: false,
        total_occurrences: undefined,
      });
    }
  }, [open, editTransaction, form]);

  const watchType = form.watch('type');
  const watchFrequency = form.watch('frequency');
  const watchHasLimit = form.watch('has_limit');

  const filteredCategories = categories.filter(c => c.type === watchType);

  const getFrequencyLabel = () => {
    switch (watchFrequency) {
      case 'daily': return 'dias';
      case 'weekly': return 'semanas';
      case 'monthly': return 'meses';
      case 'yearly': return 'anos';
      default: return 'vezes';
    }
  };

  const onSubmit = async (data: ScheduledTransactionFormData) => {
    setIsSubmitting(true);
    
    let success = false;

    if (isEditMode && editTransaction) {
      success = await updateScheduledTransaction({
        id: editTransaction.id,
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category,
        currency: (profile?.currency || 'BRL') as SupportedCurrency,
        wallet_id: data.wallet_id === 'none' ? null : data.wallet_id || null,
        frequency: data.frequency,
        day_of_week: data.frequency === 'weekly' ? data.day_of_week : undefined,
        day_of_month: ['monthly', 'yearly'].includes(data.frequency) ? data.day_of_month : undefined,
        month_of_year: data.frequency === 'yearly' ? data.month_of_year : undefined,
        total_occurrences: data.has_limit ? data.total_occurrences : null,
      });
    } else {
      const transactionData: CreateScheduledTransactionData = {
        description: data.description,
        amount: data.amount,
        type: data.type,
        category: data.category,
        currency: (profile?.currency || 'BRL') as SupportedCurrency,
        wallet_id: data.wallet_id === 'none' ? null : data.wallet_id || null,
        frequency: data.frequency,
        day_of_week: data.frequency === 'weekly' ? data.day_of_week : undefined,
        day_of_month: ['monthly', 'yearly'].includes(data.frequency) ? data.day_of_month : undefined,
        month_of_year: data.frequency === 'yearly' ? data.month_of_year : undefined,
        total_occurrences: data.has_limit ? data.total_occurrences : null,
      };

      success = await createScheduledTransaction(transactionData);
    }
    
    setIsSubmitting(false);

    if (success) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {isEditMode ? t('scheduled.editTransaction') : t('scheduled.addTransaction')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Type Selector */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('transactions.type')}</FormLabel>
                  <FormControl>
                    <Tabs
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('category', '');
                      }}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="EXPENSE" className="gap-1">
                          <TrendingDown className="h-4 w-4" />
                          {t('transactions.expense')}
                        </TabsTrigger>
                        <TabsTrigger value="INCOME" className="gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {t('transactions.income')}
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.description')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('scheduled.descriptionPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <AmountInput control={form.control} />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('transactions.category')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('transactions.selectCategory')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          <div className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Wallet (optional) */}
            <FormField
              control={form.control}
              name="wallet_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('transactions.wallet')} ({t('common.optional')})</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('wallets.selectWallet')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t('scheduled.noWallet')}</SelectItem>
                      {activeWallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          <div className="flex items-center gap-2">
                            <span>{wallet.icon}</span>
                            <span>{wallet.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="yearly">{t('scheduled.yearly')}</SelectItem>
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

            {/* Day of Month (for monthly/yearly) */}
            {['monthly', 'yearly'].includes(watchFrequency) && (
              <FormField
                control={form.control}
                name="day_of_month"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t('wallets.dayOfMonth')}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder=""
                        value={field.value?.toString() ?? ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val === '') {
                            field.onChange(undefined);
                            return;
                          }
                          field.onChange(parseInt(val, 10));
                        }}
                        onBlur={() => {
                          if (field.value === undefined) return;
                          const clamped = Math.min(Math.max(field.value, 1), 31);
                          field.onChange(clamped);
                        }}
                      />
                    </FormControl>
                    {fieldState.error && (
                      <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p>
                    )}
                  </FormItem>
                )}
              />
            )}

            {/* Month of Year (for yearly) */}
            {watchFrequency === 'yearly' && (
              <FormField
                control={form.control}
                name="month_of_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('scheduled.month')}</FormLabel>
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
                        {MONTHS.map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {t(`scheduled.months.${month.label}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                <OccurrencesInput control={form.control} getFrequencyLabel={getFrequencyLabel} />
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : (isEditMode ? t('common.save') : t('scheduled.createTransaction'))}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
