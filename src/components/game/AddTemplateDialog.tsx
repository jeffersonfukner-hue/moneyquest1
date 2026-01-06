import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ArrowUpCircle, ArrowDownCircle, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TransactionType, SupportedCurrency } from '@/types/database';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCategories } from '@/hooks/useCategories';
import { useTransactionTemplates } from '@/hooks/useTransactionTemplates';
import { SUPPORTED_CURRENCIES } from '@/i18n';
import { cn } from '@/lib/utils';

interface AddTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Common template icons
const TEMPLATE_ICONS = ['☕', '🍔', '🚌', '🛒', '💊', '🎬', '📚', '💪', '🏠', '⚡', '🎮', '🎵'];

export const AddTemplateDialog = ({ open, onOpenChange }: AddTemplateDialogProps) => {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const { getCategoriesByType } = useCategories();
  const { addTemplate } = useTransactionTemplates();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(currency);
  const [icon, setIcon] = useState('⚡');
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setType('EXPENSE');
      setName('');
      setDescription('');
      setAmount('');
      setCategory('');
      setSelectedCurrency(currency);
      setIcon('⚡');
    }
  }, [open, currency]);

  const categories = getCategoriesByType(type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !amount || !category) return;

    setLoading(true);
    const result = await addTemplate({
      name,
      description,
      amount: parseFloat(amount),
      category,
      type,
      currency: selectedCurrency,
      icon,
    });

    if (result) {
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t('templates.createTemplate')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'INCOME' ? 'default' : 'outline'}
              className={cn(
                "flex-1 min-h-[44px]",
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
                "flex-1 min-h-[44px]",
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

          {/* Icon selector */}
          <div className="space-y-2">
            <Label>{t('templates.icon')}</Label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={cn(
                    "w-10 h-10 rounded-lg text-xl transition-all",
                    "border hover:scale-110",
                    icon === emoji
                      ? "border-primary bg-primary/20 ring-2 ring-primary/50"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Template name */}
          <div className="space-y-2">
            <Label htmlFor="template-name">{t('templates.name')}</Label>
            <Input
              id="template-name"
              placeholder={t('templates.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="min-h-[44px]"
              maxLength={20}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="template-description">{t('transactions.description')}</Label>
            <Input
              id="template-description"
              placeholder={t('templates.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="min-h-[44px]"
            />
          </div>

          {/* Amount with currency */}
          <div className="space-y-2">
            <Label htmlFor="template-amount">{t('transactions.amount')}</Label>
            <div className="flex gap-2">
              <Select value={selectedCurrency} onValueChange={(v) => setSelectedCurrency(v as SupportedCurrency)}>
                <SelectTrigger className="w-24 min-h-[44px] flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {Object.entries(SUPPORTED_CURRENCIES).map(([code, config]) => (
                    <SelectItem key={code} value={code} className="min-h-[44px]">
                      <span className="flex items-center gap-2">
                        <Coins className="w-4 h-4" />
                        <span>{config.symbol}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="template-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(',', '.');
                  if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                    setAmount(val);
                  }
                }}
                required
                className="min-h-[44px] flex-1"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="template-category">{t('transactions.category')}</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="min-h-[44px]">
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
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full min-h-[48px] bg-gradient-hero hover:opacity-90"
            disabled={loading || !name || !description || !amount || !category}
          >
            {loading ? t('common.loading') : t('templates.save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
