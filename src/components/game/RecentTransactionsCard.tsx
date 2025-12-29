import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, ArrowDownCircle, Receipt, ChevronRight } from 'lucide-react';
import { Transaction } from '@/types/database';
import { useCurrency } from '@/contexts/CurrencyContext';
import { type TabId } from '@/components/navigation/BottomNavigation';

interface RecentTransactionsCardProps {
  transactions: Transaction[];
  onViewMore: (tab: TabId) => void;
}

export const RecentTransactionsCard = ({ transactions, onViewMore }: RecentTransactionsCardProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  const recentTransactions = transactions.slice(0, 5);

  if (recentTransactions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Receipt className="w-4 h-4" />
          {t('transactions.recent')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {recentTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {transaction.type === 'INCOME' ? (
                <ArrowUpCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <ArrowDownCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              <span className="text-sm truncate text-foreground">
                {transaction.description}
              </span>
            </div>
            <span
              className={`text-sm font-medium flex-shrink-0 ml-2 ${
                transaction.type === 'INCOME' ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {transaction.type === 'INCOME' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </span>
          </div>
        ))}
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-muted-foreground hover:text-foreground"
          onClick={() => onViewMore('transactions')}
        >
          {t('transactions.viewMore')}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};
