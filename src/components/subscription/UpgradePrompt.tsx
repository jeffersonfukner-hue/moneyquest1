import { useTranslation } from 'react-i18next';
import { Crown, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface UpgradePromptProps {
  feature?: string;
  context?: 'inline' | 'modal' | 'banner';
  onDismiss?: () => void;
  className?: string;
}

export const UpgradePrompt = ({ 
  feature, 
  context = 'inline', 
  onDismiss,
  className 
}: UpgradePromptProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/upgrade');
  };

  if (context === 'banner') {
    return (
      <div className={cn(
        'relative bg-gradient-to-r from-amber-400/20 via-amber-500/20 to-amber-400/20',
        'border border-amber-400/30 rounded-xl p-3',
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4 text-amber-950" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {t('subscription.unlockPremium')}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {feature ? t(`subscription.features.${feature}`) : t('subscription.unlockAllFeatures')}
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 hover:from-amber-500 hover:to-amber-600 shrink-0"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            {t('subscription.upgrade')}
          </Button>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-amber-500/20 transition-colors"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>
    );
  }

  if (context === 'modal') {
    return (
      <Card className={cn('border-amber-400/30 bg-gradient-to-br from-card to-amber-500/5', className)}>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-amber-950" />
          </div>
          <h3 className="font-display text-xl font-bold text-foreground mb-2">
            {t('subscription.goPremium')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {feature 
              ? t('subscription.featureRequiresPremium', { feature: t(`subscription.features.${feature}`) })
              : t('subscription.premiumDescription')
            }
          </p>
          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 hover:from-amber-500 hover:to-amber-600"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {t('subscription.viewPlans')}
          </Button>
          {onDismiss && (
            <Button variant="ghost" onClick={onDismiss} className="w-full mt-2">
              {t('common.cancel')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Inline context (default)
  return (
    <div className={cn(
      'flex items-center gap-2 p-2 rounded-lg',
      'bg-amber-400/10 border border-amber-400/20',
      className
    )}>
      <Crown className="w-4 h-4 text-amber-500 shrink-0" />
      <span className="text-xs text-muted-foreground flex-1">
        {t('subscription.premiumFeature')}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleUpgrade}
        className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 h-7 px-2 text-xs"
      >
        {t('subscription.upgrade')}
      </Button>
    </div>
  );
};
