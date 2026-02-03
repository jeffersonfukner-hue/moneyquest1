import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  Home,
  Wallet,
  Target,
  BarChart3,
  Settings,
  Calendar,
  Users,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Landmark,
  Banknote,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/ui/logo';
import { AvatarDisplay } from '@/components/profile/AvatarDisplay';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { APP_ROUTES } from '@/routes/routes';

// Helper to check if in mobile drawer mode
// When isMobile is true (from useSidebar), we're in Sheet/drawer mode
// In drawer mode, we should ALWAYS show labels regardless of state

// Main navigation - only existing routes
const mainNavItems = [
  { title: 'dashboard', url: APP_ROUTES.DASHBOARD, icon: Home },
];

// Wallets sub-items (actual tabs in the Wallets page)
const walletsSubItems = [
  { title: 'accounts', url: APP_ROUTES.WALLETS_ACCOUNTS, icon: Banknote },
  { title: 'cards', url: APP_ROUTES.WALLETS_CARDS, icon: CreditCard },
  { title: 'loans', url: APP_ROUTES.WALLETS_LOANS, icon: Landmark },
];

// Features
const featuresNavItems = [
  { title: 'scheduled', url: APP_ROUTES.SCHEDULED, icon: Calendar },
  { title: 'suppliers', url: APP_ROUTES.SUPPLIERS, icon: Users },
  { title: 'goals', url: APP_ROUTES.GOALS, icon: Target },
  { title: 'reports', url: APP_ROUTES.REPORTS, icon: BarChart3 },
];

// Bottom nav
const bottomNavItems = [
  { title: 'settings', url: APP_ROUTES.SETTINGS, icon: Settings },
  { title: 'support', url: APP_ROUTES.SUPPORT, icon: HelpCircle },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isMobile, setOpenMobile, openMobile } = useSidebar();
  const { profile } = useProfileContext();
  const { signOut } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [walletsOpen, setWalletsOpen] = useState(
    location.pathname.startsWith('/wallets')
  );

  // CRITICAL FIX: In mobile/tablet drawer mode, ALWAYS show labels
  // The drawer (Sheet) is used when isMobile is true (includes touch tablets)
  // When drawer is open (openMobile), we should show labels regardless of 'state'
  // 'state' (collapsed/expanded) only controls the icon-only mode on desktop
  const isInDrawerMode = isMobile;
  const isDrawerOpen = openMobile;
  
  // Show labels when:
  // 1. We're in drawer mode AND drawer is open (mobile/tablet)
  // 2. OR we're in sidebar mode (desktop) AND not collapsed
  const showLabels = isInDrawerMode ? isDrawerOpen : state === 'expanded';
  
  // For backward compatibility with existing code that checks isCollapsed
  const isCollapsed = !showLabels;

  const isActive = (path: string) => {
    // Dashboard is active only on exact match
    if (path === APP_ROUTES.DASHBOARD) {
      return location.pathname === APP_ROUTES.DASHBOARD;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Check if any wallet sub-route is active
  const isWalletsActive = location.pathname.startsWith('/wallets');

  // Close mobile drawer when navigating
  const handleNavClick = (url: string) => {
    if (isMobile) {
      setOpenMobile(false);
    }
    navigate(url);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const renderNavItem = (item: { title: string; url: string; icon: React.ComponentType<{ className?: string }> }) => {
    const Icon = item.icon;
    const active = isActive(item.url);

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={isCollapsed ? t(`sidebar.${item.title}`, item.title) : undefined}
        >
          <NavLink
            to={item.url}
            end={item.url === '/'}
            className="flex items-center gap-3"
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
            onClick={() => {
              if (isMobile) setOpenMobile(false);
            }}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {/* CRITICAL: Use showLabels instead of !isCollapsed */}
            {showLabels && (
              <span className="truncate">
                {t(`sidebar.${item.title}`, item.title)}
              </span>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderWalletsCollapsible = () => (
    <Collapsible open={walletsOpen} onOpenChange={setWalletsOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={isWalletsActive}
            tooltip={isCollapsed ? t('sidebar.wallets', 'Carteiras') : undefined}
            className="w-full"
          >
            <Wallet className="h-4 w-4 shrink-0" />
            {showLabels && (
              <>
                <span className="truncate flex-1 text-left">
                  {t('sidebar.wallets', 'Carteiras')}
                </span>
                {walletsOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
              </>
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {walletsSubItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.url);
              return (
                <SidebarMenuSubItem key={item.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={active}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {t(`sidebar.${item.title}`, item.title)}
                      </span>
                    </NavLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );

  return (
    <>
      <Sidebar collapsible="icon">
        {/* Header with Logo */}
        <SidebarHeader className="border-b border-sidebar-border">
          <div className={cn(
            "flex items-center gap-2 px-2 py-2",
            isCollapsed && "justify-center"
          )}>
            <Logo size={isCollapsed ? 'sm' : 'md'} variant="icon" />
            {/* CRITICAL: Use showLabels for consistent behavior */}
            {showLabels && (
              <span className="font-fredoka font-bold text-lg text-sidebar-foreground">
                MoneyQuest
              </span>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Main Navigation */}
          <SidebarGroup>
            {/* CRITICAL: Use showLabels for group labels too */}
            {showLabels && (
              <SidebarGroupLabel className="text-sidebar-foreground/70">
                {t('sidebar.main', 'Principal')}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map(renderNavItem)}
                {/* Wallets with collapsible sub-menu */}
                {renderWalletsCollapsible()}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* Features */}
          <SidebarGroup>
            {showLabels && (
              <SidebarGroupLabel className="text-sidebar-foreground/70">
                {t('sidebar.features', 'Funcionalidades')}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {featuresNavItems.map(renderNavItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer with User Profile and Settings */}
        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            {bottomNavItems.map(renderNavItem)}
          </SidebarMenu>
          
          <SidebarSeparator />

          {/* User Profile */}
          <SidebarMenuButton
            onClick={() => handleNavClick(APP_ROUTES.PROFILE)}
            isActive={isActive(APP_ROUTES.PROFILE)}
            tooltip={isCollapsed ? t('sidebar.profile', 'Perfil') : undefined}
            className="w-full"
          >
            <div className={cn(
              "flex items-center gap-3 w-full",
              isCollapsed && "justify-center"
            )}>
              <AvatarDisplay 
                avatarIcon={profile?.avatar_icon || '🧙‍♂️'} 
                size="sm" 
              />
              {/* CRITICAL: Use showLabels for profile info */}
              {showLabels && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate text-sidebar-foreground">
                    {profile?.display_name || t('sidebar.profile', 'Perfil')}
                  </span>
                </div>
              )}
            </div>
          </SidebarMenuButton>

          {/* Logout button - visible when showing labels */}
          {showLabels && (
            <SidebarMenuButton
              onClick={() => setShowLogoutDialog(true)}
              tooltip={isCollapsed ? t('auth.logout', 'Sair') : undefined}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="truncate">{t('auth.logout', 'Sair')}</span>
            </SidebarMenuButton>
          )}
        </SidebarFooter>
      </Sidebar>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('auth.logoutConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('auth.logoutConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSignOut} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('auth.logout')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
