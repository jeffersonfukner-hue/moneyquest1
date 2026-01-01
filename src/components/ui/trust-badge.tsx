import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustBadgeProps {
  icon: LucideIcon;
  text: string;
  className?: string;
  iconClassName?: string;
  variant?: 'default' | 'compact' | 'large';
}

export const TrustBadge = ({ 
  icon: Icon, 
  text, 
  className,
  iconClassName,
  variant = 'default'
}: TrustBadgeProps) => {
  const variants = {
    default: {
      container: 'gap-3',
      iconWrapper: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-sm font-medium'
    },
    compact: {
      container: 'gap-2',
      iconWrapper: 'w-6 h-6',
      icon: 'w-3 h-3',
      text: 'text-xs font-medium'
    },
    large: {
      container: 'gap-4',
      iconWrapper: 'w-10 h-10',
      icon: 'w-5 h-5',
      text: 'text-base font-semibold'
    }
  };

  const v = variants[variant];

  return (
    <div className={cn('flex items-center text-left', v.container, className)}>
      <div className={cn(
        'flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center',
        v.iconWrapper
      )}>
        <Icon className={cn('text-primary', v.icon, iconClassName)} />
      </div>
      <span className={cn('text-foreground', v.text)}>{text}</span>
    </div>
  );
};

interface TrustBadgeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export const TrustBadgeCard = ({ 
  icon: Icon, 
  title, 
  description, 
  className 
}: TrustBadgeCardProps) => (
  <div className={cn(
    'flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/50',
    className
  )}>
    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <div className="space-y-1">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);
