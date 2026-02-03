import { useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { APP_ROUTES } from '@/routes/routes';
import WalletsPage from './Wallets';

type WalletTab = 'accounts' | 'cards' | 'loans' | 'transfers';

const VALID_TABS: WalletTab[] = ['accounts', 'cards', 'loans', 'transfers'];

// Map URL tabs to actual component tabs (checks not yet implemented, redirect to accounts)
const TAB_MAP: Record<string, WalletTab> = {
  'accounts': 'accounts',
  'cards': 'cards',
  'checks': 'accounts', // Cheques redirect to accounts (future feature)
  'loans': 'loans',
  'transfers': 'transfers',
};

/**
 * Router component that handles /wallets/* sub-routes
 * Maps clean URLs to the Wallets page with correct tab
 */
const WalletsRouter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tab } = useParams<{ tab?: string }>();

  useEffect(() => {
    // Handle legacy ?tab= query params - redirect to clean URL
    const searchParams = new URLSearchParams(location.search);
    const legacyTab = searchParams.get('tab');
    
    if (legacyTab && TAB_MAP[legacyTab]) {
      navigate(`/wallets/${legacyTab}`, { replace: true });
      return;
    }

    // Redirect /wallets to /wallets/accounts
    if (location.pathname === '/wallets') {
      navigate(APP_ROUTES.WALLETS_ACCOUNTS, { replace: true });
    }
  }, [location, navigate]);

  // Determine which tab to show
  const activeTab: WalletTab = tab && TAB_MAP[tab] 
    ? TAB_MAP[tab] 
    : 'accounts';

  return <WalletsPage defaultTab={activeTab} />;
};

export default WalletsRouter;
