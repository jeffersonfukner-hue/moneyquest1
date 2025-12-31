import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Coins, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  useSetupGuard, 
  SUPPORTED_LANGUAGES, 
  SUPPORTED_CURRENCIES,
  SupportedLanguage,
  SupportedCurrency
} from '@/hooks/useSetupGuard';

const Setup = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { hasCompletedSetup, saveSetupPreferences } = useSetupGuard();

  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency | null>(null);

  // Redirect if already completed setup
  useEffect(() => {
    if (hasCompletedSetup()) {
      navigate('/login');
    }
  }, [hasCompletedSetup, navigate]);

  // Update i18n when language changes
  useEffect(() => {
    if (selectedLanguage) {
      i18n.changeLanguage(selectedLanguage);
    }
  }, [selectedLanguage, i18n]);

  const isValid = selectedLanguage !== null && selectedCurrency !== null;

  const handleContinue = () => {
    if (selectedLanguage && selectedCurrency) {
      saveSetupPreferences(selectedLanguage, selectedCurrency);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-4xl">🎮</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              MoneyQuest
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {t('setup.subtitle', 'Choose your preferences to get started')}
          </p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">
              {t('setup.title', 'Initial Setup')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('setup.description', 'Select your language and currency before creating your account')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Language Selector */}
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-4 w-4 text-primary" />
                {t('setup.languageLabel', 'Language')}
              </Label>
              <Select
                value={selectedLanguage || ''}
                onValueChange={(value) => setSelectedLanguage(value as SupportedLanguage)}
              >
                <SelectTrigger id="language" className="w-full">
                  <SelectValue placeholder={t('setup.selectLanguage', 'Select your language')} />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Currency Selector */}
            <div className="space-y-2">
              <Label htmlFor="currency" className="flex items-center gap-2 text-sm font-medium">
                <Coins className="h-4 w-4 text-primary" />
                {t('setup.currencyLabel', 'Currency')}
              </Label>
              <Select
                value={selectedCurrency || ''}
                onValueChange={(value) => setSelectedCurrency(value as SupportedCurrency)}
              >
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue placeholder={t('setup.selectCurrency', 'Select your primary currency')} />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground">{curr.symbol}</span>
                        <span>{curr.label}</span>
                        <span className="text-xs text-muted-foreground">({curr.value})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('setup.currencyHint', 'This will be the default currency for your wallets and transactions')}
              </p>
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              disabled={!isValid}
              className="w-full mt-4"
              size="lg"
            >
              {t('setup.continue', 'Continue')}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Visual indicator of progress */}
        <div className="flex justify-center gap-2">
          <div className={`h-2 w-8 rounded-full transition-colors ${selectedLanguage ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-2 w-8 rounded-full transition-colors ${selectedCurrency ? 'bg-primary' : 'bg-muted'}`} />
        </div>
      </div>
    </div>
  );
};

export default Setup;
