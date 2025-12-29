import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Category } from '@/types/database';

const EMOJI_OPTIONS = ['📦', '🍔', '🚗', '🎮', '🛍️', '📄', '💊', '📚', '💰', '💼', '📈', '🎁', '💵', '🏠', '✈️', '🎬', '🎵', '🏋️', '🐕', '💄', '☕', '🍺', '🎂', '📱', '💻'];

const COLOR_OPTIONS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', 
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16',
  '#06B6D4', '#A855F7', '#6B7280'
];

interface EditCategoryDialogProps {
  category: Category | null;
  onClose: () => void;
  onSave: (updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>) => Promise<void>;
}

export const EditCategoryDialog = ({ category, onClose, onSave }: EditCategoryDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#8B5CF6');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon);
      setColor(category.color);
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await onSave({ name: name.trim(), icon, color });
    setLoading(false);
  };

  return (
    <Dialog open={!!category} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t('categories.editCategory')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">{t('categories.categoryName')}</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('categories.categoryName')}
              required
              className="min-h-[48px]"
            />
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
              onClick={onClose}
              className="min-h-[48px]"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="min-h-[48px] bg-gradient-hero hover:opacity-90"
            >
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
