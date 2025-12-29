import { useState, useMemo } from 'react';
import { Transaction } from '@/types/database';
import { ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface TransactionsListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

type FilterPeriod = 'all' | 'week' | 'month' | 'year';

export const TransactionsList = ({ transactions, onDelete }: TransactionsListProps) => {
  const [filter, setFilter] = useState<FilterPeriod>('all');

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const txDate = new Date(t.date);
      switch (filter) {
        case 'week': return txDate >= subDays(now, 7);
        case 'month': return txDate >= subDays(now, 30);
        case 'year': return txDate >= subDays(now, 365);
        default: return true;
      }
    });
  }, [transactions, filter]);

  // Group filtered transactions by date
  const groupedTransactions = useMemo(() => {
    return filteredTransactions.reduce((groups, transaction) => {
      const date = transaction.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, Transaction[]>);
  }, [filteredTransactions]);

  if (transactions.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-8 shadow-md text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📝</span>
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">Nenhuma transação ainda</h3>
        <p className="text-sm text-muted-foreground">
          Comece a registrar suas receitas e despesas para ganhar XP!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-md animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="font-display text-lg font-semibold text-foreground">Transações</h3>
        <ToggleGroup 
          type="single" 
          value={filter} 
          onValueChange={(v) => v && setFilter(v as FilterPeriod)}
          className="bg-muted/50 rounded-lg p-1"
        >
          <ToggleGroupItem value="all" className="text-xs px-3 py-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
            Tudo
          </ToggleGroupItem>
          <ToggleGroupItem value="week" className="text-xs px-3 py-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
            Semana
          </ToggleGroupItem>
          <ToggleGroupItem value="month" className="text-xs px-3 py-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
            Mês
          </ToggleGroupItem>
          <ToggleGroupItem value="year" className="text-xs px-3 py-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm rounded-md">
            Ano
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Nenhuma transação encontrada para este período.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {Object.entries(groupedTransactions).map(([date, txs]) => (
            <div key={date}>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {format(new Date(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
              <div className="space-y-2">
                {txs.map(transaction => (
                  <TransactionItem 
                    key={transaction.id} 
                    transaction={transaction} 
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TransactionItem = ({ 
  transaction, 
  onDelete 
}: { 
  transaction: Transaction; 
  onDelete: (id: string) => void;
}) => (
  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors group">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
      transaction.type === 'INCOME' 
        ? 'bg-income/20' 
        : 'bg-expense/20'
    }`}>
      {transaction.type === 'INCOME' ? (
        <ArrowUpCircle className="w-5 h-5 text-income" />
      ) : (
        <ArrowDownCircle className="w-5 h-5 text-expense" />
      )}
    </div>
    
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground truncate">
        {transaction.description}
      </p>
      <p className="text-xs text-muted-foreground">
        {format(new Date(transaction.date), "d MMM", { locale: ptBR })} • {transaction.category} • +{transaction.xp_earned} XP
      </p>
    </div>

    <div className="text-right">
      <p className={`text-sm font-bold ${
        transaction.type === 'INCOME' ? 'text-income' : 'text-expense'
      }`}>
        {transaction.type === 'INCOME' ? '+' : '-'}${transaction.amount.toLocaleString()}
      </p>
    </div>

    <Button
      variant="ghost"
      size="icon"
      className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
      onClick={() => onDelete(transaction.id)}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  </div>
);
