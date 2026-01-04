import { useState } from 'react';
import { Settings, Shield, LogOut, Sun, Moon } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SoundToggle } from '@/components/game/SoundToggle';
import { SeasonalThemeIndicator } from '@/components/game/SeasonalThemeIndicator';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { AvatarDisplay } from '@/components/profile/AvatarDisplay';
import { NotificationBell } from '@/components/notifications/NotificationBell';
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

interface MobileHeaderProps {
  onSettingsClick: () => void;
  onProfileClick: () => void;
}

export const MobileHeader = ({ onSettingsClick, onProfileClick }: MobileHeaderProps) => {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { isSuperAdmin } = useAdminAuth();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background border-b border-border safe-area-top">
        <div className="flex items-center justify-center h-14 px-2 max-w-md mx-auto">
          <div className="flex items-center gap-0.5">
            <Logo size="xs" variant="full" />
            <SeasonalThemeIndicator />
            <SoundToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            <NotificationBell />
            {isSuperAdmin && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/super-admin')}
                aria-label={t('admin.title')}
                className="min-h-[44px] min-w-[44px] text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                <Shield className="w-5 h-5" />
              </Button>
            )}
            <button 
              onClick={onProfileClick}
              className="flex items-center hover:opacity-80 transition-opacity min-h-[44px] min-w-[44px] justify-center"
              aria-label={t('settings.profile')}
            >
              <AvatarDisplay
                avatarUrl={profile?.avatar_url}
                avatarIcon={profile?.avatar_icon || '🎮'}
                size="sm"
              />
            </button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onSettingsClick}
              aria-label={t('navigation.settings')}
              className="min-h-[44px] min-w-[44px] text-primary hover:text-primary/80 hover:bg-primary/10"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowLogoutDialog(true)}
              aria-label={t('auth.logout')}
              className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive/80 hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

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
            <AlertDialogAction onClick={handleSignOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('auth.logout')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
