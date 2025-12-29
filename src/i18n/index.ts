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

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'es-ES': { translation: esES },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    supportedLngs: ['pt-BR', 'en-US', 'es-ES'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
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
