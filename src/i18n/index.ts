import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';
import esES from './locales/es-ES.json';
import { detectLanguageFromTimezone } from '@/lib/countryDetection';

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
 * pt* → pt-BR, es* → es-ES, en* → en-US
 * IMPORTANTE: Não retorna fallback para en-US - retorna null se não reconhecer
 */
export const mapBrowserLanguage = (browserLang: string): SupportedLanguage | null => {
  const lang = browserLang.toLowerCase();
  
  if (lang.startsWith('pt')) return 'pt-BR';
  if (lang.startsWith('es')) return 'es-ES';
  if (lang.startsWith('en')) return 'en-US';
  
  // Não usar fallback para inglês - retornar null para forçar seleção
  return null;
};

/**
 * Determina o idioma inicial de forma segura.
 * Prioridade:
 * 1. Preferência explícita salva (localStorage)
 * 2. Detecção por timezone
 * 3. Detecção por navigator.language
 * 4. null (forçará tela de seleção)
 */
const determineInitialLanguage = (): SupportedLanguage | null => {
  // 1. Verificar preferência explícita
  const hasExplicitPreference = localStorage.getItem(LANGUAGE_PREFERENCE_KEY) === 'true';
  const savedLang = localStorage.getItem('i18nextLng') as SupportedLanguage | null;
  
  if (hasExplicitPreference && savedLang && SUPPORTED_LANGUAGES[savedLang]) {
    return savedLang;
  }
  
  // 2. Tentar detecção por timezone
  const timezoneLanguage = detectLanguageFromTimezone();
  if (timezoneLanguage) {
    localStorage.setItem('i18nextLng', timezoneLanguage);
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, 'true');
    return timezoneLanguage;
  }
  
  // 3. Tentar detecção por navigator.language
  const browserLang = navigator.language || navigator.languages?.[0];
  if (browserLang) {
    const mappedLang = mapBrowserLanguage(browserLang);
    if (mappedLang) {
      localStorage.setItem('i18nextLng', mappedLang);
      localStorage.setItem(LANGUAGE_PREFERENCE_KEY, 'true');
      return mappedLang;
    }
  }
  
  // 4. Não conseguiu determinar - será tratado pelo LanguageGuard
  return null;
};

// Determinar idioma inicial
const initialLanguage = determineInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage || 'pt-BR', // pt-BR como fallback temporário para i18n funcionar
    fallbackLng: 'pt-BR', // Fallback para pt-BR, não en-US
    supportedLngs: ['pt-BR', 'en-US', 'es-ES'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'],
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
