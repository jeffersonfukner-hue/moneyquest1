import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Transaction } from '@/types/database';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface RecentTransactionsWidgetProps {
  transactions: Transaction[];
  limit?: number;
}

export const RecentTransactionsWidget = ({ 
  transactions, 
  limit = 8 
}: RecentTransactionsWidgetProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [transactions, limit]);

  if (recentTransactions.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('dashboard.recentTransactions', 'Últimas Transações')}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground text-sm">
            {t('dashboard.noTransactions', 'Nenhuma transação registrada.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t('dashboard.recentTransactions', 'Últimas Transações')}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => navigate('/reports')}
        >
          {t('common.viewAll', 'Ver todas')}
          <ArrowRight className="w-3 h-3" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 hover:bg-muted/30 -mx-2 px-2 rounded cursor-pointer transition-colors"
              onClick={() => navigate('/reports')}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                  transaction.type === 'INCOME' 
                    ? "bg-success/10 text-success" 
                    : "bg-destructive/10 text-destructive"
                )}>
                  {transaction.type === 'INCOME' 
                    ? <TrendingUp className="w-3.5 h-3.5" />
                    : <TrendingDown className="w-3.5 h-3.5" />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(transaction.date), 'dd MMM', { locale: ptBR })}
                  </p>
                </div>
              </div>
              <span className={cn(
                "font-semibold tabular-nums text-sm flex-shrink-0 ml-2",
                transaction.type === 'INCOME' ? "text-success" : "text-destructive"
              )}>
                {transaction.type === 'INCOME' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
