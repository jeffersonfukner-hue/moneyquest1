import type { SupportedLanguage } from '@/i18n';

/**
 * Detecta o idioma do navegador e mapeia para um idioma suportado.
 * Regras:
 * - pt* → pt-BR (Português)
 * - es* → es-ES (Espanhol)
 * - en* → en-US (Inglês)
 * - outros → en-US (fallback)
 */
export const detectBrowserLanguage = (): SupportedLanguage => {
  const browserLang = navigator.language || 
                      (navigator as any).userLanguage || 
                      'en';
  
  return mapBrowserLanguage(browserLang);
};

/**
 * Mapeia um código de idioma do navegador para um idioma suportado.
 */
export const mapBrowserLanguage = (browserLang: string): SupportedLanguage => {
  const lang = browserLang.toLowerCase();
  
  if (lang.startsWith('pt')) return 'pt-BR';
  if (lang.startsWith('es')) return 'es-ES';
  if (lang.startsWith('en')) return 'en-US';
  
  // Fallback para inglês
  return 'en-US';
};
