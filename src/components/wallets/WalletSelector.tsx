import { useState, useCallback, useRef } from 'react';
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
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  // Scroll element into view when popover opens on mobile
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && isMobile && triggerRef.current) {
      // Longer delay to let the popover render and position correctly
      setTimeout(() => {
        // Scroll the trigger into view, leaving space for the popover above
        triggerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 150);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
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
              <span className="flex items-center gap-2 min-w-0 w-full">
                <span className="flex-shrink-0">{selectedWallet.icon}</span>
                <span className="truncate flex-1 min-w-0">{selectedWallet.name}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatBalance(selectedWallet.current_balance, selectedWallet.currency)}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">{t('wallets.selectWallet')}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0" 
          align="start"
          side={isMobile ? "top" : "bottom"}
          sideOffset={4}
          onOpenAutoFocus={(e) => {
            // Prevent auto-focus on mobile to avoid keyboard
            if (isMobile) e.preventDefault();
          }}
        >
          <Command className="flex flex-col">
            <CommandList className="max-h-[200px] order-1">
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
            <CommandInput 
              placeholder={t('wallets.searchWallet')} 
              className="order-2 border-t"
            />
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
