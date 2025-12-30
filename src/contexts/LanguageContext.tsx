import React, { createContext, useContext, useEffect, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfile } from '@/hooks/useProfile';
import { SUPPORTED_LANGUAGES, SUPPORTED_CURRENCIES, type SupportedLanguage, type SupportedCurrency, getDateLocale } from '@/i18n';
import type { Locale } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Map languages to default currencies
const LANGUAGE_CURRENCY_MAP: Record<SupportedLanguage, SupportedCurrency> = {
  'en-US': 'USD',
  'es-ES': 'EUR',
  'pt-BR': 'BRL',
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
  dateLocale: Locale;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const { profile, updateProfile } = useProfile();
  const [dateLocale, setDateLocale] = useState<Locale>(ptBR);

  const language = (profile?.language as SupportedLanguage) || (i18n.language as SupportedLanguage) || 'pt-BR';

  // Sync i18n with profile language
  useEffect(() => {
    if (profile?.language && profile.language !== i18n.language) {
      i18n.changeLanguage(profile.language);
    }
  }, [profile?.language, i18n]);

  // Load date locale when language changes
  useEffect(() => {
    const loadDateLocale = async () => {
      const locale = await getDateLocale(language);
      setDateLocale(locale);
    };
    loadDateLocale();
  }, [language]);

  const setLanguage = useCallback(async (newLanguage: SupportedLanguage) => {
    await i18n.changeLanguage(newLanguage);
    
    // Get the default currency for the selected language
    const defaultCurrency = LANGUAGE_CURRENCY_MAP[newLanguage];
    
    // Update both language and currency in the profile
    await updateProfile({ 
      language: newLanguage, 
      locale: newLanguage,
      currency: defaultCurrency 
    });
  }, [i18n, updateProfile]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    dateLocale,
    supportedLanguages: SUPPORTED_LANGUAGES,
  }), [language, setLanguage, dateLocale]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Return default values for resilience during early render
    return {
      language: 'pt-BR',
      setLanguage: async () => {},
      dateLocale: ptBR,
      supportedLanguages: SUPPORTED_LANGUAGES,
    };
  }
  return context;
};
