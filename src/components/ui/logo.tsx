import logoImage from '@/assets/logo.png';
import { cn } from '@/lib/utils';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  size?: LogoSize;
  className?: string;
  animated?: boolean;
  shine?: boolean;
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
  shine = false,
}: LogoProps) => {
  return (
    <div className={cn('flex items-center', className)}>
      <div className={cn(
        'relative',
        shine && 'logo-shine-container'
      )}>
        <img 
          src={logoImage} 
          alt="MoneyQuest" 
          className={cn(
            'object-contain relative z-10',
            sizeClasses[size],
            animated && 'animate-float'
          )}
        />
        {shine && (
          <>
            {/* Glow effect behind logo */}
            <div 
              className={cn(
                'absolute inset-0 blur-xl opacity-60 z-0 animate-pulse-glow',
                sizeClasses[size]
              )}
              style={{
                background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)',
              }}
            />
            {/* Shine sweep effect */}
            <div className="absolute inset-0 overflow-hidden z-20 pointer-events-none">
              <div className="logo-shine-sweep" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
