import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, ArrowLeftRight } from 'lucide-react';
import { Wallet } from '@/types/wallet';
import { cn } from '@/lib/utils';

export type TransferPreset = 'withdrawal' | 'deposit' | 'transfer';

interface TransferQuickActionsProps {
  activePreset: TransferPreset | null;
  onPresetChange: (preset: TransferPreset | null) => void;
  cashWallet: Wallet | null;
  bankWallets: Wallet[];
}

export const TransferQuickActions = ({
  activePreset,
  onPresetChange,
  cashWallet,
  bankWallets,
}: TransferQuickActionsProps) => {
  const { t } = useTranslation();

  // Only show presets if we have both cash wallet and bank wallets
  const canShowPresets = cashWallet && bankWallets.length > 0;

  if (!canShowPresets) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      <Button
        type="button"
        variant={activePreset === 'withdrawal' ? 'default' : 'outline'}
        size="sm"
        className={cn(
          'flex flex-col items-center gap-1 h-auto py-2',
          activePreset === 'withdrawal' && 'bg-amber-600 hover:bg-amber-700'
        )}
        onClick={() => onPresetChange(activePreset === 'withdrawal' ? null : 'withdrawal')}
      >
        <ArrowDown className="w-4 h-4" />
        <span className="text-xs">{t('wallets.presets.withdrawal', 'Saque')}</span>
      </Button>
      
      <Button
        type="button"
        variant={activePreset === 'deposit' ? 'default' : 'outline'}
        size="sm"
        className={cn(
          'flex flex-col items-center gap-1 h-auto py-2',
          activePreset === 'deposit' && 'bg-green-600 hover:bg-green-700'
        )}
        onClick={() => onPresetChange(activePreset === 'deposit' ? null : 'deposit')}
      >
        <ArrowUp className="w-4 h-4" />
        <span className="text-xs">{t('wallets.presets.deposit', 'Depósito')}</span>
      </Button>
      
      <Button
        type="button"
        variant={activePreset === 'transfer' ? 'default' : 'outline'}
        size="sm"
        className="flex flex-col items-center gap-1 h-auto py-2"
        onClick={() => onPresetChange(activePreset === 'transfer' ? null : 'transfer')}
      >
        <ArrowLeftRight className="w-4 h-4" />
        <span className="text-xs">{t('wallets.presets.transfer', 'Outros')}</span>
      </Button>
    </div>
  );
};
