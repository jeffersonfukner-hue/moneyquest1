import { Settings, Shield } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SoundToggle } from '@/components/game/SoundToggle';
import { SeasonalThemeIndicator } from '@/components/game/SeasonalThemeIndicator';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AvatarDisplay } from '@/components/profile/AvatarDisplay';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface MobileHeaderProps {
  onSettingsClick: () => void;
  onProfileClick: () => void;
}

export const MobileHeader = ({ onSettingsClick, onProfileClick }: MobileHeaderProps) => {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { isSuperAdmin } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border safe-area-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-md mx-auto">
        <Logo size="sm" />
        
        <div className="flex items-center gap-1">
          <SeasonalThemeIndicator />
          <SoundToggle />
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
        </div>
      </div>
    </header>
  );
};
