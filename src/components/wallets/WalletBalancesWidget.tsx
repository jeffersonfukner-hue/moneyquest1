import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet as WalletIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet } from '@/types/wallet';
import { useCurrency } from '@/contexts/CurrencyContext';
import { SupportedCurrency } from '@/types/database';

interface WalletBalancesWidgetProps {
  wallets: Wallet[];
}

export const WalletBalancesWidget = ({ wallets }: WalletBalancesWidgetProps) => {
  const { t } = useTranslation();
  const { formatCurrency, convertToUserCurrency, currency: userCurrency } = useCurrency();

  const formatWithCurrency = useCallback((amount: number, currency: SupportedCurrency) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  // Group balances by currency
  const balancesByCurrency = wallets.reduce((acc, wallet) => {
    if (!wallet.is_active) return acc;
    
    const curr = wallet.currency;
    if (!acc[curr]) acc[curr] = 0;
    acc[curr] += wallet.current_balance;
    return acc;
  }, {} as Record<string, number>);

  // Calculate total in user's currency
  const totalInUserCurrency = wallets
    .filter(w => w.is_active)
    .reduce((total, wallet) => {
      return total + convertToUserCurrency(wallet.current_balance, wallet.currency as SupportedCurrency);
    }, 0);

  const currencies = Object.keys(balancesByCurrency);

  if (wallets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <WalletIcon className="w-5 h-5" />
            {t('wallets.balances')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('wallets.noWallets')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <WalletIcon className="w-5 h-5" />
          {t('wallets.balances')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Total consolidated */}
        <div className="p-3 rounded-lg bg-primary/10">
          <p className="text-xs text-muted-foreground">{t('wallets.totalBalance')}</p>
          <p className="text-xl font-bold text-primary">
            {formatCurrency(totalInUserCurrency)}
          </p>
        </div>

        {/* Per currency breakdown (if multiple currencies) */}
        {currencies.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              {t('wallets.byCurrency')}
            </p>
            {currencies.map(curr => (
              <div key={curr} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{curr}</span>
                <span className="font-medium">
                  {formatWithCurrency(balancesByCurrency[curr], curr as SupportedCurrency)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Per wallet (compact list) */}
        <div className="space-y-2 pt-2 border-t border-border">
          {wallets.filter(w => w.is_active).slice(0, 5).map(wallet => (
            <div key={wallet.id} className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2">
                <span>{wallet.icon}</span>
                <span className="truncate max-w-[120px]">{wallet.name}</span>
              </span>
              <span className={wallet.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatWithCurrency(wallet.current_balance, wallet.currency)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
