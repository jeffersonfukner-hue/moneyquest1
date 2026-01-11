import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, Clock, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { useTrialStatus, TrialPhase } from '@/hooks/useTrialStatus';
import { cn } from '@/lib/utils';

export const TrialBanner = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { 
    isInTrial, 
    daysRemaining, 
    hoursRemaining, 
    progressPercentage, 
    phase,
    hasPaidSubscription,
    hasUsedTrial 
  } = useTrialStatus();

  // Don't show banner if:
  // - User has paid subscription
  // - User is not in trial
  // - User already used trial and it expired
  // - Trial has more than 3 days remaining (only show in warning/critical phase)
  if (hasPaidSubscription || !isInTrial) {
    return null;
  }

  // Only show trial banner in warning or critical phase (last 3 days)
  // This prevents annoying users at the start of their trial
  if (phase === 'normal') {
    return null;
  }

  const getPhaseStyles = (phase: TrialPhase) => {
    switch (phase) {
      case 'critical':
        return {
          bgClass: 'bg-destructive/10 border-destructive/30',
          iconBgClass: 'bg-destructive/20',
          iconClass: 'text-destructive',
          progressClass: '[&>div]:bg-destructive',
          Icon: AlertTriangle,
        };
      case 'warning':
        return {
          bgClass: 'bg-amber-500/10 border-amber-500/30',
          iconBgClass: 'bg-amber-500/20',
          iconClass: 'text-amber-500',
          progressClass: '[&>div]:bg-amber-500',
          Icon: Clock,
        };
      default:
        return {
          bgClass: 'bg-accent/10 border-accent/30',
          iconBgClass: 'bg-accent/20',
          iconClass: 'text-accent',
          progressClass: '[&>div]:bg-accent',
          Icon: Crown,
        };
    }
  };

  const getMessage = () => {
    if (phase === 'critical') {
      return t('trial.criticalMessage', { hours: hoursRemaining });
    }
    if (phase === 'warning') {
      return t('trial.warningMessage', { days: daysRemaining });
    }
    return t('trial.normalMessage', { days: daysRemaining });
  };

  const styles = getPhaseStyles(phase);
  const { Icon } = styles;

  return (
    <Card className={cn(
      'p-4 border-2 transition-all duration-300',
      styles.bgClass
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          styles.iconBgClass
        )}>
          <Icon className={cn('w-5 h-5', styles.iconClass)} />
        </div>
        
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              phase === 'critical' ? 'bg-destructive/20 text-destructive' :
              phase === 'warning' ? 'bg-amber-500/20 text-amber-600' :
              'bg-accent/20 text-accent'
            )}>
              {t('trial.bannerTitle')}
            </span>
          </div>
          
          <p className="text-sm text-foreground leading-relaxed">
            {getMessage()}
          </p>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <Progress 
              value={progressPercentage} 
              className={cn('h-2', styles.progressClass)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('trial.progressStart')}</span>
              <span>
                {phase === 'critical' 
                  ? t('trial.hoursLeft', { hours: hoursRemaining })
                  : t('trial.daysLeft', { days: daysRemaining })
                }
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <Button 
            onClick={() => navigate('/premium')}
            className={cn(
              'w-full gap-2 font-semibold',
              phase === 'critical' ? 'bg-destructive hover:bg-destructive/90' :
              phase === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white' :
              'bg-accent hover:bg-accent/90'
            )}
            size="sm"
          >
            <Zap className="w-4 h-4" />
            {t('trial.ctaButton')}
          </Button>
        </div>
      </div>
    </Card>
  );
};
