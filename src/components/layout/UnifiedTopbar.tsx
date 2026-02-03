import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Moon, Sun, Plus, Shield, LogOut, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Logo } from '@/components/ui/logo';
import { useTheme } from '@/contexts/ThemeContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Breakpoint } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddTransactionDialog } from '@/components/game/AddTransactionDialog';
import { useTransactions } from '@/hooks/useTransactions';

interface UnifiedTopbarProps {
  breakpoint: Breakpoint;
  className?: string;
}

export function UnifiedTopbar({ breakpoint, className }: UnifiedTopbarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isSuperAdmin } = useAdminAuth();
  const { signOut } = useAuth();
  const { addTransaction } = useTransactions();
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Listen for global search hotkey
  useEffect(() => {
    const handleOpenSearch = () => {
      setSearchOpen(true);
    };

    document.addEventListener('open-global-search', handleOpenSearch);
    return () => document.removeEventListener('open-global-search', handleOpenSearch);
  }, []);

  // Close search on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };

    if (searchOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [searchOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getThemeIcon = () => {
    if (theme === 'system') return <Monitor className="w-4 h-4" />;
    return resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />;
  };

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';

  return (
    <>
      <header className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-2 border-b",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        isMobile ? "px-3" : "px-6",
        "safe-area-top",
        className
      )}>
        {/* Sidebar Trigger (hamburger on mobile/tablet) */}
        <SidebarTrigger className="-ml-2" />
        
        {/* Logo - only on mobile */}
        {isMobile && (
          <Logo size="xs" variant="full" className="shrink-0" />
        )}
        
        {/* Search - desktop and tablet */}
        {!isMobile && (
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isTablet ? "Buscar..." : "Buscar... (pressione / ou ⌘K)"}
                className="pl-9 h-9 bg-muted/50"
                onFocus={() => setSearchOpen(true)}
                readOnly
                onClick={() => setSearchOpen(true)}
              />
            </div>
          </div>
        )}
        
        {/* Spacer on mobile */}
        {isMobile && <div className="flex-1" />}
        
        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* New Transaction Button */}
          <Button
            onClick={() => setShowAddDialog(true)}
            size={isMobile ? "icon" : "sm"}
            className={cn(
              "shrink-0",
              isMobile 
                ? "h-9 w-9 rounded-full bg-primary" 
                : "gap-2"
            )}
          >
            <Plus className="h-4 w-4" />
            {!isMobile && <span>{t('transactions.add', 'Novo')}</span>}
          </Button>

          {/* Notifications */}
          <NotificationBell />

          {/* Admin access */}
          {isSuperAdmin && !isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/super-admin')}
              aria-label={t('admin.title')}
              className="h-9 w-9 text-primary hover:text-primary/80"
            >
              <Shield className="w-4 h-4" />
            </Button>
          )}

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                aria-label={t('settings.theme', 'Tema')}
              >
                {getThemeIcon()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
                <Sun className="w-4 h-4" />
                {t('settings.themeLight', 'Claro')}
                {theme === 'light' && <span className="ml-auto text-primary">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
                <Moon className="w-4 h-4" />
                {t('settings.themeDark', 'Escuro')}
                {theme === 'dark' && <span className="ml-auto text-primary">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
                <Monitor className="w-4 h-4" />
                {t('settings.themeSystem', 'Sistema')}
                {theme === 'system' && <span className="ml-auto text-primary">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logout - mobile only (desktop has sidebar footer) */}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowLogoutDialog(true)}
              aria-label={t('auth.logout')}
              className="h-9 w-9 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Global Search Modal */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('search.title', 'Buscar')}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search.placeholder', 'Buscar transações, categorias, carteiras...')}
              className="pl-9"
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {t('search.escToClose', 'Pressione ESC para fechar')}
          </p>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <AddTransactionDialog 
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={addTransaction}
      />

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
