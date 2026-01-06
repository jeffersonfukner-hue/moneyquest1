import { useState } from 'react';
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

interface AddWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletCreated?: (wallet: Wallet) => void;
}

export const AddWalletDialog = ({ open, onOpenChange, onWalletCreated }: AddWalletDialogProps) => {
  const { t } = useTranslation();
  const { addWallet } = useWallets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomInstitution, setShowCustomInstitution] = useState(false);

  const [formData, setFormData] = useState<WalletFormData>({
    name: '',
    institution: '',
    type: 'checking',
    currency: 'BRL',
    initial_balance: 0,
    icon: '🏦',
    color: '#3B82F6',
  });

  const handleTypeChange = (type: WalletType) => {
    setFormData(prev => ({
      ...prev,
      type,
      icon: walletTypeIcons[type] || '🏦',
      color: walletTypeColors[type] || '#8B5CF6',
    }));
  };

  const handleInstitutionChange = (institution: string) => {
    if (institution === '__custom__') {
      setShowCustomInstitution(true);
      setFormData(prev => ({
        ...prev,
        institution: '',
        icon: walletTypeIcons[prev.type] || '🏦',
      }));
      return;
    }
    setShowCustomInstitution(false);
    const inst = allInstitutions.find(i => i.name === institution);
    setFormData(prev => ({
      ...prev,
      institution,
      icon: inst?.icon || walletTypeIcons[prev.type] || '🏦',
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    const wallet = await addWallet(formData);
    setIsSubmitting(false);

    if (wallet) {
      onWalletCreated?.(wallet);
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      institution: '',
      type: 'checking',
      currency: 'BRL',
      initial_balance: 0,
      icon: '🏦',
      color: '#3B82F6',
    });
    setShowCustomInstitution(false);
  };

  const walletTypes: WalletType[] = ['checking', 'savings', 'credit', 'investment', 'cash', 'other'];
  const currencies: SupportedCurrency[] = ['BRL', 'USD', 'EUR'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('wallets.addWallet')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="wallet-name">{t('wallets.name')}</Label>
            <Input
              id="wallet-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('wallets.namePlaceholder')}
            />
          </div>

          {/* Institution */}
          <div className="space-y-2">
            <Label>{t('wallets.institution')}</Label>
            {showCustomInstitution ? (
              <div className="space-y-2">
                <Input
                  placeholder={t('wallets.customInstitutionPlaceholder', 'Digite o nome da instituição')}
                  value={formData.institution}
                  onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => {
                    setShowCustomInstitution(false);
                    setFormData(prev => ({ ...prev, institution: '' }));
                  }}
                >
                  {t('wallets.backToList', '← Voltar para lista')}
                </Button>
              </div>
            ) : (
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
                  <SelectGroup>
                    <SelectLabel>{t('wallets.other', 'Outras')}</SelectLabel>
                    <SelectItem value="__custom__">
                      <span className="flex items-center gap-2">
                        <span>➕</span>
                        <span>{t('wallets.addCustomInstitution', 'Adicionar outra instituição')}</span>
                      </span>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
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

          {/* Currency */}
          <div className="space-y-2">
            <Label>{t('wallets.currency')}</Label>
            <Select
              value={formData.currency}
              onValueChange={(v) => setFormData(prev => ({ ...prev, currency: v as SupportedCurrency }))}
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
          </div>

          {/* Initial Balance */}
          <div className="space-y-2">
            <Label htmlFor="initial-balance">{t('wallets.initialBalance')}</Label>
            <Input
              id="initial-balance"
              type="number"
              step="0.01"
              value={formData.initial_balance || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                initial_balance: parseFloat(e.target.value) || 0 
              }))}
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
