import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/contexts/CurrencyContext';
import { BankLineWithMatch } from '@/hooks/useReconciliation';
import { cn } from '@/lib/utils';

interface CreateTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankLine: BankLineWithMatch;
  onCreate: (category: string, supplier?: string) => Promise<void>;
}

export const CreateTransactionDialog = ({
  open,
  onOpenChange,
  bankLine,
  onCreate,
}: CreateTransactionDialogProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { getCategoriesByType } = useCategories();
  
  const bankType = bankLine.amount >= 0 ? 'INCOME' : 'EXPENSE';
  const categories = getCategoriesByType(bankType);
  
  const [category, setCategory] = useState('');
  const [supplier, setSupplier] = useState(bankLine.counterparty || '');
  const [submitting, setSubmitting] = useState(false);

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const handleCreate = async () => {
    if (!category) return;
    setSubmitting(true);
    await onCreate(category, supplier || undefined);
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {t('reconciliation.createTransaction', 'Criar Transação')}
          </DialogTitle>
          <DialogDescription>
            Uma nova transação será criada e automaticamente conciliada.
          </DialogDescription>
        </DialogHeader>

        {/* Bank line info */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Lançamento do banco:</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{bankLine.description}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(bankLine.transaction_date)}
              </p>
            </div>
            <p className={cn(
              "font-bold tabular-nums",
              bankLine.amount >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {bankLine.amount >= 0 ? '+' : ''}{formatCurrency(bankLine.amount)}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('transactions.category', 'Categoria')} *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t('transactions.selectCategory', 'Selecione...')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('transactions.supplier', 'Fornecedor')} ({t('common.optional')})</Label>
            <Input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder={t('transactions.supplierPlaceholder', 'Nome do fornecedor')}
            />
          </div>

          {/* Summary */}
          <div className="bg-card border rounded-lg p-3 text-sm">
            <p className="text-muted-foreground mb-2">Será criado:</p>
            <ul className="space-y-1">
              <li><strong>Tipo:</strong> {bankType === 'INCOME' ? 'Entrada' : 'Saída'}</li>
              <li><strong>Valor:</strong> {formatCurrency(Math.abs(bankLine.amount))}</li>
              <li><strong>Data:</strong> {formatDate(bankLine.transaction_date)}</li>
              <li><strong>Descrição:</strong> {bankLine.description}</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!category || submitting}
          >
            <Plus className="w-4 h-4 mr-2" />
            {submitting ? t('common.loading') : t('reconciliation.createAndReconcile', 'Criar e Conciliar')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
