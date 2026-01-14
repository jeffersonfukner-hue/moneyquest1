import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Idioma fixo: pt-BR (outros idiomas mantidos como estrutura futura, adormecidos)
import ptBR from './locales/pt-BR.json';

// Idioma fixo da aplicação
export const APP_LANGUAGE = 'pt-BR' as const;

// Estrutura mantida para internacionalização futura (DESATIVADA)
export const SUPPORTED_LANGUAGES = {
  'pt-BR': { name: 'Português (Brasil)', flag: '🇧🇷' },
} as const;

export type SupportedLanguage = 'pt-BR';

// Moedas suportadas (funcionando normalmente)
export const SUPPORTED_CURRENCIES = {
  BRL: { symbol: 'R$', name: 'Real Brasileiro', locale: 'pt-BR' },
  USD: { symbol: '$', name: 'Dólar Americano', locale: 'pt-BR' },
  EUR: { symbol: '€', name: 'Euro', locale: 'pt-BR' },
} as const;

export type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES;

// Chave mantida para compatibilidade (não é mais usada para detecção)
export const LANGUAGE_PREFERENCE_KEY = 'moneyquest_language_set';

const resources = {
  'pt-BR': { translation: ptBR },
};

// Funções de detecção desativadas - sempre retornam pt-BR
export const mapBrowserLanguage = (_browserLang: string): SupportedLanguage => 'pt-BR';

export const detectLanguageFromIP = async (): Promise<SupportedLanguage> => 'pt-BR';

export const clearIPDetectionCache = (): void => {};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt-BR', // Idioma fixo
    fallbackLng: 'pt-BR',
    supportedLngs: ['pt-BR'],
    interpolation: {
      escapeValue: false,
    },
  });

// Garantir que localStorage tenha pt-BR
localStorage.setItem('i18nextLng', 'pt-BR');

export default i18n;

// Locale de data - sempre pt-BR
export const getDateLocale = async (_language?: string) => {
  return (await import('date-fns/locale/pt-BR')).ptBR;
};
