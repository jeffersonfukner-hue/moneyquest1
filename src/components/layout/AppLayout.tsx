import { useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNavigation, type TabId } from '@/components/navigation/BottomNavigation';
import { AdBanner } from '@/components/ads/AdBanner';
import { AddTransactionDialog } from '@/components/game/AddTransactionDialog';
import { useTransactions } from '@/hooks/useTransactions';
import { useAdBanner } from '@/hooks/useAdBanner';
import { useReferralNotifications } from '@/hooks/useReferralNotifications';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  activeTab?: TabId;
  /** Additional className for the container */
  className?: string;
  /** Whether to show the bottom navigation (default: true) */
  showNavigation?: boolean;
  /** Whether to show the ad banner (default: true) */
  showAdBanner?: boolean;
}

export const AppLayout = ({ 
  children, 
  activeTab = 'home',
  className,
  showNavigation = true,
  showAdBanner = true,
}: AppLayoutProps) => {
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();
  const { shouldShowBanner } = useAdBanner();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  
  // Listen for referral conversion notifications
  useReferralNotifications();

  const handleTabChange = (tab: TabId) => {
    if (tab === 'home') navigate('/');
    if (tab === 'transactions') navigate('/');
    if (tab === 'quests') navigate('/');
  };

  // Calculate bottom padding based on what's visible
  const getBottomPadding = () => {
    if (showNavigation && showAdBanner && shouldShowBanner) {
      return 'pb-[130px]';
    }
    if (showNavigation) {
      return 'pb-20';
    }
    return '';
  };

  return (
    <div className={cn("min-h-screen bg-background", getBottomPadding(), className)}>
      {children}

      {showAdBanner && <AdBanner />}

      {showNavigation && (
        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          onAddClick={() => setShowAddTransaction(true)}
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
