import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Plus, Search } from 'lucide-react';
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);

  const formatBalance = useCallback((amount: number, currency: SupportedCurrency) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  const selectedWallet = wallets.find(w => w.id === selectedWalletId);

  const filteredWallets = searchQuery
    ? wallets.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : wallets;

  const handleWalletCreated = (wallet: Wallet) => {
    onSelect(wallet.id);
    onWalletCreated?.(wallet);
    setShowAddDialog(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const handleSelectWallet = (walletId: string) => {
    onSelect(walletId);
    setOpen(false);
    setShowSearch(false);
    setSearchQuery('');
  };

  const TriggerButton = (
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
  );

  // Mobile: Use Drawer (bottom sheet)
  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerTrigger asChild>
            {TriggerButton}
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle>{t('wallets.selectWallet')}</DrawerTitle>
            </DrawerHeader>
            
            <div className="px-4 pb-4 flex flex-col gap-3">
              {/* Optional search - 2 step approach */}
              {showSearch ? (
                <Input
                  placeholder={t('wallets.searchWallet')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="h-10"
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSearch(true)}
                  className="w-full justify-start text-muted-foreground"
                >
                  <Search className="mr-2 h-4 w-4" />
                  {t('wallets.searchWallet')}
                </Button>
              )}

              {/* Wallet list */}
              <ScrollArea className="max-h-[40vh]">
                <div className="flex flex-col gap-1">
                  {filteredWallets.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      {t('wallets.noWalletsFound')}
                    </p>
                  ) : (
                    filteredWallets.map((wallet) => (
                      <Button
                        key={wallet.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start h-12 px-3",
                          selectedWalletId === wallet.id && "bg-accent"
                        )}
                        onClick={() => handleSelectWallet(wallet.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 flex-shrink-0",
                            selectedWalletId === wallet.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="mr-2 flex-shrink-0">{wallet.icon}</span>
                        <span className="flex-1 text-left truncate">{wallet.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatBalance(wallet.current_balance, wallet.currency)}
                        </span>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Add wallet button */}
              <Button
                variant="outline"
                className="w-full text-primary"
                onClick={() => {
                  setOpen(false);
                  setShowAddDialog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('wallets.addWallet')}
              </Button>
            </div>
          </DrawerContent>
        </Drawer>

        <AddWalletDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onWalletCreated={handleWalletCreated}
        />
      </>
    );
  }

  // Desktop: Use Popover
  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          {TriggerButton}
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0" 
          align="start"
          sideOffset={4}
        >
          <Command>
            <CommandInput placeholder={t('wallets.searchWallet')} />
            <CommandList className="max-h-[200px]">
              <CommandEmpty>{t('wallets.noWalletsFound')}</CommandEmpty>
              <CommandGroup>
                {wallets.map((wallet) => (
                  <CommandItem
                    key={wallet.id}
                    value={wallet.name}
                    onSelect={() => handleSelectWallet(wallet.id)}
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
