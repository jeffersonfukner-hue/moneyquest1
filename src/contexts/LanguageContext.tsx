import React, { createContext, useContext, useEffect, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfile } from '@/hooks/useProfile';
import { SUPPORTED_LANGUAGES, type SupportedLanguage, getDateLocale } from '@/i18n';
import type { Locale } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    await updateProfile({ language: newLanguage, locale: newLanguage });
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
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
