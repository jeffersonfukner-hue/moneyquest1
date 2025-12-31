import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Wallet } from '@/types/wallet';
import { SupportedCurrency } from '@/types/database';
import { AddWalletDialog } from './AddWalletDialog';

interface WalletSelectorProps {
  wallets: Wallet[];
  selectedWalletId: string | null;
  onSelect: (walletId: string) => void;
  onWalletCreated?: (wallet: Wallet) => void;
  disabled?: boolean;
  required?: boolean;
}

export const WalletSelector = ({
  wallets,
  selectedWalletId,
  onSelect,
  onWalletCreated,
  disabled = false,
  required = false,
}: WalletSelectorProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const formatBalance = useCallback((amount: number, currency: SupportedCurrency) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  const selectedWallet = wallets.find(w => w.id === selectedWalletId);

  const handleWalletCreated = (wallet: Wallet) => {
    onSelect(wallet.id);
    onWalletCreated?.(wallet);
    setShowAddDialog(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !selectedWallet && required && "border-destructive"
            )}
            disabled={disabled}
          >
            {selectedWallet ? (
              <span className="flex items-center gap-2 truncate">
                <span>{selectedWallet.icon}</span>
                <span className="truncate">{selectedWallet.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatBalance(selectedWallet.current_balance, selectedWallet.currency)}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">{t('wallets.selectWallet')}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={t('wallets.searchWallet')} />
            <CommandList>
              <CommandEmpty>{t('wallets.noWalletsFound')}</CommandEmpty>
              <CommandGroup>
                {wallets.map((wallet) => (
                  <CommandItem
                    key={wallet.id}
                    value={wallet.name}
                    onSelect={() => {
                      onSelect(wallet.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedWalletId === wallet.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="mr-2">{wallet.icon}</span>
                    <span className="flex-1">{wallet.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatBalance(wallet.current_balance, wallet.currency)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowAddDialog(true);
                  }}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('wallets.addWallet')}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AddWalletDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onWalletCreated={handleWalletCreated}
      />
    </>
  );
};
