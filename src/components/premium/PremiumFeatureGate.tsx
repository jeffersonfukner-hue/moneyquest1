import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Lock, Crown, Sparkles, CheckCircle2, Scan, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface PremiumFeatureGateProps {
  feature: 'item_breakdown' | 'receipt_ocr';
  children: ReactNode;
  onUnlocked?: () => void;
}

const FEATURE_CONFIG = {
  item_breakdown: {
    icon: List,
    titleKey: 'premium.itemBreakdown.title',
    descKey: 'premium.itemBreakdown.description',
  },
  receipt_ocr: {
    icon: Scan,
    titleKey: 'premium.receiptOcr.title',
    descKey: 'premium.receiptOcr.description',
  },
};

export const PremiumFeatureGate = ({ 
  feature, 
  children, 
  onUnlocked 
}: PremiumFeatureGateProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = useSubscription();

  const trackAttempt = async () => {
    if (user) {
      await supabase.from('ab_test_events').insert({
        user_id: user.id,
        test_name: 'premium_features',
        variant: feature,
        event_type: 'premium_feature_attempt',
        metadata: { feature, blocked: !isPremium }
      });
    }
  };

  const handleClick = async () => {
    await trackAttempt();
    if (isPremium) {
      onUnlocked?.();
    }
  };

  if (isPremium) {
    return <div onClick={handleClick}>{children}</div>;
  }

  // For free users, show locked state
  const config = FEATURE_CONFIG[feature];
  const Icon = config.icon;

  return (
    <div 
      className="relative cursor-pointer group"
      onClick={handleClick}
    >
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px] rounded-lg">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-full border border-amber-500/30">
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-medium text-amber-600">Premium</span>
        </div>
      </div>
    </div>
  );
};

// Premium upsell modal with compelling copy
interface PremiumUpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: 'item_breakdown' | 'receipt_ocr';
}

export const PremiumUpsellModal = ({ 
  open, 
  onOpenChange, 
  feature 
}: PremiumUpsellModalProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleUpgrade = async () => {
    // Track conversion intent
    if (user) {
      await supabase.from('ab_test_events').insert({
        user_id: user.id,
        test_name: 'premium_features',
        variant: feature,
        event_type: 'upgrade_click_from_feature',
        metadata: { feature }
      });
    }
    onOpenChange(false);
    navigate('/premium');
  };

  const benefits = [
    { icon: List, text: t('premium.benefits.itemBreakdown', 'Detalhamento por item') },
    { icon: Scan, text: t('premium.benefits.receiptOcr', 'Leitura automática de cupons') },
    { icon: Sparkles, text: t('premium.benefits.advancedInsights', 'Insights avançados') },
    { icon: Crown, text: t('premium.benefits.bonusXp', 'XP bônus em todas as ações') },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-xl">
            {t('premium.upsell.title', 'Veja onde seu dinheiro realmente vai')}
          </DialogTitle>
          <DialogDescription className="text-sm pt-2">
            {t('premium.upsell.subtitle', 'Premium mostra ONDE você gasta, não só QUANTO. Pare de adivinhar — veja item por item.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <benefit.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm">{benefit.text}</span>
              <CheckCircle2 className="w-4 h-4 text-income ml-auto shrink-0" />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold"
          >
            <Crown className="w-4 h-4 mr-2" />
            {t('premium.upsell.cta', 'Quero ser Premium')}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground"
          >
            {t('common.later', 'Agora não')}
          </Button>
        </div>

        <p className="text-[10px] text-center text-muted-foreground">
          {t('premium.upsell.tagline', 'Transforme notas fiscais em controle financeiro inteligente.')}
        </p>
      </DialogContent>
    </Dialog>
  );
};
