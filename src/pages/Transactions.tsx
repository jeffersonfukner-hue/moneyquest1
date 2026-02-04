import { useTranslation } from 'react-i18next';
import { AppShell } from '@/components/layout/AppShell';
import { TransactionsList } from '@/components/game/TransactionsList';
import { TransactionSelectionProvider } from '@/contexts/TransactionSelectionContext';
import { useTransactions } from '@/hooks/useTransactions';
import { Wallet } from 'lucide-react';
import { Transaction } from '@/types/database';

const Transactions = () => {
  const { t } = useTranslation();
  const { 
    transactions, 
    updateTransaction, 
    deleteTransaction, 
    batchUpdateWallet, 
    batchDeleteTransactions,
    addTransaction,
  } = useTransactions();

  // Handle duplicate transaction
  const handleDuplicateTransaction = (transaction: Transaction) => {
    const duplicateData = {
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      amount: transaction.amount,
      currency: transaction.currency,
      date: new Date().toISOString().split('T')[0], // Today's date
      wallet_id: transaction.wallet_id,
      supplier: transaction.supplier,
      credit_card_id: transaction.credit_card_id,
    };
    
    addTransaction(duplicateData as any);
  };

  // Loading state
  if (!transactions) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto py-4 md:py-6 px-4 md:px-6 max-w-7xl">
        <TransactionSelectionProvider>
          <TransactionsList 
            transactions={transactions} 
            onDelete={deleteTransaction} 
            onUpdate={updateTransaction} 
            onBatchUpdateWallet={batchUpdateWallet} 
            onBatchDelete={batchDeleteTransactions} 
            onDuplicate={handleDuplicateTransaction} 
          />
        </TransactionSelectionProvider>
      </div>
    </AppShell>
  );
};

export default Transactions;
