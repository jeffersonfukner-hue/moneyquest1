import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Crown } from 'lucide-react';
import type { AdminUser } from '@/types/admin';

// Labels fixos em pt-BR para SuperAdmin
const LABELS = {
  title: 'Conceder Premium',
  description: 'Conceder acesso Premium para',
  lifetime: 'Vitalício',
  temporary: 'Por período',
  days: 'Dias de Premium',
  note: 'Observação',
  notePlaceholder: 'Adicione uma observação opcional...',
  confirm: 'Confirmar',
  cancel: 'Cancelar',
};

interface PremiumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onConfirm: (userId: string, expiresAt: string | null, note: string) => void;
}

export const PremiumDialog = ({ open, onOpenChange, user, onConfirm }: PremiumDialogProps) => {
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
            {LABELS.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            {LABELS.description} {user?.display_name || user?.email}
          </p>

          <RadioGroup value={type} onValueChange={(v) => setType(v as 'lifetime' | 'period')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="lifetime" id="lifetime" />
              <Label htmlFor="lifetime">{LABELS.lifetime}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="period" id="period" />
              <Label htmlFor="period">{LABELS.temporary}</Label>
            </div>
          </RadioGroup>

          {type === 'period' && (
            <div className="space-y-2">
              <Label>{LABELS.days}</Label>
              <Input 
                type="number" 
                value={days} 
                onChange={(e) => setDays(e.target.value)}
                min="1"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{LABELS.note}</Label>
            <Textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)}
              placeholder={LABELS.notePlaceholder}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {LABELS.cancel}
          </Button>
          <Button onClick={handleConfirm}>
            {LABELS.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
