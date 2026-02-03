import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Wallet,
  CreditCard,
  Target,
  BarChart3,
  Settings,
  Trophy,
  Calendar,
  BookOpen,
  ShoppingBag,
  Sparkles,
  Users,
  HelpCircle,
  Building2,
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

const mainNavItems = [
  { title: 'dashboard', url: '/', icon: Home },
  { title: 'wallets', url: '/wallets', icon: Wallet },
  { title: 'creditCards', url: '/credit-cards', icon: CreditCard },
  { title: 'goals', url: '/goals', icon: Target },
  { title: 'reports', url: '/cashflow', icon: BarChart3 },
];

const featuresNavItems = [
  { title: 'scheduled', url: '/scheduled', icon: Calendar },
  { title: 'loans', url: '/loans', icon: Building2 },
  { title: 'suppliers', url: '/suppliers', icon: Users },
];

const gamificationNavItems = [
  { title: 'leaderboard', url: '/leaderboard', icon: Trophy },
  { title: 'journal', url: '/journal', icon: BookOpen },
  { title: 'shop', url: '/shop', icon: ShoppingBag },
  { title: 'aiCoach', url: '/ai-coach', icon: Sparkles },
];

const bottomNavItems = [
  { title: 'settings', url: '/settings', icon: Settings },
  { title: 'support', url: '/support', icon: HelpCircle },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { profile } = useProfileContext();
  const { signOut } = useAuth();
  const isCollapsed = state === 'collapsed';
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
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
            {!isCollapsed && (
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
            {!isCollapsed && (
              <span className="font-fredoka font-bold text-lg text-sidebar-foreground">
                MoneyQuest
              </span>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Main Navigation */}
          <SidebarGroup>
            {!isCollapsed && (
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
            {!isCollapsed && (
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
            {!isCollapsed && (
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
            onClick={() => handleNavClick('/profile')}
            isActive={isActive('/profile')}
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
              {!isCollapsed && (
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

          {/* Logout button - visible when not collapsed */}
          {!isCollapsed && (
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
