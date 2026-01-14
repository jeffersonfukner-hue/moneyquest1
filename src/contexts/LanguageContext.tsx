import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ptBR } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';

// Idioma fixo
const FIXED_LANGUAGE: SupportedLanguage = 'pt-BR';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  dateLocale: Locale;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [dateLocale, setDateLocale] = useState<Locale>(ptBR);

  // Garantir que i18n está em pt-BR
  useEffect(() => {
    if (i18n.language !== FIXED_LANGUAGE) {
      i18n.changeLanguage(FIXED_LANGUAGE);
    }
    localStorage.setItem('i18nextLng', FIXED_LANGUAGE);
  }, [i18n]);

  // Carregar locale de data
  useEffect(() => {
    import('date-fns/locale/pt-BR').then(module => {
      setDateLocale(module.ptBR);
    });
  }, []);

  // setLanguage é no-op - idioma fixo em pt-BR
  const setLanguage = async (_lang: SupportedLanguage): Promise<void> => {
    // Ignora mudanças de idioma - sempre pt-BR
    console.log('[LanguageContext] Idioma fixo em pt-BR, mudança ignorada');
  };

  const value: LanguageContextType = {
    language: FIXED_LANGUAGE,
    setLanguage,
    dateLocale,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  
  // Fallback resiliente se contexto não estiver disponível
  if (!context) {
    return {
      language: FIXED_LANGUAGE,
      setLanguage: async () => {},
      dateLocale: ptBR,
      supportedLanguages: SUPPORTED_LANGUAGES,
    };
  }
  
  return context;
};
