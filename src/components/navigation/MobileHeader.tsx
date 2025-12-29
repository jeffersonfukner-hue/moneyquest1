import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SoundToggle } from '@/components/game/SoundToggle';
import { SeasonalThemeIndicator } from '@/components/game/SeasonalThemeIndicator';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';

interface MobileHeaderProps {
  onSettingsClick: () => void;
  onProfileClick: () => void;
}

export const MobileHeader = ({ onSettingsClick, onProfileClick }: MobileHeaderProps) => {
  const { t } = useTranslation();
  const { profile } = useProfile();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border safe-area-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-md mx-auto">
        <button 
          onClick={onProfileClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          aria-label={t('settings.profile')}
        >
          <span className="text-xl">{profile?.avatar_icon || '🎮'}</span>
          <h1 className="font-display font-bold text-lg text-foreground">MoneyQuest</h1>
        </button>
        
        <div className="flex items-center gap-1">
          <SeasonalThemeIndicator />
          <SoundToggle />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onSettingsClick}
            aria-label={t('navigation.settings')}
            className="min-h-[44px] min-w-[44px]"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
