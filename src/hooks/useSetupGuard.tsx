const SETUP_LANGUAGE_KEY = 'moneyquest_setup_language';
const SETUP_CURRENCY_KEY = 'moneyquest_setup_currency';

export type SupportedLanguage = 'pt-BR' | 'pt-PT' | 'en-US' | 'es-ES';
export type SupportedCurrency = 'BRL' | 'USD' | 'EUR';

export const SUPPORTED_LANGUAGES: { value: SupportedLanguage; label: string; flag: string }[] = [
  { value: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { value: 'pt-PT', label: 'Português (Portugal)', flag: '🇵🇹' },
  { value: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { value: 'es-ES', label: 'Español', flag: '🇪🇸' },
];

export const SUPPORTED_CURRENCIES: { value: SupportedCurrency; label: string; symbol: string }[] = [
  { value: 'BRL', label: 'Real Brasileiro', symbol: 'R$' },
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
];

export const useSetupGuard = () => {
  const hasCompletedSetup = (): boolean => {
    const lang = localStorage.getItem(SETUP_LANGUAGE_KEY);
    const curr = localStorage.getItem(SETUP_CURRENCY_KEY);
    return !!lang && !!curr;
  };

  const getSetupPreferences = () => ({
    language: localStorage.getItem(SETUP_LANGUAGE_KEY) as SupportedLanguage | null,
    currency: localStorage.getItem(SETUP_CURRENCY_KEY) as SupportedCurrency | null,
  });

  const saveSetupPreferences = (language: SupportedLanguage, currency: SupportedCurrency) => {
    localStorage.setItem(SETUP_LANGUAGE_KEY, language);
    localStorage.setItem(SETUP_CURRENCY_KEY, currency);
  };

  const clearSetupPreferences = () => {
    localStorage.removeItem(SETUP_LANGUAGE_KEY);
    localStorage.removeItem(SETUP_CURRENCY_KEY);
  };

  return { 
    hasCompletedSetup, 
    getSetupPreferences, 
    saveSetupPreferences,
    clearSetupPreferences 
  };
};
