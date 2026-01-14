import type { SupportedLanguage } from '@/i18n';

/**
 * Detecção de idioma do navegador - DESATIVADA
 * Idioma fixo em pt-BR
 */
export const detectBrowserLanguage = (): SupportedLanguage => {
  return 'pt-BR';
};

/**
 * Mapeia um código de idioma do navegador - DESATIVADO
 * Sempre retorna pt-BR
 */
export const mapBrowserLanguage = (_browserLang: string): SupportedLanguage => {
  return 'pt-BR';
};
