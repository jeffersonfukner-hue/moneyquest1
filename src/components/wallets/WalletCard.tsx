import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Pencil, Power, PowerOff, ArrowLeftRight, Scale, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Wallet } from '@/types/wallet';
import { SupportedCurrency } from '@/types/database';
import { cn } from '@/lib/utils';

interface WalletCardProps {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
  onToggleActive: (wallet: Wallet) => void;
  onTransfer?: (wallet: Wallet) => void;
  onAdjust?: (wallet: Wallet) => void;
  onDelete?: (wallet: Wallet) => void;
}

export const WalletCard = ({ wallet, onEdit, onToggleActive, onTransfer, onAdjust, onDelete }: WalletCardProps) => {
  const { t } = useTranslation();

  const formatBalance = useCallback((amount: number, currency: SupportedCurrency) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  const balanceColor = wallet.current_balance >= 0 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400';

  const isCashWallet = wallet.type === 'cash';

  return (
    <Card className={cn(
      "p-4 transition-all",
      !wallet.is_active && "opacity-60"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${wallet.color}20` }}
          >
            {wallet.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{wallet.name}</h3>
              {isCashWallet && (
                <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600 dark:text-amber-400">
                  💵 {t('wallets.types.cash')}
                </Badge>
              )}
            </div>
            {wallet.institution && (
              <p className="text-sm text-muted-foreground">{wallet.institution}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {!isCashWallet && <>{t(`wallets.types.${wallet.type}`)} • </>}{wallet.currency}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(wallet)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </DropdownMenuItem>
            {wallet.is_active && onTransfer && (
              <DropdownMenuItem onClick={() => onTransfer(wallet)}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                {t('wallets.transfer')}
              </DropdownMenuItem>
            )}
            {wallet.is_active && isCashWallet && onAdjust && (
              <DropdownMenuItem onClick={() => onAdjust(wallet)}>
                <Scale className="mr-2 h-4 w-4" />
                {t('wallets.cashAdjustment.adjustBalance', 'Ajustar saldo')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onToggleActive(wallet)}>
              {wallet.is_active ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  {t('wallets.deactivate')}
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  {t('wallets.reactivate')}
                </>
              )}
            </DropdownMenuItem>
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(wallet)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('wallets.deletePermanently', 'Excluir permanentemente')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 pt-4 border-t border-border space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t('wallets.initialBalance')}</span>
          <span className="text-sm text-muted-foreground">
            {formatBalance(wallet.initial_balance, wallet.currency)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t('wallets.currentBalance')}</span>
          <span className={cn("text-lg font-bold", balanceColor)}>
            {formatBalance(wallet.current_balance, wallet.currency)}
          </span>
        </div>
      </div>

      {!wallet.is_active && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          {t('wallets.inactive')}
        </div>
      )}
    </Card>
  );
};
