import { useState } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CATEGORIES } from '@/lib/gameLogic';
import { TransactionType } from '@/types/database';

interface AddTransactionDialogProps {
  onAdd: (transaction: {
    description: string;
    amount: number;
    category: string;
    type: TransactionType;
    date: string;
  }) => Promise<{ error: Error | null }>;
}

export const AddTransactionDialog = ({ onAdd }: AddTransactionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category) return;

    setLoading(true);
    const { error } = await onAdd({
      description,
      amount: parseFloat(amount),
      category,
      type,
      date: new Date().toISOString().split('T')[0],
    });

    if (!error) {
      setDescription('');
      setAmount('');
      setCategory('');
      setOpen(false);
    }
    setLoading(false);
  };

  const categories = type === 'INCOME' ? CATEGORIES.INCOME : CATEGORIES.EXPENSE;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-hero hover:opacity-90 transition-all hover:scale-105"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add Transaction</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'INCOME' ? 'default' : 'outline'}
              className={`flex-1 ${type === 'INCOME' ? 'bg-income hover:bg-income/90' : ''}`}
              onClick={() => {
                setType('INCOME');
                setCategory('');
              }}
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Income
            </Button>
            <Button
              type="button"
              variant={type === 'EXPENSE' ? 'default' : 'outline'}
              className={`flex-1 ${type === 'EXPENSE' ? 'bg-expense hover:bg-expense/90' : ''}`}
              onClick={() => {
                setType('EXPENSE');
                setCategory('');
              }}
            >
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              Expense
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-hero hover:opacity-90"
            disabled={loading || !description || !amount || !category}
          >
            {loading ? 'Adding...' : 'Add Transaction & Earn XP 🎮'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
