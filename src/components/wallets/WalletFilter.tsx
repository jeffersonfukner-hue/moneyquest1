import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wallet } from '@/types/wallet';

interface WalletFilterProps {
  wallets: Wallet[];
  selectedWalletId: string | null;
  onSelect: (walletId: string | null) => void;
  showAll?: boolean;
}

export const WalletFilter = ({
  wallets,
  selectedWalletId,
  onSelect,
  showAll = true,
}: WalletFilterProps) => {
  const { t } = useTranslation();

  return (
    <Select
      value={selectedWalletId || 'all'}
      onValueChange={(value) => onSelect(value === 'all' ? null : value)}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={t('wallets.filterByWallet')} />
      </SelectTrigger>
      <SelectContent>
        {showAll && (
          <SelectItem value="all">
            {t('wallets.allWallets')}
          </SelectItem>
        )}
        {wallets.map((wallet) => (
          <SelectItem key={wallet.id} value={wallet.id}>
            <span className="flex items-center gap-2">
              <span>{wallet.icon}</span>
              <span>{wallet.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
