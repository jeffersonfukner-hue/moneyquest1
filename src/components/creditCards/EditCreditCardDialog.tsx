import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CreditCard as CreditCardType, UpdateCreditCardData } from '@/hooks/useCreditCards';
import { useWallets } from '@/hooks/useWallets';

interface EditCreditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: CreditCardType | null;
  onUpdate: (id: string, data: UpdateCreditCardData) => Promise<boolean>;
}

const BANKS = [
  'Nubank', 'Itaú', 'Bradesco', 'Santander', 'Banco do Brasil', 
  'Caixa', 'Inter', 'C6 Bank', 'BTG Pactual', 'XP', 'Sicredi',
  'Sicoob', 'PicPay', 'Mercado Pago', 'Next', 'Neon', 'Original',
  'Pan', 'Safra', 'Outro'
];

export const EditCreditCardDialog = ({ open, onOpenChange, card, onUpdate }: EditCreditCardDialogProps) => {
  const { t } = useTranslation();
  const { activeWallets } = useWallets();
  
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [totalLimit, setTotalLimit] = useState('');
  const [billingCloseDay, setBillingCloseDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [linkedWalletId, setLinkedWalletId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (card) {
      setName(card.name);
      setBank(card.bank);
      setTotalLimit(card.total_limit.toString());
      setBillingCloseDay(card.billing_close_day.toString());
      setDueDay(card.due_day.toString());
      setLinkedWalletId(card.linked_wallet_id || 'none');
      setIsActive(card.is_active);
    }
  }, [card]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;
    
    if (!name.trim() || !bank || !totalLimit || !billingCloseDay || !dueDay) return;

    setLoading(true);
    
    const success = await onUpdate(card.id, {
      name: name.trim(),
      bank,
      total_limit: parseFloat(totalLimit),
      billing_close_day: parseInt(billingCloseDay),
      due_day: parseInt(dueDay),
      linked_wallet_id: linkedWalletId === 'none' ? null : linkedWalletId,
      is_active: isActive,
    });

    setLoading(false);

    if (success) {
      onOpenChange(false);
    }
  };

  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {t('creditCards.editTitle', 'Editar Cartão')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Name */}
          <div className="space-y-2">
            <Label htmlFor="cardName">{t('creditCards.name', 'Nome do Cartão')}</Label>
            <Input
              id="cardName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-[44px]"
            />
          </div>

          {/* Bank */}
          <div className="space-y-2">
            <Label>{t('creditCards.bank', 'Banco/Emissor')}</Label>
            <Select value={bank} onValueChange={setBank}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BANKS.map(b => (
                  <SelectItem key={b} value={b} className="min-h-[44px]">
                    <span className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {b}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Limit */}
          <div className="space-y-2">
            <Label>{t('creditCards.limit', 'Limite Total')}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={totalLimit}
              onChange={(e) => setTotalLimit(e.target.value)}
              className="min-h-[44px]"
            />
          </div>

          {/* Billing Days */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('creditCards.closingDay', 'Dia de Fechamento')}</Label>
              <Select value={billingCloseDay} onValueChange={setBillingCloseDay}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map(day => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('creditCards.dueDay', 'Dia de Vencimento')}</Label>
              <Select value={dueDay} onValueChange={setDueDay}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map(day => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linked Wallet */}
          <div className="space-y-2">
            <Label>{t('creditCards.linkedWallet', 'Conta para Pagamento')}</Label>
            <Select value={linkedWalletId} onValueChange={setLinkedWalletId}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('creditCards.noLink', 'Não vincular')}</SelectItem>
                {activeWallets.map(wallet => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    <span className="flex items-center gap-2">
                      <span>{wallet.icon}</span>
                      {wallet.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="active-toggle">{t('creditCards.active', 'Cartão ativo')}</Label>
            <Switch
              id="active-toggle"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button 
              type="submit" 
              variant="gold"
              disabled={loading || !name.trim() || !bank || !totalLimit || !billingCloseDay || !dueDay}
            >
              {loading ? t('common.loading', 'Carregando...') : t('common.save', 'Salvar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
