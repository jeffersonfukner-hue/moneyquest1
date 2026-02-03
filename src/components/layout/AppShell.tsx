import { ReactNode, useState, useEffect } from 'react';
import { useBreakpoint, Breakpoint } from '@/hooks/use-mobile';
import { useGlobalHotkeys } from '@/hooks/useGlobalHotkeys';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { UnifiedTopbar } from './UnifiedTopbar';
import { FloatingWhatsAppButton } from '@/components/support/FloatingWhatsAppButton';
import { AdBanner } from '@/components/ads/AdBanner';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
  className?: string;
  /** Whether to use full width on desktop (default: false) */
  fullWidth?: boolean;
}

function getContentMaxWidth(breakpoint: Breakpoint): string {
  switch (breakpoint) {
    case 'desktop': return 'max-w-7xl';  // 1280px
    case 'tablet': return 'max-w-4xl';   // 896px (was 3xl/768px)
    default: return 'max-w-lg';          // 512px (was md/448px)
  }
}

export function AppShell({ 
  children, 
  className, 
  fullWidth = false,
}: AppShellProps) {
  const breakpoint = useBreakpoint();

  // Collapsed state is SESSION-ONLY (never persisted).
  // Default: expanded on desktop/tablet. User can collapse temporarily.
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Mobile drawer state (never persisted)
  const [mobileOpen, setMobileOpen] = useState(false);

  // Register global hotkeys (only on desktop)
  useGlobalHotkeys();

  // Reset behavior:
  // - On every breakpoint change, sidebar returns expanded (no persistence)
  // - Mobile drawer starts closed
  useEffect(() => {
    setIsCollapsed(false);
    if (breakpoint === 'mobile') setMobileOpen(false);
  }, [breakpoint]);

  // Determine sidebar open state based on breakpoint
  const sidebarOpen = breakpoint === 'mobile' 
    ? mobileOpen 
    : !isCollapsed;

  const handleOpenChange = (open: boolean) => {
    if (breakpoint === 'mobile') {
      setMobileOpen(open);
    } else {
      setIsCollapsed(!open);
    }
  };

  return (
    <SidebarProvider 
      defaultOpen={breakpoint !== 'mobile'}
      open={sidebarOpen}
      onOpenChange={handleOpenChange}
    >
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <SidebarInset>
          <UnifiedTopbar breakpoint={breakpoint} />
          
          <main className={cn(
            "flex-1 py-4",
            breakpoint === 'mobile' ? 'px-4' : 'px-6',
            fullWidth ? 'max-w-none' : getContentMaxWidth(breakpoint),
            "mx-auto w-full",
            className
          )}>
            {children}
          </main>
        </SidebarInset>
      </div>
      
      {/* Global floating elements */}
      <FloatingWhatsAppButton />
      
      {/* Ad banner only on mobile */}
      {breakpoint === 'mobile' && <AdBanner />}
    </SidebarProvider>
  );
}
