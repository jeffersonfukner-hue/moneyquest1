import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wallet, WalletFormData, WalletType } from '@/types/wallet';
import { SupportedCurrency } from '@/types/database';
import { useWallets } from '@/hooks/useWallets';
import { allInstitutions, walletTypeIcons, walletTypeColors } from '@/lib/institutionsList';

interface EditWalletDialogProps {
  wallet: Wallet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditWalletDialog = ({ wallet, open, onOpenChange }: EditWalletDialogProps) => {
  const { t } = useTranslation();
  const { updateWallet } = useWallets();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<WalletFormData>({
    name: '',
    institution: '',
    type: 'checking',
    currency: 'BRL',
    initial_balance: 0,
    icon: '🏦',
    color: '#3B82F6',
  });

  useEffect(() => {
    if (wallet) {
      setFormData({
        name: wallet.name,
        institution: wallet.institution || '',
        type: wallet.type,
        currency: wallet.currency,
        initial_balance: wallet.initial_balance,
        icon: wallet.icon,
        color: wallet.color,
      });
    }
  }, [wallet]);

  const handleTypeChange = (type: WalletType) => {
    setFormData(prev => ({
      ...prev,
      type,
      icon: walletTypeIcons[type] || '🏦',
      color: walletTypeColors[type] || '#8B5CF6',
    }));
  };

  const handleInstitutionChange = (institution: string) => {
    const inst = allInstitutions.find(i => i.name === institution);
    setFormData(prev => ({
      ...prev,
      institution,
      icon: inst?.icon || walletTypeIcons[prev.type] || '🏦',
    }));
  };

  const handleSubmit = async () => {
    if (!wallet || !formData.name.trim()) return;

    setIsSubmitting(true);
    const success = await updateWallet(wallet.id, formData);
    setIsSubmitting(false);

    if (success) {
      onOpenChange(false);
    }
  };

  const walletTypes: WalletType[] = ['checking', 'savings', 'credit', 'investment', 'cash', 'other'];
  const currencies: SupportedCurrency[] = ['BRL', 'USD', 'EUR'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('wallets.editWallet')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-wallet-name">{t('wallets.name')}</Label>
            <Input
              id="edit-wallet-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('wallets.namePlaceholder')}
            />
          </div>

          {/* Institution */}
          <div className="space-y-2">
            <Label>{t('wallets.institution')}</Label>
            <Select
              value={formData.institution}
              onValueChange={handleInstitutionChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('wallets.selectInstitution')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('wallets.brazilianBanks')}</SelectLabel>
                  {allInstitutions.filter(i => i.country === 'BR').map(inst => (
                    <SelectItem key={inst.name} value={inst.name}>
                      <span className="flex items-center gap-2">
                        <span>{inst.icon}</span>
                        <span>{inst.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>{t('wallets.internationalBanks')}</SelectLabel>
                  {allInstitutions.filter(i => i.country !== 'BR').map(inst => (
                    <SelectItem key={inst.name} value={inst.name}>
                      <span className="flex items-center gap-2">
                        <span>{inst.icon}</span>
                        <span>{inst.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>{t('wallets.type')}</Label>
            <Select value={formData.type} onValueChange={(v) => handleTypeChange(v as WalletType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {walletTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      <span>{walletTypeIcons[type]}</span>
                      <span>{t(`wallets.types.${type}`)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Currency (read-only after creation to prevent balance issues) */}
          <div className="space-y-2">
            <Label>{t('wallets.currency')}</Label>
            <Select
              value={formData.currency}
              onValueChange={(v) => setFormData(prev => ({ ...prev, currency: v as SupportedCurrency }))}
              disabled
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(currency => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t('wallets.currencyCannotChange')}</p>
          </div>

          {/* Initial Balance */}
          <div className="space-y-2">
            <Label htmlFor="edit-initial-balance">{t('wallets.initialBalance')}</Label>
            <Input
              id="edit-initial-balance"
              type="text"
              inputMode="decimal"
              value={formData.initial_balance || ''}
              onChange={(e) => {
                const val = e.target.value.replace(',', '.');
                if (val === '' || /^-?\d*\.?\d{0,2}$/.test(val)) {
                  setFormData(prev => ({ 
                    ...prev, 
                    initial_balance: val === '' ? 0 : parseFloat(val) || 0 
                  }));
                }
              }}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !formData.name.trim()}>
            {isSubmitting ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
