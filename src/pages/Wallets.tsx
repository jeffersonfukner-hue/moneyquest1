import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Wallet as WalletIcon, ArrowLeft, ArrowLeftRight, Clock, CreditCard, Landmark, ArrowDown, ArrowUp, Banknote } from 'lucide-react';
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
import { useLoans, Loan } from '@/hooks/useLoans';
import { useTransactions } from '@/hooks/useTransactions';
import { WalletCard } from '@/components/wallets/WalletCard';
import { SortableWalletCard } from '@/components/wallets/SortableWalletCard';
import { AddWalletDialog } from '@/components/wallets/AddWalletDialog';
import { EditWalletDialog } from '@/components/wallets/EditWalletDialog';
import { WalletBalancesWidget } from '@/components/wallets/WalletBalancesWidget';
import { TransferDialog } from '@/components/wallets/TransferDialog';
import { ScheduledTransferDialog } from '@/components/wallets/ScheduledTransferDialog';
import { TransferHistoryCard } from '@/components/wallets/TransferHistoryCard';
import { ScheduledTransfersCard } from '@/components/wallets/ScheduledTransfersCard';
import { CashWalletSuggestionBanner } from '@/components/wallets/CashWalletSuggestionBanner';
import { CashAdjustmentDialog } from '@/components/wallets/CashAdjustmentDialog';
import { CreditCardCard } from '@/components/creditCards/CreditCardCard';
import { AddCreditCardDialog } from '@/components/creditCards/AddCreditCardDialog';
import { EditCreditCardDialog } from '@/components/creditCards/EditCreditCardDialog';
import { CreditCardInvoicesPanel } from '@/components/creditCards/CreditCardInvoicesPanel';
import { LoanCard } from '@/components/loans/LoanCard';
import { AddLoanDialog } from '@/components/loans/AddLoanDialog';
import { LoanInstallmentsPanel } from '@/components/loans/LoanInstallmentsPanel';
import { LoanDetailsPanel } from '@/components/loans/LoanDetailsPanel';
import { LoanBudgetAlert } from '@/components/loans/LoanBudgetAlert';
import { Wallet } from '@/types/wallet';
import { AppShell } from '@/components/layout/AppShell';
import { TransferPreset } from '@/components/wallets/TransferQuickActions';

interface WalletsPageProps {
  defaultTab?: 'accounts' | 'cards' | 'loans' | 'transfers';
}

