import { Transaction } from '@/types/database';
import { ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface TransactionsListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export const TransactionsList = ({ transactions, onDelete }: TransactionsListProps) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-8 shadow-md text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📝</span>
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">No transactions yet</h3>
        <p className="text-sm text-muted-foreground">
          Start logging your income and expenses to earn XP!
        </p>
      </div>
    );
  }

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="bg-card rounded-2xl p-6 shadow-md animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Transactions</h3>
      
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {Object.entries(groupedTransactions).map(([date, txs]) => (
          <div key={date}>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {format(new Date(date), 'EEEE, MMMM d')}
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
        {transaction.category} • +{transaction.xp_earned} XP
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
