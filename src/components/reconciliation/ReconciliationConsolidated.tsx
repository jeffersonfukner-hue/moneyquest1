import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Landmark, CreditCard, Banknote, FileWarning, 
  TrendingUp, TrendingDown, Wallet, PiggyBank 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useWallets } from '@/hooks/useWallets';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useLoans } from '@/hooks/useLoans';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

interface WalletPendingCount {
  wallet_id: string;
  wallet_name: string;
  pending_count: number;
}

export const ReconciliationConsolidated = () => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const { activeWallets } = useWallets();
  const { creditCards } = useCreditCards();
  const { loans } = useLoans();

  // Fetch pending counts per wallet
  const { data: pendingCounts } = useQuery({
    queryKey: ['reconciliation-pending-counts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('bank_statement_lines')
        .select('wallet_id, wallets!inner(name)')
        .eq('user_id', user.id)
        .eq('reconciliation_status', 'pending');

      if (error) throw error;

      // Group by wallet
      const counts: Record<string, { name: string; count: number }> = {};
      for (const row of data || []) {
        const walletId = row.wallet_id;
        const walletName = (row.wallets as any)?.name || 'Desconhecido';
        if (!counts[walletId]) {
          counts[walletId] = { name: walletName, count: 0 };
        }
        counts[walletId].count++;
      }

      return Object.entries(counts).map(([wallet_id, { name, count }]) => ({
        wallet_id,
        wallet_name: name,
        pending_count: count,
      }));
    },
    enabled: !!user,
  });

  // Calculate totals
  const totals = useMemo(() => {
    // Bank accounts (excluding cash)
    const bankWallets = activeWallets.filter(w => w.type !== 'cash');
    const bankTotal = bankWallets.reduce((sum, w) => sum + w.current_balance, 0);

    // Cash wallets
    const cashWallets = activeWallets.filter(w => w.type === 'cash');
    const cashTotal = cashWallets.reduce((sum, w) => sum + w.current_balance, 0);

    // Credit cards (used limit = total - available)
    const cardUsedTotal = creditCards
      .filter(c => c.is_active)
      .reduce((sum, c) => sum + (c.total_limit - c.available_limit), 0);

    // Loans (remaining balance)
    const loanTotal = (loans || [])
      .filter(l => l.status === 'ativo')
      .reduce((sum, l) => sum + l.saldo_devedor, 0);

    // Total pending reconciliations
    const totalPending = (pendingCounts || []).reduce((sum, p) => sum + p.pending_count, 0);

    // Net worth (bank + cash - cards - loans)
    const netWorth = bankTotal + cashTotal - cardUsedTotal - loanTotal;

    return {
      bankTotal,
      cashTotal,
      cardUsedTotal,
      loanTotal,
      totalPending,
      netWorth,
      bankCount: bankWallets.length,
      cashCount: cashWallets.length,
      cardCount: creditCards.filter(c => c.is_active).length,
      loanCount: (loans || []).filter(l => l.status === 'ativo').length,
    };
  }, [activeWallets, creditCards, loans, pendingCounts]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Bank Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas Bancárias
            </CardTitle>
            <Landmark className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrency(totals.bankTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totals.bankCount} conta(s) ativa(s)
            </p>
          </CardContent>
        </Card>

        {/* Cash */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dinheiro em Espécie
            </CardTitle>
            <Banknote className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrency(totals.cashTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totals.cashCount} carteira(s) de dinheiro
            </p>
          </CardContent>
        </Card>

        {/* Credit Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cartões de Crédito
            </CardTitle>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-red-600">
              -{formatCurrency(totals.cardUsedTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totals.cardCount} cartão(ões) em uso
            </p>
          </CardContent>
        </Card>

        {/* Loans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Empréstimos
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-red-600">
              -{formatCurrency(totals.loanTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totals.loanCount} empréstimo(s) ativo(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Net Worth Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Patrimônio Líquido
          </CardTitle>
          <CardDescription>
            Saldo total considerando todos os ativos e passivos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold tabular-nums ${totals.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totals.netWorth >= 0 ? '+' : ''}{formatCurrency(totals.netWorth)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {totals.netWorth >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm text-muted-foreground">
              Banco + Dinheiro - Cartões - Empréstimos
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Pending Reconciliations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-amber-500" />
            Pendências de Conciliação
          </CardTitle>
          <CardDescription>
            Lançamentos bancários aguardando conciliação por conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(pendingCounts || []).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma pendência de conciliação</p>
              <p className="text-sm mt-1">Todas as contas estão conciliadas!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(pendingCounts || []).map((item) => (
                <div key={item.wallet_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Landmark className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{item.wallet_name}</span>
                  </div>
                  <Badge variant="outline" className="border-amber-500/50 text-amber-600">
                    {item.pending_count} pendente(s)
                  </Badge>
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total de pendências:</span>
                  <span className="font-bold text-amber-600">{totals.totalPending}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
