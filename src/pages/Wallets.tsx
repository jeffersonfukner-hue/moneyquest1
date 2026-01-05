import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Wallet as WalletIcon, ArrowLeft, ArrowLeftRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallets } from '@/hooks/useWallets';
import { WalletCard } from '@/components/wallets/WalletCard';
import { AddWalletDialog } from '@/components/wallets/AddWalletDialog';
import { EditWalletDialog } from '@/components/wallets/EditWalletDialog';
import { WalletBalancesWidget } from '@/components/wallets/WalletBalancesWidget';
import { TransferDialog } from '@/components/wallets/TransferDialog';
import { Wallet } from '@/types/wallet';
import { AppLayout } from '@/components/layout/AppLayout';

const WalletsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeWallets, inactiveWallets, deleteWallet, reactivateWallet, loading } = useWallets();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferFromWallet, setTransferFromWallet] = useState<Wallet | undefined>();
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const handleOpenTransfer = (wallet?: Wallet) => {
    setTransferFromWallet(wallet);
    setShowTransferDialog(true);
  };

  const handleToggleActive = async (wallet: Wallet) => {
    if (wallet.is_active) {
      await deleteWallet(wallet.id);
    } else {
      await reactivateWallet(wallet.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      {/* Simple Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border safe-area-top">
        <div className="flex items-center h-14 px-4 max-w-md mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display font-bold text-lg text-foreground">{t('wallets.title')}</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Balances Overview */}
        <WalletBalancesWidget wallets={activeWallets} />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowAddDialog(true)} 
            className="flex-1"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('wallets.addWallet')}
          </Button>
          <Button 
            onClick={() => handleOpenTransfer()} 
            variant="outline"
            className="flex-1"
            disabled={activeWallets.length < 2}
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            {t('wallets.transfer')}
          </Button>
        </div>

        {/* Wallets Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              {t('wallets.active')} ({activeWallets.length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              {t('wallets.inactiveTab')} ({inactiveWallets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3 mt-4">
            {activeWallets.length === 0 ? (
              <div className="text-center py-8">
                <WalletIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('wallets.noActiveWallets')}
                </p>
              </div>
            ) : (
              activeWallets.map(wallet => (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  onEdit={setEditingWallet}
                  onToggleActive={handleToggleActive}
                  onTransfer={handleOpenTransfer}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="inactive" className="space-y-3 mt-4">
            {inactiveWallets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {t('wallets.noInactiveWallets')}
                </p>
              </div>
            ) : (
              inactiveWallets.map(wallet => (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  onEdit={setEditingWallet}
                  onToggleActive={handleToggleActive}
                  onTransfer={handleOpenTransfer}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AddWalletDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      <EditWalletDialog
        wallet={editingWallet}
        open={!!editingWallet}
        onOpenChange={(open) => !open && setEditingWallet(null)}
      />

      <TransferDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        preselectedWallet={transferFromWallet}
      />
    </AppLayout>
  );
};

export default WalletsPage;
