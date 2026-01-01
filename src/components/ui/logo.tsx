import logoImage from '@/assets/logo.png';
import { cn } from '@/lib/utils';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  size?: LogoSize;
  className?: string;
  showText?: boolean;
  textClassName?: string;
  animated?: boolean;
}

const sizeClasses: Record<LogoSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
};

export const Logo = ({ 
  size = 'md', 
  className,
  showText = false,
  textClassName,
  animated = false,
}: LogoProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img 
        src={logoImage} 
        alt="MoneyQuest" 
        className={cn(
          'object-contain',
          sizeClasses[size],
          animated && 'animate-float'
        )}
      />
      {showText && (
        <h1 className={cn(
          'font-display font-bold text-gradient-primary',
          size === 'xs' && 'text-sm',
          size === 'sm' && 'text-lg',
          size === 'md' && 'text-2xl',
          size === 'lg' && 'text-4xl',
          size === 'xl' && 'text-5xl',
          textClassName
        )}>
          MoneyQuest
        </h1>
      )}
    </div>
  );
};
