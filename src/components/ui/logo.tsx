import logoImage from '@/assets/logo.png';
import { cn } from '@/lib/utils';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  size?: LogoSize;
  className?: string;
  animated?: boolean;
  shine?: boolean;
  /** Priority loading for LCP optimization */
  priority?: boolean;
}

// Explicit dimensions for each size to prevent layout shift (CLS)
const sizeConfig: Record<LogoSize, { className: string; width: number; height: number }> = {
  xs: { className: 'h-6', width: 24, height: 24 },
  sm: { className: 'h-8', width: 32, height: 32 },
  md: { className: 'h-12', width: 48, height: 48 },
  lg: { className: 'h-16', width: 64, height: 64 },
  xl: { className: 'h-24', width: 96, height: 96 },
};

export const Logo = ({ 
  size = 'md', 
  className,
  animated = false,
  shine = false,
  priority = false,
}: LogoProps) => {
  const config = sizeConfig[size];
  
  return (
    <div className={cn('flex items-center', className)}>
      <div className={cn(
        'relative',
        shine && 'logo-shine-container'
      )}>
        <img 
          src={logoImage} 
          alt="MoneyQuest" 
          width={config.width}
          height={config.height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          className={cn(
            'object-contain relative z-10',
            config.className,
            animated && 'animate-float'
          )}
        />
        {shine && (
          <>
            {/* Glow effect behind logo */}
            <div 
              className={cn(
                'absolute inset-0 blur-xl opacity-60 z-0 animate-pulse-glow',
                config.className
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
