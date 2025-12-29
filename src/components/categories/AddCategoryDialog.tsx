import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TransactionType } from '@/types/database';

const EMOJI_OPTIONS = ['📦', '🍔', '🚗', '🎮', '🛍️', '📄', '💊', '📚', '💰', '💼', '📈', '🎁', '💵', '🏠', '✈️', '🎬', '🎵', '🏋️', '🐕', '💄', '☕', '🍺', '🎂', '📱', '💻'];

const COLOR_OPTIONS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', 
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16',
  '#06B6D4', '#A855F7', '#6B7280'
];

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, type: TransactionType, icon: string, color: string) => Promise<void>;
  defaultType?: TransactionType;
}

export const AddCategoryDialog = ({ open, onOpenChange, onAdd, defaultType = 'EXPENSE' }: AddCategoryDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>(defaultType);
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#8B5CF6');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await onAdd(name.trim(), type, icon, color);
    setLoading(false);
    
    // Reset form
    setName('');
    setIcon('📦');
    setColor('#8B5CF6');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName('');
      setIcon('📦');
      setColor('#8B5CF6');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t('categories.addCategory')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('categories.categoryName')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('categories.categoryName')}
              required
              className="min-h-[48px]"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('transactions.type')}</Label>
            <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
              <SelectTrigger className="min-h-[48px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">{t('transactions.expense')}</SelectItem>
                <SelectItem value="INCOME">{t('transactions.income')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('categories.selectIcon')}</Label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-lg max-h-32 overflow-y-auto">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                    icon === emoji 
                      ? 'bg-primary/20 ring-2 ring-primary' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setIcon(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('categories.selectColor')}</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="min-h-[48px]"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="min-h-[48px] bg-gradient-hero hover:opacity-90"
            >
              {loading ? t('common.loading') : t('common.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
