import { useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNavigation, type TabId } from '@/components/navigation/BottomNavigation';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { AdBanner } from '@/components/ads/AdBanner';
import { AddTransactionDialog } from '@/components/game/AddTransactionDialog';
import { useTransactions } from '@/hooks/useTransactions';
import { useAdBanner } from '@/hooks/useAdBanner';
import { useReferralNotifications } from '@/hooks/useReferralNotifications';
import { FloatingWhatsAppButton } from '@/components/support/FloatingWhatsAppButton';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { useIsDesktop } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  activeTab?: TabId;
  /** Callback when tab changes (for Index.tsx navigation) */
  onTabChange?: (tab: TabId) => void;
  /** Callback when add button is clicked */
  onAddClick?: () => void;
  /** Additional className for the container */
  className?: string;
  /** Whether to show the header (default: true) */
  showHeader?: boolean;
  /** Whether to show the bottom navigation (default: true) */
  showNavigation?: boolean;
  /** Whether to show the ad banner (default: true) */
  showAdBanner?: boolean;
  /** Whether to show the floating WhatsApp button (default: true) */
  showWhatsAppButton?: boolean;
  /** Whether to use full width on desktop (default: false) */
  fullWidth?: boolean;
}

export const AppLayout = ({ 
  children, 
  activeTab = 'home',
  onTabChange,
  onAddClick,
  className,
  showHeader = true,
  showNavigation = true,
  showAdBanner = true,
  showWhatsAppButton = true,
  fullWidth = false,
}: AppLayoutProps) => {
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();
  const { shouldShowBanner } = useAdBanner();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const isDesktop = useIsDesktop();
  
  // Listen for referral conversion notifications
  useReferralNotifications();

  const handleTabChange = (tab: TabId) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      if (tab === 'home') navigate('/');
      if (tab === 'transactions') navigate('/');
    }
  };

  const handleAddClick = () => {
    if (onAddClick) {
      onAddClick();
    } else {
      setShowAddTransaction(true);
    }
  };

  // Calculate bottom padding based on what's visible (mobile only)
  const getBottomPadding = () => {
    if (showNavigation && showAdBanner && shouldShowBanner) {
      return 'pb-[130px]';
    }
    if (showNavigation) {
      return 'pb-20';
    }
    return '';
  };

  // Desktop: use sidebar + topbar layout
  if (isDesktop) {
    return (
      <DesktopLayout fullWidth={fullWidth} className={className}>
        {children}
        
        {showWhatsAppButton && <FloatingWhatsAppButton />}

        <AddTransactionDialog 
          open={showAddTransaction} 
          onOpenChange={setShowAddTransaction}
          onAdd={addTransaction}
        />
      </DesktopLayout>
    );
  }

  // Mobile/Tablet: keep current layout
  return (
    <div className={cn("min-h-screen bg-background", getBottomPadding(), className)}>
      {showHeader && (
        <MobileHeader 
          onSettingsClick={() => navigate('/settings')}
          onProfileClick={() => navigate('/profile')}
        />
      )}

      {children}

      {showWhatsAppButton && <FloatingWhatsAppButton />}

      {showAdBanner && <AdBanner />}

      {showNavigation && (
        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          onAddClick={handleAddClick}
        />
      )}

      <AddTransactionDialog 
        open={showAddTransaction} 
        onOpenChange={setShowAddTransaction}
        onAdd={addTransaction}
      />
    </div>
  );
};
