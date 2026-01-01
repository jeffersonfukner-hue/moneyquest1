import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';
import esES from './locales/es-ES.json';

export const SUPPORTED_LANGUAGES = {
  'pt-BR': { name: 'Português (Brasil)', flag: '🇧🇷' },
  'en-US': { name: 'English (US)', flag: '🇺🇸' },
  'es-ES': { name: 'Español', flag: '🇪🇸' },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export const SUPPORTED_CURRENCIES = {
  BRL: { symbol: 'R$', name: 'Real Brasileiro', locale: 'pt-BR' },
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { symbol: '€', name: 'Euro', locale: 'de-DE' },
} as const;

export type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES;

// Chave para identificar se usuário fez escolha explícita de idioma
export const LANGUAGE_PREFERENCE_KEY = 'moneyquest_language_set';

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'es-ES': { translation: esES },
};

/**
 * Mapeia idioma do navegador para idioma suportado.
 * pt* → pt-BR, es* → es-ES, en* → en-US, outros → en-US
 */
export const mapBrowserLanguage = (browserLang: string): SupportedLanguage => {
  const lang = browserLang.toLowerCase();
  
  if (lang.startsWith('pt')) return 'pt-BR';
  if (lang.startsWith('es')) return 'es-ES';
  if (lang.startsWith('en')) return 'en-US';
  
  return 'en-US'; // Fallback para inglês
};

// Verificar se usuário já fez uma escolha explícita de idioma
const hasExplicitPreference = localStorage.getItem(LANGUAGE_PREFERENCE_KEY) === 'true';

// Se não há preferência explícita, detectar do navegador e aplicar ANTES do i18n inicializar
if (!hasExplicitPreference) {
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  const mappedLang = mapBrowserLanguage(browserLang);
  localStorage.setItem('i18nextLng', mappedLang);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en-US',
    supportedLngs: ['pt-BR', 'en-US', 'es-ES'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Se há preferência explícita, respeitar localStorage; senão, navigator já foi aplicado acima
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      convertDetectedLanguage: mapBrowserLanguage,
    },
  });

export default i18n;

export const getDateLocale = async (language: string) => {
  switch (language) {
    case 'pt-BR':
      return (await import('date-fns/locale/pt-BR')).ptBR;
    case 'es-ES':
      return (await import('date-fns/locale/es')).es;
    case 'en-US':
    default:
      return (await import('date-fns/locale/en-US')).enUS;
  }
};
