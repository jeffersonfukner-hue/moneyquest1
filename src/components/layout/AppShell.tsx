import { ReactNode, useState, useEffect } from 'react';
import { useBreakpoint, Breakpoint } from '@/hooks/use-mobile';
import { useLocalStorage } from '@/hooks/useLocalStorage';
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
    case 'desktop': return 'max-w-7xl';
    case 'tablet': return 'max-w-3xl';
    default: return 'max-w-md';
  }
}

export function AppShell({ 
  children, 
  className, 
  fullWidth = false,
}: AppShellProps) {
  const breakpoint = useBreakpoint();
  
  // Persisted collapsed state for desktop/tablet
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    'mq.sidebar.collapsed',
    breakpoint === 'tablet' // Tablet starts collapsed by default
  );
  
  // Mobile drawer state (never persisted)
  const [mobileOpen, setMobileOpen] = useState(false);

  // Register global hotkeys (only on desktop)
  useGlobalHotkeys();

  // Sync collapsed state when breakpoint changes
  useEffect(() => {
    if (breakpoint === 'tablet' && !isCollapsed) {
      // When transitioning to tablet, collapse sidebar
      setIsCollapsed(true);
    }
  }, [breakpoint, isCollapsed, setIsCollapsed]);

  // Mobile: always start with drawer closed on breakpoint change
  useEffect(() => {
    if (breakpoint === 'mobile') {
      setMobileOpen(false);
    }
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
      defaultOpen={breakpoint === 'desktop'}
      open={sidebarOpen}
      onOpenChange={handleOpenChange}
    >
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <SidebarInset>
          <UnifiedTopbar breakpoint={breakpoint} />
          
          <main className={cn(
            "flex-1 px-4 py-3",
            fullWidth ? "" : getContentMaxWidth(breakpoint),
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
