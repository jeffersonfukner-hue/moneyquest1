import logoImage from '@/assets/logo.png';
import { cn } from '@/lib/utils';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  size?: LogoSize;
  className?: string;
  animated?: boolean;
}

const sizeClasses: Record<LogoSize, string> = {
  xs: 'h-6',
  sm: 'h-8',
  md: 'h-12',
  lg: 'h-16',
  xl: 'h-24',
};

export const Logo = ({ 
  size = 'md', 
  className,
  animated = false,
}: LogoProps) => {
  return (
    <div className={cn('flex items-center', className)}>
      <img 
        src={logoImage} 
        alt="MoneyQuest" 
        className={cn(
          'object-contain',
          sizeClasses[size],
          animated && 'animate-float'
        )}
      />
    </div>
  );
};
