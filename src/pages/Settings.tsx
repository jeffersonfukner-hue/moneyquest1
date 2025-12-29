import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Globe, Coins, Volume2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSound } from '@/contexts/SoundContext';
import { useAuth } from '@/hooks/useAuth';
import { SUPPORTED_LANGUAGES, SUPPORTED_CURRENCIES, type SupportedLanguage, type SupportedCurrency } from '@/i18n';

const Settings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { isMuted, toggleMute } = useSound();
  const { signOut } = useAuth();

  const handleLanguageChange = async (value: string) => {
    await setLanguage(value as SupportedLanguage);
  };

  const handleCurrencyChange = async (value: string) => {
    await setCurrency(value as SupportedCurrency);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border safe-area-top">
        <div className="flex items-center h-14 px-4 max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="min-h-[44px] min-w-[44px] -ml-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-lg text-foreground ml-2">
            {t('settings.title')}
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-4">
        {/* Language */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="w-5 h-5 text-primary" />
              {t('settings.language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="min-h-[48px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, { name, flag }]) => (
                  <SelectItem key={code} value={code} className="min-h-[44px]">
                    <span className="flex items-center gap-2">
                      <span>{flag}</span>
                      <span>{name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Currency */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="w-5 h-5 text-primary" />
              {t('settings.currency')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="min-h-[48px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPORTED_CURRENCIES).map(([code, { symbol, name }]) => (
                  <SelectItem key={code} value={code} className="min-h-[44px]">
                    <span className="flex items-center gap-2">
                      <span className="font-mono">{symbol}</span>
                      <span>{name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Sound */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Volume2 className="w-5 h-5 text-primary" />
              {t('settings.sound')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between min-h-[48px]">
              <Label htmlFor="sound-toggle" className="text-sm">
                {!isMuted ? t('settings.soundOn') : t('settings.soundOff')}
              </Label>
              <Switch
                id="sound-toggle"
                checked={!isMuted}
                onCheckedChange={toggleMute}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button 
          variant="destructive" 
          className="w-full min-h-[48px] mt-6"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t('auth.logout')}
        </Button>
      </main>
    </div>
  );
};

export default Settings;
