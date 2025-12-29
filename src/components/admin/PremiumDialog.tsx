import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Crown } from 'lucide-react';
import type { AdminUser } from '@/types/admin';

interface PremiumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onConfirm: (userId: string, expiresAt: string | null, note: string) => void;
}

export const PremiumDialog = ({ open, onOpenChange, user, onConfirm }: PremiumDialogProps) => {
  const { t } = useTranslation();
  const [type, setType] = useState<'lifetime' | 'period'>('lifetime');
  const [days, setDays] = useState('30');
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    if (!user) return;
    
    let expiresAt: string | null = null;
    if (type === 'period') {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(days));
      expiresAt = date.toISOString();
    }
    
    onConfirm(user.id, expiresAt, note);
    setNote('');
    setType('lifetime');
    setDays('30');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            {t('admin.premium.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            {t('admin.premium.description', { user: user?.display_name || user?.email })}
          </p>

          <RadioGroup value={type} onValueChange={(v) => setType(v as 'lifetime' | 'period')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="lifetime" id="lifetime" />
              <Label htmlFor="lifetime">{t('admin.premium.lifetime')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="period" id="period" />
              <Label htmlFor="period">{t('admin.premium.temporary')}</Label>
            </div>
          </RadioGroup>

          {type === 'period' && (
            <div className="space-y-2">
              <Label>{t('admin.premium.days')}</Label>
              <Input 
                type="number" 
                value={days} 
                onChange={(e) => setDays(e.target.value)}
                min="1"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('admin.note')}</Label>
            <Textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('admin.notePlaceholder')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm}>
            {t('admin.premium.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
