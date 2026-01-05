import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateCreditCardData } from '@/hooks/useCreditCards';
import { useWallets } from '@/hooks/useWallets';
import { useCurrency } from '@/contexts/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '@/i18n';
import { SupportedCurrency } from '@/types/database';

interface AddCreditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: CreateCreditCardData) => Promise<any>;
}

const BANKS = [
  'Nubank', 'Itaú', 'Bradesco', 'Santander', 'Banco do Brasil', 
  'Caixa', 'Inter', 'C6 Bank', 'BTG Pactual', 'XP', 'Sicredi',
  'Sicoob', 'PicPay', 'Mercado Pago', 'Next', 'Neon', 'Original',
  'Pan', 'Safra', 'Outro'
];

export const AddCreditCardDialog = ({ open, onOpenChange, onAdd }: AddCreditCardDialogProps) => {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const { activeWallets } = useWallets();
  
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [totalLimit, setTotalLimit] = useState('');
  const [billingCloseDay, setBillingCloseDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [linkedWalletId, setLinkedWalletId] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setBank('');
    setTotalLimit('');
    setBillingCloseDay('');
    setDueDay('');
    setLinkedWalletId('');
    setSelectedCurrency(currency);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !bank || !totalLimit || !billingCloseDay || !dueDay) return;

    setLoading(true);
    
    const result = await onAdd({
      name: name.trim(),
      bank,
      total_limit: parseFloat(totalLimit),
      billing_close_day: parseInt(billingCloseDay),
      due_day: parseInt(dueDay),
      linked_wallet_id: linkedWalletId || null,
      currency: selectedCurrency,
    });

    setLoading(false);

    if (result) {
      resetForm();
      onOpenChange(false);
    }
  };

  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {t('creditCards.addTitle', 'Adicionar Cartão de Crédito')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Name */}
          <div className="space-y-2">
            <Label htmlFor="cardName">{t('creditCards.name', 'Nome do Cartão')}</Label>
            <Input
              id="cardName"
              placeholder={t('creditCards.namePlaceholder', 'Ex: Nubank Platinum')}
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
                <SelectValue placeholder={t('creditCards.selectBank', 'Selecione o banco')} />
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
            <div className="flex gap-2">
              <Select value={selectedCurrency} onValueChange={(v) => setSelectedCurrency(v as SupportedCurrency)}>
                <SelectTrigger className="w-24 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPORTED_CURRENCIES).map(([code, config]) => (
                    <SelectItem key={code} value={code}>
                      {config.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={totalLimit}
                onChange={(e) => setTotalLimit(e.target.value)}
                className="flex-1 min-h-[44px]"
              />
            </div>
          </div>

          {/* Billing Days */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('creditCards.closingDay', 'Dia de Fechamento')}</Label>
              <Select value={billingCloseDay} onValueChange={setBillingCloseDay}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder={t('creditCards.day', 'Dia')} />
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
                  <SelectValue placeholder={t('creditCards.day', 'Dia')} />
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
                <SelectValue placeholder={t('creditCards.selectWallet', 'Selecione uma conta (opcional)')} />
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
            <p className="text-xs text-muted-foreground">
              {t('creditCards.linkedWalletHint', 'O pagamento da fatura será debitado desta conta.')}
            </p>
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
              {loading ? t('common.loading', 'Carregando...') : t('common.add', 'Adicionar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
