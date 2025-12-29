import { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { UpgradePrompt } from './UpgradePrompt';
import { cn } from '@/lib/utils';

interface LockedFeatureProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showLockOverlay?: boolean;
  className?: string;
}

export const LockedFeature = ({ 
  feature, 
  children, 
  fallback,
  showLockOverlay = true,
  className 
}: LockedFeatureProps) => {
  const { checkFeature, isPremium } = useSubscription();

  const hasAccess = checkFeature(feature) || isPremium;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showLockOverlay) {
    return (
      <div className={cn('relative', className)}>
        <div className="pointer-events-none opacity-40 blur-[1px]">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
          <div className="text-center p-4">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
            <UpgradePrompt feature={feature} context="inline" />
          </div>
        </div>
      </div>
    );
  }

  return <UpgradePrompt feature={feature} context="inline" className={className} />;
};
