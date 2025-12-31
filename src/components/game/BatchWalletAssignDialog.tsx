import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWallets } from '@/hooks/useWallets';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wallet, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface BatchWalletAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (walletId: string) => Promise<{ error: Error | null; updatedCount: number }>;
}

export const BatchWalletAssignDialog = ({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
}: BatchWalletAssignDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { activeWallets } = useWallets();
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const selectedWallet = activeWallets.find(w => w.id === selectedWalletId);

  const handleConfirm = async () => {
    if (!selectedWalletId) return;

    setIsLoading(true);
    try {
      const result = await onConfirm(selectedWalletId);
      if (result.error) {
        toast({
          title: t('common.error'),
          description: t('transactions.batchActions.error'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('common.success'),
          description: t('transactions.batchActions.success', { count: result.updatedCount }),
        });
        onOpenChange(false);
      }
    } finally {
      setIsLoading(false);
      setSelectedWalletId('');
    }
  };

  const handleCancel = () => {
    setSelectedWalletId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            {t('transactions.batchActions.assignWalletTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('transactions.batchActions.assignWalletDescription', { count: selectedCount })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={popoverOpen}
                className="w-full justify-between"
              >
                {selectedWallet ? (
                  <span className="flex items-center gap-2 truncate">
                    <span>{selectedWallet.icon}</span>
                    <span className="truncate">{selectedWallet.institution || selectedWallet.name}</span>
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
                    {activeWallets.map((wallet) => (
                      <CommandItem
                        key={wallet.id}
                        value={wallet.name}
                        onSelect={() => {
                          setSelectedWalletId(wallet.id);
                          setPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedWalletId === wallet.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="mr-2">{wallet.icon}</span>
                        <span className="flex-1">{wallet.institution || wallet.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedWalletId || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              t('common.confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
