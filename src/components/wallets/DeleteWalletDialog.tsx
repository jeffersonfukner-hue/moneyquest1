import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet } from '@/types/wallet';
import { supabase } from '@/integrations/supabase/client';

interface DeleteWalletDialogProps {
  wallet: Wallet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (walletId: string) => Promise<void>;
}

export const DeleteWalletDialog = ({
  wallet,
  open,
  onOpenChange,
  onConfirm,
}: DeleteWalletDialogProps) => {
  const { t } = useTranslation();
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [linkedCounts, setLinkedCounts] = useState({ transactions: 0, transfers: 0 });
  const [loadingCounts, setLoadingCounts] = useState(false);

  useEffect(() => {
    if (open && wallet) {
      setConfirmName('');
      fetchLinkedCounts(wallet.id);
    }
  }, [open, wallet]);

  const fetchLinkedCounts = async (walletId: string) => {
    setLoadingCounts(true);
    try {
      const [transactionsRes, transfersOutRes, transfersInRes] = await Promise.all([
        supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('wallet_id', walletId),
        supabase.from('wallet_transfers').select('id', { count: 'exact', head: true }).eq('from_wallet_id', walletId),
        supabase.from('wallet_transfers').select('id', { count: 'exact', head: true }).eq('to_wallet_id', walletId),
      ]);

      const transactions = transactionsRes.count || 0;
      const transfers = (transfersOutRes.count || 0) + (transfersInRes.count || 0);

      setLinkedCounts({ transactions, transfers });
    } catch (error) {
      console.error('Error fetching linked counts:', error);
    } finally {
      setLoadingCounts(false);
    }
  };

  const handleConfirm = async () => {
    if (!wallet || confirmName !== wallet.name) return;

    setIsDeleting(true);
    try {
      await onConfirm(wallet.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const isNameMatch = wallet && confirmName === wallet.name;

  if (!wallet) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t('wallets.deleteTitle', 'Excluir Carteira')}
          </DialogTitle>
          <DialogDescription className="text-left">
            {t('wallets.deleteWarning', 'Esta ação é irreversível. A carteira e todas as transações vinculadas serão excluídas.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Wallet info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: `${wallet.color}20` }}
            >
              {wallet.icon}
            </div>
            <div>
              <p className="font-semibold">{wallet.name}</p>
              {wallet.institution && (
                <p className="text-sm text-muted-foreground">{wallet.institution}</p>
              )}
            </div>
          </div>

          {/* Impact preview */}
          {!loadingCounts && (linkedCounts.transactions > 0 || linkedCounts.transfers > 0) && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg space-y-1">
              <p className="text-sm font-medium text-destructive">
                {t('wallets.deleteImpact', 'Dados que serão excluídos:')}
              </p>
              {linkedCounts.transactions > 0 && (
                <p className="text-sm text-muted-foreground">
                  • {t('wallets.linkedTransactions', '{{count}} transações serão excluídas', { count: linkedCounts.transactions })}
                </p>
              )}
              {linkedCounts.transfers > 0 && (
                <p className="text-sm text-muted-foreground">
                  • {t('wallets.linkedTransfers', '{{count}} transferências serão excluídas', { count: linkedCounts.transfers })}
                </p>
              )}
            </div>
          )}

          {loadingCounts && (
            <div className="p-3 bg-muted rounded-lg animate-pulse">
              <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
            </div>
          )}

          {/* Confirmation input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-name">
              {t('wallets.deleteConfirmLabel', 'Digite o nome da carteira para confirmar:')}
            </Label>
            <Input
              id="confirm-name"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={wallet.name}
              className={confirmName && !isNameMatch ? 'border-destructive' : ''}
            />
            {confirmName && !isNameMatch && (
              <p className="text-xs text-destructive">
                {t('wallets.deleteNameMismatch', 'O nome digitado não corresponde')}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isNameMatch || isDeleting}
          >
            {isDeleting ? (
              <span className="animate-pulse">{t('common.deleting', 'Excluindo...')}</span>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('wallets.deletePermanently', 'Excluir permanentemente')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