const WalletsPage = ({ defaultTab = 'accounts' }: WalletsPageProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeWallets, inactiveWallets, wallets, deleteWallet, reactivateWallet, reorderWallets, loading, refetch: refetchWallets } = useWallets();
  const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard, loading: cardsLoading } = useCreditCards();
  const { loans, activeLoans, paidLoans, addLoan, updateLoan, deleteLoan, payInstallment, prepayInstallments, payOffLoan, loading: loansLoading, totalSaldoDevedor, totalParcelasMensais } = useLoans();
  const { updateTransaction, deleteTransaction } = useTransactions();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [showAddLoanDialog, setShowAddLoanDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showScheduledDialog, setShowScheduledDialog] = useState(false);
  const [transferFromWallet, setTransferFromWallet] = useState<Wallet | undefined>();
  const [transferPreset, setTransferPreset] = useState<TransferPreset | undefined>();
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [viewingInvoicesCard, setViewingInvoicesCard] = useState<CreditCardType | null>(null);
  const [viewingInstallmentsLoan, setViewingInstallmentsLoan] = useState<Loan | null>(null);
  const [viewingDetailsLoan, setViewingDetailsLoan] = useState<Loan | null>(null);
  const [adjustingWallet, setAdjustingWallet] = useState<Wallet | null>(null);
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

  // Check if user has cash wallet
  const cashWallet = useMemo(() => activeWallets.find(w => w.type === 'cash'), [activeWallets]);
  const hasCashWallet = !!cashWallet;

  const handleOpenTransfer = (wallet?: Wallet, preset?: TransferPreset) => {
    setTransferFromWallet(wallet);
    setTransferPreset(preset);
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

  if (loading || cardsLoading || loansLoading) {
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
    <AppShell fullWidth>
      {/* Page Title */}
      <div className="mb-4">
        <h1 className="font-display font-bold text-xl text-foreground">{t('wallets.title')}</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Balances Overview */}
        <WalletBalancesWidget wallets={activeWallets} />

        {/* Main Tabs: Accounts, Cards, Loans, Transfers */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="accounts" className="flex items-center gap-1 text-xs px-1">
              <WalletIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Contas</span>
            </TabsTrigger>
            <TabsTrigger value="cards" className="flex items-center gap-1 text-xs px-1">
              <CreditCard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cartões</span>
            </TabsTrigger>
            <TabsTrigger value="loans" className="flex items-center gap-1 text-xs px-1">
              <Landmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Empréstimos</span>
            </TabsTrigger>
            <TabsTrigger value="transfers" className="flex items-center gap-1 text-xs px-1">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Transferências</span>
            </TabsTrigger>
          </TabsList>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-4 mt-4">
            {/* Cash wallet suggestion banner */}
            <CashWalletSuggestionBanner onWalletCreated={() => refetchWallets()} />

            {/* Action Button */}
            <Button 
              onClick={() => setShowAddDialog(true)} 
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('wallets.addWallet')}
            </Button>

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
                            onAdjust={wallet.type === 'cash' ? setAdjustingWallet : undefined}
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
            {viewingInvoicesCard ? (
              <CreditCardInvoicesPanel
                card={viewingInvoicesCard}
                wallets={wallets}
                onBack={() => {
                  setViewingInvoicesCard(null);
                  refetchWallets(); // Refresh wallet balances after potential payment
                }}
                onUpdateTransaction={updateTransaction}
                onDeleteTransaction={deleteTransaction}
              />
            ) : (
              <>
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
                        onViewInvoices={setViewingInvoicesCard}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Loans Tab */}
          <TabsContent value="loans" className="space-y-4 mt-4">
            <Button 
              type="button"
              onClick={() => {
                console.log('[Loans] Abrindo dialog de novo empréstimo');
                setShowAddLoanDialog(true);
              }} 
              className="w-full min-h-[48px]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Empréstimo
            </Button>

            {loans.length === 0 ? (
              <div className="text-center py-12">
                <Landmark className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Nenhum empréstimo cadastrado
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Registre seus empréstimos para acompanhar parcelas e saldo devedor.
                </p>
              </div>
            ) : (
              <>
                {/* Alerta de comprometimento de renda */}
                <LoanBudgetAlert />

                {/* Resumo dos empréstimos */}
                {activeLoans.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Saldo Devedor Total</p>
                      <p className="font-bold text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSaldoDevedor)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Parcelas/Mês</p>
                      <p className="font-bold text-orange-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalParcelasMensais)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tabs Ativos/Quitados */}
                <Tabs defaultValue="active" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">
                      Ativos ({activeLoans.length})
                    </TabsTrigger>
                    <TabsTrigger value="paid">
                      Quitados ({paidLoans.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="active" className="space-y-3 mt-4">
                    {activeLoans.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          Nenhum empréstimo ativo
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {activeLoans.map(loan => (
                          <LoanCard
                            key={loan.id}
                            loan={loan}
                            onEdit={setEditingLoan}
                            onDelete={deleteLoan}
                            onViewInstallments={setViewingInstallmentsLoan}
                            onViewDetails={setViewingDetailsLoan}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="paid" className="space-y-3 mt-4">
                    {paidLoans.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">
                          Nenhum empréstimo quitado ainda
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {paidLoans.map(loan => (
                          <LoanCard
                            key={loan.id}
                            loan={loan}
                            onEdit={setEditingLoan}
                            onDelete={deleteLoan}
                            onViewInstallments={setViewingInstallmentsLoan}
                            onViewDetails={setViewingDetailsLoan}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </TabsContent>

          {/* Transfers Tab */}
          <TabsContent value="transfers" className="space-y-4 mt-4">
            {/* Quick Cash Actions - Saque/Depósito */}
            {hasCashWallet && activeWallets.length >= 2 && (
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => handleOpenTransfer(undefined, 'withdrawal')} 
                  variant="outline"
                  className="w-full border-amber-500/30 hover:bg-amber-500/10"
                >
                  <ArrowDown className="mr-2 h-4 w-4 text-amber-600" />
                  {t('wallets.presets.withdrawal', 'Saque')}
                </Button>
                <Button 
                  onClick={() => handleOpenTransfer(undefined, 'deposit')} 
                  variant="outline"
                  className="w-full border-green-500/30 hover:bg-green-500/10"
                >
                  <ArrowUp className="mr-2 h-4 w-4 text-green-600" />
                  {t('wallets.presets.deposit', 'Depósito')}
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => handleOpenTransfer()} 
                className="w-full"
                disabled={activeWallets.length < 2}
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                {t('wallets.transfer')}
              </Button>
              <Button 
                onClick={() => setShowScheduledDialog(true)} 
                variant="outline"
                className="w-full"
                disabled={activeWallets.length < 2}
              >
                <Clock className="mr-2 h-4 w-4" />
                {t('wallets.scheduleTransfer')}
              </Button>
            </div>

            {activeWallets.length < 2 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                {t('wallets.needTwoWallets', 'Você precisa de pelo menos 2 contas para fazer transferências.')}
              </div>
            )}

            {/* Scheduled Transfers */}
            <ScheduledTransfersCard />

            {/* Transfer History */}
            <TransferHistoryCard expanded />
          </TabsContent>
        </Tabs>
      </div>

      <AddWalletDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onWalletCreated={() => {
          refetchWallets();
        }}
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
        initialPreset={transferPreset}
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

      <AddLoanDialog
        open={showAddLoanDialog}
        onOpenChange={setShowAddLoanDialog}
        onAdd={addLoan}
      />

      {viewingInstallmentsLoan && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <LoanInstallmentsPanel
              loan={viewingInstallmentsLoan}
              onPayInstallment={payInstallment}
              onClose={() => setViewingInstallmentsLoan(null)}
            />
          </div>
        </div>
      )}

      {viewingDetailsLoan && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <LoanDetailsPanel
              loan={viewingDetailsLoan}
              onBack={() => setViewingDetailsLoan(null)}
              onPayInstallment={payInstallment}
              onPrepay={prepayInstallments}
              onPayOff={payOffLoan}
            />
          </div>
        </div>
      )}

      {/* Cash Adjustment Dialog */}
      {adjustingWallet && (
        <CashAdjustmentDialog
          open={!!adjustingWallet}
          onOpenChange={(open) => !open && setAdjustingWallet(null)}
          wallet={adjustingWallet}
        />
      )}
    </AppShell>
  );
};

export default WalletsPage;
