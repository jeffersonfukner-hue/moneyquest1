import logoImage from '@/assets/logo.png';
import { cn } from '@/lib/utils';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  size?: LogoSize;
  className?: string;
  animated?: boolean;
  shine?: boolean;
  /** Priority loading for LCP optimization - use for above-the-fold logos */
  priority?: boolean;
}

// Explicit dimensions for each size to prevent layout shift (CLS)
// Width and height are critical for Core Web Vitals
const sizeConfig: Record<LogoSize, { className: string; width: number; height: number }> = {
  xs: { className: 'h-6 w-6', width: 24, height: 24 },
  sm: { className: 'h-8 w-8', width: 32, height: 32 },
  md: { className: 'h-12 w-12', width: 48, height: 48 },
  lg: { className: 'h-16 w-16', width: 64, height: 64 },
  xl: { className: 'h-24 w-24', width: 96, height: 96 },
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
        'relative flex-shrink-0',
        shine && 'logo-shine-container'
      )}>
        {/* 
          Optimized image loading:
          - Explicit width/height prevents CLS
          - priority=true for above-the-fold (LCP)
          - priority=false for lazy loading (below fold)
          - decoding async for non-blocking
        */}
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
          // Inline styles for immediate render without CSS blocking
          style={{
            aspectRatio: '1 / 1',
            maxWidth: '100%',
            height: 'auto',
          }}
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
              aria-hidden="true"
            />
            {/* Shine sweep effect */}
            <div className="absolute inset-0 overflow-hidden z-20 pointer-events-none" aria-hidden="true">
              <div className="logo-shine-sweep" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
