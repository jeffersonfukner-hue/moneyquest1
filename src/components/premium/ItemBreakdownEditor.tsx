import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

export interface TransactionItem {
  id: string;
  name: string;
  amount: number;
}

interface ItemBreakdownEditorProps {
  items: TransactionItem[];
  onItemsChange: (items: TransactionItem[]) => void;
  totalAmount: number;
  currency: string;
}

export const ItemBreakdownEditor = ({
  items,
  onItemsChange,
  totalAmount,
  currency,
}: ItemBreakdownEditorProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  const itemsTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const difference = totalAmount - itemsTotal;
  const isBalanced = Math.abs(difference) < 0.01;

  const addItem = () => {
    const newItem: TransactionItem = {
      id: crypto.randomUUID(),
      name: '',
      amount: difference > 0 ? difference : 0,
    };
    onItemsChange([...items, newItem]);
  };

  const updateItem = (id: string, field: 'name' | 'amount', value: string | number) => {
    onItemsChange(
      items.map(item => 
        item.id === id 
          ? { ...item, [field]: field === 'amount' ? Number(value) || 0 : value }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{t('breakdown.title', 'Detalhamento')}</h4>
        <div className={cn(
          "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
          isBalanced 
            ? "bg-income/10 text-income" 
            : "bg-warning/10 text-warning"
        )}>
          {isBalanced ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              {t('breakdown.balanced', 'Balanceado')}
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3" />
              {difference > 0 
                ? t('breakdown.remaining', 'Faltam {{amount}}', { amount: formatCurrency(difference) })
                : t('breakdown.over', 'Excede {{amount}}', { amount: formatCurrency(Math.abs(difference)) })
              }
            </>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          {t('breakdown.empty', 'Adicione itens para detalhar esta despesa')}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="flex gap-2">
              <Input
                placeholder={t('breakdown.itemName', 'Nome do item')}
                value={item.name}
                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                className="flex-1 h-9 text-sm"
              />
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={item.amount || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(',', '.');
                  if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                    updateItem(item.id, 'amount', val);
                  }
                }}
                className="w-24 h-9 text-sm text-right"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="w-full gap-1"
      >
        <Plus className="w-4 h-4" />
        {t('breakdown.addItem', 'Adicionar item')}
      </Button>

      {/* Summary */}
      <div className="flex justify-between text-xs pt-2 border-t">
        <span className="text-muted-foreground">{t('breakdown.itemsTotal', 'Total dos itens')}:</span>
        <span className={cn(
          "font-medium",
          isBalanced ? "text-income" : "text-foreground"
        )}>
          {formatCurrency(itemsTotal)}
        </span>
      </div>
    </div>
  );
};
