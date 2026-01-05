import { Home, ArrowLeftRight, Plus, CalendarClock, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type TabId = 'home' | 'transactions' | 'add' | 'scheduled' | 'wallets';

interface BottomNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onAddClick: () => void;
}

export const BottomNavigation = ({ activeTab, onTabChange, onAddClick }: BottomNavigationProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'home' as TabId, icon: Home, label: t('navigation.home') },
    { id: 'transactions' as TabId, icon: ArrowLeftRight, label: t('navigation.transactions') },
    { id: 'add' as TabId, icon: Plus, label: t('navigation.add'), isAction: true },
    { id: 'scheduled' as TabId, icon: CalendarClock, label: t('navigation.scheduled'), isLink: true, path: '/scheduled' },
    { id: 'wallets' as TabId, icon: Wallet, label: t('navigation.wallets'), isLink: true, path: '/wallets' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                onClick={onAddClick}
                className="flex flex-col items-center justify-center -mt-6"
                aria-label={tab.label}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-accent to-xp-gold-glow rounded-full flex items-center justify-center shadow-lg shadow-accent/40 active:scale-95 transition-all hover:shadow-accent/60 hover:shadow-xl">
                  <Icon className="w-7 h-7 text-accent-foreground" />
                </div>
              </button>
            );
          }

          // Link to external page
          if (tab.isLink) {
            return (
              <button
                key={tab.id}
                onClick={() => navigate((tab as any).path || '/wallets')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[48px] rounded-lg transition-colors",
                  "text-muted-foreground hover:text-foreground"
                )}
                aria-label={tab.label}
              >
                <Icon className="w-5 h-5 transition-transform" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'home') {
                  navigate('/dashboard', { state: { tab: 'home' } });
                } else if (tab.id === 'transactions') {
                  // Check if we're already on dashboard
                  if (window.location.pathname === '/dashboard') {
                    onTabChange(tab.id);
                  } else {
                    navigate('/dashboard', { state: { tab: 'transactions' } });
                  }
                } else {
                  onTabChange(tab.id);
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[48px] rounded-lg transition-colors",
                isActive 
                  ? "text-accent" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform",
                isActive && "scale-110"
              )} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
