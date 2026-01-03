import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, ArrowDownCircle, Receipt, ChevronRight } from 'lucide-react';
import { Transaction, SupportedCurrency } from '@/types/database';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { type TabId } from '@/components/navigation/BottomNavigation';
import { formatMoney } from '@/lib/formatters';
import { parseDateString } from '@/lib/dateUtils';

interface RecentTransactionsCardProps {
  transactions: Transaction[];
  onViewMore: (tab: TabId) => void;
}

export const RecentTransactionsCard = ({ transactions, onViewMore }: RecentTransactionsCardProps) => {
  const { t } = useTranslation();
  const { formatCurrency, currency: userCurrency, formatConverted } = useCurrency();
  const { dateLocale } = useLanguage();

  // Sort by date DESC and take first 5
  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

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
        {recentTransactions.map((transaction) => {
          const transactionCurrency = transaction.currency || 'BRL';
          const isDifferentCurrency = transactionCurrency !== userCurrency;
          
          return (
            <div
              key={transaction.id}
              className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {transaction.type === 'INCOME' ? (
                  <ArrowUpCircle className="w-4 h-4 text-income flex-shrink-0" />
                ) : (
                  <ArrowDownCircle className="w-4 h-4 text-expense flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-sm truncate text-foreground block">
                    {transaction.description.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    {format(parseDateString(transaction.date), "d MMM", { locale: dateLocale })}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <span
                  className={`text-sm font-bold ${
                    transaction.type === 'INCOME' ? 'text-income' : 'text-expense'
                  }`}
                >
                  {transaction.type === 'INCOME' ? '+' : '-'}
                  {isDifferentCurrency 
                    ? formatConverted(transaction.amount, transactionCurrency as SupportedCurrency)
                    : formatCurrency(transaction.amount)
                  }
                </span>
                {isDifferentCurrency && (
                  <span className="text-xs text-muted-foreground block">
                    ({formatMoney(transaction.amount, transactionCurrency as SupportedCurrency)})
                  </span>
                )}
              </div>
            </div>
          );
        })}
        
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
