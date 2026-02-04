import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ArrowUpRight, ArrowDownRight, Calendar, Clock } from 'lucide-react';
import { Transaction } from '@/types/database';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDateString } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TransactionDrilldownProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  title: string;
  subtitle?: string;
}

export const TransactionDrilldown = ({
  isOpen,
  onClose,
  transactions,
  title,
  subtitle,
}: TransactionDrilldownProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [sortBy, setSortBy] = useState<'date' | 'created_at'>('created_at');

  const totalIncome = transactions
    .filter(tx => tx.type === 'INCOME')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalExpenses = transactions
    .filter(tx => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (sortBy === 'created_at') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    const dateA = parseDateString(a.date);
    const dateB = parseDateString(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg">{title}</SheetTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 rounded-lg bg-green-500/10">
            <p className="text-xs text-muted-foreground">Entradas</p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400 tabular-nums">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10">
            <p className="text-xs text-muted-foreground">Saídas</p>
            <p className="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Transações</p>
            <p className="text-sm font-bold tabular-nums">{transactions.length}</p>
          </div>
        </div>

        {/* Sort Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">{t('transactions.drilldown.sortBy', 'Ordenar por:')}</span>
          <div className="flex gap-1">
            <Button
              variant={sortBy === 'created_at' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('created_at')}
              className="h-7 text-xs gap-1"
            >
              <Clock className="w-3 h-3" />
              {t('transactions.drilldown.sortByCreated', 'Últimos lançamentos')}
            </Button>
            <Button
              variant={sortBy === 'date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('date')}
              className="h-7 text-xs gap-1"
            >
              <Calendar className="w-3 h-3" />
              {t('transactions.drilldown.sortByDate', 'Data da transação')}
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-300px)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">
                  {sortBy === 'created_at' 
                    ? t('transactions.drilldown.createdAt', 'Lançado') 
                    : t('transactions.drilldown.dateColumn', 'Data')}
                </TableHead>
                <TableHead>{t('transactions.drilldown.description', 'Descrição')}</TableHead>
                <TableHead className="text-right">{t('transactions.drilldown.amount', 'Valor')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.map((tx) => {
                const txDate = parseDateString(tx.date);
                const createdDate = new Date(tx.created_at);
                const displayDate = sortBy === 'created_at' ? createdDate : txDate;
                const altDate = sortBy === 'created_at' ? txDate : createdDate;
                const altLabel = sortBy === 'created_at' 
                  ? t('transactions.drilldown.transactionDate', 'Data da transação')
                  : t('transactions.drilldown.createdAtLabel', 'Lançado em');
                
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {format(displayDate, 'dd/MM', { locale: ptBR })}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{altLabel}: {format(altDate, 'dd/MM/yyyy', { locale: ptBR })}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {tx.description}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t(`transactions.categories.${tx.category}`, tx.category)}
                          {tx.supplier && ` • ${tx.supplier}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={cn(
                      'text-right tabular-nums font-medium',
                      tx.type === 'INCOME' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    )}>
                      <div className="flex items-center justify-end gap-1">
                        {tx.type === 'INCOME' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {formatCurrency(tx.amount)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {sortedTransactions.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              Nenhuma transação encontrada.
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
