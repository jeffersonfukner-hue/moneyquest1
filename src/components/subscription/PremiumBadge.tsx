import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PremiumBadge = ({ size = 'sm', className }: PremiumBadgeProps) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
    md: 'text-xs px-2 py-1 gap-1',
    lg: 'text-sm px-3 py-1.5 gap-1.5',
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <span 
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        'bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950',
        sizeClasses[size],
        className
      )}
    >
      <Crown className={iconSizes[size]} />
      <span>PRO</span>
    </span>
  );
};
