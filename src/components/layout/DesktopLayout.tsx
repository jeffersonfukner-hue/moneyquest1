import { ReactNode } from 'react';
import { useIsDesktop } from '@/hooks/use-mobile';
import { useGlobalHotkeys } from '@/hooks/useGlobalHotkeys';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { DesktopTopbar } from './DesktopTopbar';
import { cn } from '@/lib/utils';

interface DesktopLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  topbar?: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export function DesktopLayout({ 
  children, 
  sidebar, 
  topbar, 
  fullWidth = false,
  className,
}: DesktopLayoutProps) {
  const isDesktop = useIsDesktop();

  // Register global hotkeys
  useGlobalHotkeys();

  // If not desktop, just render children
  if (!isDesktop) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        {sidebar ?? <AppSidebar />}
        <SidebarInset>
          {topbar ?? <DesktopTopbar />}
          <main className={cn(
            "flex-1 p-6",
            fullWidth ? "" : "max-w-7xl mx-auto",
            className
          )}>
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
