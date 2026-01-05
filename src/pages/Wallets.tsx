import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Wallet as WalletIcon, ArrowLeft, ArrowLeftRight, Clock, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallets } from '@/hooks/useWallets';
import { useCreditCards, CreditCard as CreditCardType } from '@/hooks/useCreditCards';
import { WalletCard } from '@/components/wallets/WalletCard';
import { SortableWalletCard } from '@/components/wallets/SortableWalletCard';
import { AddWalletDialog } from '@/components/wallets/AddWalletDialog';
import { EditWalletDialog } from '@/components/wallets/EditWalletDialog';
import { WalletBalancesWidget } from '@/components/wallets/WalletBalancesWidget';
import { TransferDialog } from '@/components/wallets/TransferDialog';
import { ScheduledTransferDialog } from '@/components/wallets/ScheduledTransferDialog';
import { TransferHistoryCard } from '@/components/wallets/TransferHistoryCard';
import { ScheduledTransfersCard } from '@/components/wallets/ScheduledTransfersCard';
import { CreditCardCard } from '@/components/creditCards/CreditCardCard';
import { AddCreditCardDialog } from '@/components/creditCards/AddCreditCardDialog';
import { EditCreditCardDialog } from '@/components/creditCards/EditCreditCardDialog';
import { Wallet } from '@/types/wallet';
import { AppLayout } from '@/components/layout/AppLayout';

const WalletsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeWallets, inactiveWallets, wallets, deleteWallet, reactivateWallet, reorderWallets, loading } = useWallets();
  const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard, loading: cardsLoading } = useCreditCards();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showScheduledDialog, setShowScheduledDialog] = useState(false);
  const [transferFromWallet, setTransferFromWallet] = useState<Wallet | undefined>();
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = activeWallets.findIndex((w) => w.id === active.id);
      const newIndex = activeWallets.findIndex((w) => w.id === over.id);
      
      const newOrder = arrayMove(activeWallets, oldIndex, newIndex);
      await reorderWallets(newOrder.map(w => w.id));
    }
  }, [activeWallets, reorderWallets]);

  if (loading || cardsLoading) {
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

        {/* Main Tabs: Accounts vs Credit Cards */}
        <Tabs defaultValue="accounts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="accounts" className="flex items-center gap-1.5">
              <WalletIcon className="w-4 h-4" />
              {t('wallets.accounts', 'Contas')}
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              {t('creditCards.title', 'Cartões')}
            </TabsTrigger>
          </TabsList>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-4 mt-4">
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => setShowAddDialog(true)} 
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('wallets.addWallet')}
              </Button>
              <Button 
                onClick={() => handleOpenTransfer()} 
                variant="outline"
                className="w-full"
                disabled={activeWallets.length < 2}
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                {t('wallets.transfer')}
              </Button>
            </div>

            <Button 
              onClick={() => setShowScheduledDialog(true)} 
              variant="secondary"
              className="w-full"
              disabled={activeWallets.length < 2}
            >
              <Clock className="mr-2 h-4 w-4" />
              {t('wallets.scheduleTransfer')}
            </Button>

            {/* Scheduled Transfers */}
            <ScheduledTransfersCard />

            {/* Transfer History */}
            <TransferHistoryCard expanded />

            {/* Wallets Active/Inactive Tabs */}
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
                  <>
                    <p className="text-xs text-muted-foreground text-center">
                      {t('wallets.dragToReorder')}
                    </p>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={activeWallets.map(w => w.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {activeWallets.map(wallet => (
                          <SortableWalletCard
                            key={wallet.id}
                            wallet={wallet}
                            onEdit={setEditingWallet}
                            onToggleActive={handleToggleActive}
                            onTransfer={handleOpenTransfer}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </>
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
          </TabsContent>

          {/* Credit Cards Tab */}
          <TabsContent value="cards" className="space-y-4 mt-4">
            <Button 
              onClick={() => setShowAddCardDialog(true)} 
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('creditCards.addCard', 'Adicionar Cartão')}
            </Button>

            {creditCards.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {t('creditCards.noCards', 'Nenhum cartão cadastrado')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('creditCards.noCardsHint', 'Adicione seus cartões para controlar gastos e faturas.')}
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {creditCards.map(card => (
                  <CreditCardCard
                    key={card.id}
                    card={card}
                    wallets={wallets}
                    onEdit={setEditingCard}
                    onDelete={deleteCreditCard}
                  />
                ))}
              </div>
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

      <ScheduledTransferDialog
        open={showScheduledDialog}
        onOpenChange={setShowScheduledDialog}
      />

      <AddCreditCardDialog
        open={showAddCardDialog}
        onOpenChange={setShowAddCardDialog}
        onAdd={addCreditCard}
      />

      <EditCreditCardDialog
        open={!!editingCard}
        onOpenChange={(open) => !open && setEditingCard(null)}
        card={editingCard}
        onUpdate={updateCreditCard}
      />
    </AppLayout>
  );
};

export default WalletsPage;
