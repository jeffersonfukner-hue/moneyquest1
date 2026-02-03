import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Wallet,
  Target,
  BarChart3,
  Settings,
  Trophy,
  Calendar,
  BookOpen,
  ShoppingBag,
  Users,
  HelpCircle,
  LogOut,
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
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/ui/logo';
import { AvatarDisplay } from '@/components/profile/AvatarDisplay';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useState } from 'react';
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
import { APP_ROUTES } from '@/routes/routes';

// Helper to check if in mobile drawer mode
// When isMobile is true (from useSidebar), we're in Sheet/drawer mode
// In drawer mode, we should ALWAYS show labels regardless of state

// Main navigation - only existing routes
const mainNavItems = [
  { title: 'dashboard', url: APP_ROUTES.DASHBOARD, icon: Home },
  { title: 'wallets', url: APP_ROUTES.WALLETS, icon: Wallet },
  { title: 'goals', url: APP_ROUTES.CATEGORY_GOALS, icon: Target },
  { title: 'reports', url: APP_ROUTES.CASH_FLOW, icon: BarChart3 },
];

// Features
const featuresNavItems = [
  { title: 'scheduled', url: APP_ROUTES.SCHEDULED, icon: Calendar },
  { title: 'suppliers', url: APP_ROUTES.SUPPLIERS, icon: Users },
];

// Gamification
const gamificationNavItems = [
  { title: 'leaderboard', url: APP_ROUTES.LEADERBOARD, icon: Trophy },
  { title: 'journal', url: APP_ROUTES.JOURNAL, icon: BookOpen },
  { title: 'shop', url: APP_ROUTES.SHOP, icon: ShoppingBag },
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

          <SidebarSeparator />

          {/* Gamification */}
          <SidebarGroup>
            {showLabels && (
              <SidebarGroupLabel className="text-sidebar-foreground/70">
                {t('sidebar.gamification', 'Gamificação')}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {gamificationNavItems.map(renderNavItem)}
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
                  <span className="text-xs text-sidebar-foreground/60 truncate">
                    {t('level.title', 'Nível')} {profile?.level || 1}
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
