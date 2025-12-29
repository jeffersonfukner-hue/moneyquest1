import { useState } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TransactionType } from '@/types/database';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCategories } from '@/hooks/useCategories';
import { QuickAddCategoryDialog } from '@/components/categories/QuickAddCategoryDialog';

interface AddTransactionDialogProps {
  onAdd: (transaction: {
    description: string;
    amount: number;
    category: string;
    type: TransactionType;
    date: string;
    currency: string;
  }) => Promise<{ error: Error | null }>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AddTransactionDialog = ({ onAdd, open: controlledOpen, onOpenChange }: AddTransactionDialogProps) => {
  const { t } = useTranslation();
  const { dateLocale } = useLanguage();
  const { currencySymbol, currency } = useCurrency();
  const { getCategoriesByType, addCategory } = useCategories();
  
  const [internalOpen, setInternalOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Use controlled or internal state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category) return;

    setLoading(true);
    const { error } = await onAdd({
      description,
      amount: parseFloat(amount),
      category,
      type,
      date: format(date, 'yyyy-MM-dd'),
      currency,
    });

    if (!error) {
      setDescription('');
      setAmount('');
      setCategory('');
      setDate(new Date());
      setOpen(false);
    }
    setLoading(false);
  };

  const categories = getCategoriesByType(type);

  const handleQuickAddCategory = async (name: string, icon: string, color: string) => {
    const newCat = await addCategory(name, type, icon, color);
    if (newCat) {
      setCategory(newCat.name);
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === '__new__') {
      setQuickAddOpen(true);
    } else {
      setCategory(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button 
            size="lg" 
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-hero hover:opacity-90 transition-all hover:scale-105"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t('transactions.addTransaction')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'INCOME' ? 'default' : 'outline'}
              className={cn(
                "flex-1 min-h-[48px]",
                type === 'INCOME' && 'bg-income hover:bg-income/90'
              )}
              onClick={() => {
                setType('INCOME');
                setCategory('');
              }}
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              {t('transactions.income')}
            </Button>
            <Button
              type="button"
              variant={type === 'EXPENSE' ? 'default' : 'outline'}
              className={cn(
                "flex-1 min-h-[48px]",
                type === 'EXPENSE' && 'bg-expense hover:bg-expense/90'
              )}
              onClick={() => {
                setType('EXPENSE');
                setCategory('');
              }}
            >
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              {t('transactions.expense')}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('transactions.description')}</Label>
            <Input
              id="description"
              placeholder={t('transactions.description')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="min-h-[48px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{t('transactions.amount')} ({currencySymbol})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="min-h-[48px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t('transactions.category')}</Label>
            <Select value={category} onValueChange={handleCategoryChange} required>
              <SelectTrigger className="min-h-[48px]">
                <SelectValue placeholder={t('transactions.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.name} className="min-h-[44px]">
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
                <SelectItem value="__new__" className="min-h-[44px] text-primary">
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>{t('categories.newCategory')}</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('transactions.date')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal min-h-[48px]",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: dateLocale }) : <span>{t('transactions.selectDate')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            type="submit" 
            className="w-full min-h-[48px] bg-gradient-hero hover:opacity-90"
            disabled={loading || !description || !amount || !category}
          >
            {loading ? t('common.loading') : `${t('common.add')} 🎮`}
          </Button>
        </form>

        <QuickAddCategoryDialog
          open={quickAddOpen}
          onOpenChange={setQuickAddOpen}
          onAdd={handleQuickAddCategory}
          type={type}
        />
      </DialogContent>
    </Dialog>
  );
};
