import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddTransactionDialog } from './AddTransactionDialog';
import { useTransactions } from '@/hooks/useTransactions';

export function FloatingAddButton() {
  const [open, setOpen] = useState(false);
  const { addTransaction } = useTransactions();

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-40 right-4 z-50 h-14 w-14 rounded-full bg-primary shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all active:scale-95"
        size="icon"
        aria-label="Nova transação"
      >
        <Plus className="h-7 w-7" />
      </Button>

      <AddTransactionDialog
        onAdd={addTransaction}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
