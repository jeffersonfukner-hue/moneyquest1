import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Banknote, X } from 'lucide-react';
import { useWallets } from '@/hooks/useWallets';
import { useProfile } from '@/hooks/useProfile';

interface CashWalletSuggestionBannerProps {
  onWalletCreated?: () => void;
}

const DISMISSED_KEY = 'mq.cash-wallet-suggestion-dismissed';

export const CashWalletSuggestionBanner = ({ onWalletCreated }: CashWalletSuggestionBannerProps) => {
  const { t } = useTranslation();
  const { activeWallets, addWallet } = useWallets();
  const { profile } = useProfile();
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isCreating, setIsCreating] = useState(false);

  // Check if user already has a cash wallet
  const hasCashWallet = activeWallets.some(w => w.type === 'cash');

  // Don't show if already has cash wallet or dismissed
  if (hasCashWallet || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {}
  };

  const handleCreateCashWallet = async () => {
    setIsCreating(true);
    const wallet = await addWallet({
      name: t('wallets.cashWalletName', 'Dinheiro'),
      institution: '',
      type: 'cash',
      currency: profile?.currency || 'BRL',
      initial_balance: 0,
      icon: '💵',
      color: '#F59E0B',
    });
    setIsCreating(false);
    
    if (wallet) {
      handleDismiss();
      onWalletCreated?.();
    }
  };

  return (
    <Card className="bg-amber-500/10 border-amber-500/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-amber-500/20">
            <Banknote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm mb-1">
              {t('wallets.cashSuggestion.title', 'Ativar carteira Dinheiro?')}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {t('wallets.cashSuggestion.description', 'Registre gastos e recebimentos em espécie com saldo próprio.')}
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleCreateCashWallet}
                disabled={isCreating}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isCreating ? t('common.creating', 'Criando...') : t('wallets.cashSuggestion.activate', 'Ativar')}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDismiss}
              >
                {t('common.later', 'Depois')}
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
