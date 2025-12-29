import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TransactionType } from '@/types/database';

const QUICK_EMOJIS = ['📦', '🍔', '🚗', '🎮', '🛍️', '💰', '💼', '📈', '🎁', '💵'];
const QUICK_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

interface QuickAddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, icon: string, color: string) => Promise<void>;
  type: TransactionType;
}

export const QuickAddCategoryDialog = ({ open, onOpenChange, onAdd, type }: QuickAddCategoryDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#8B5CF6');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await onAdd(name.trim(), icon, color);
    setLoading(false);
    
    // Reset form
    setName('');
    setIcon('📦');
    setColor('#8B5CF6');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{t('categories.newCategory')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="quick-name">{t('categories.categoryName')}</Label>
            <Input
              id="quick-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('categories.categoryName')}
              required
              autoFocus
              className="min-h-[44px]"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-xs">{t('categories.selectIcon')}</Label>
              <div className="flex flex-wrap gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-all ${
                      icon === emoji 
                        ? 'bg-primary/20 ring-1 ring-primary' 
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
              <Label className="text-xs">{t('categories.selectColor')}</Label>
              <div className="flex flex-wrap gap-1 max-w-[80px]">
                {QUICK_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-6 h-6 rounded-full transition-all ${
                      color === c ? 'ring-2 ring-offset-1 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !name.trim()}
              className="bg-gradient-hero hover:opacity-90"
            >
              {loading ? t('common.loading') : t('common.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
