import type { SupportedLanguage } from '@/i18n';

/**
 * Detecção de idioma - DESATIVADA
 * Idioma fixo em pt-BR
 * 
 * Funções mantidas para compatibilidade, mas sempre retornam pt-BR
 */

/**
 * Detecta o idioma baseado no timezone do navegador.
 * DESATIVADO - Sempre retorna pt-BR
 */
export const detectLanguageFromTimezone = (): SupportedLanguage => {
  return 'pt-BR';
};

/**
 * Detecta o idioma baseado no IP do usuário.
 * DESATIVADO - Sempre retorna pt-BR
 */
export const detectLanguageFromIP = async (): Promise<SupportedLanguage> => {
  return 'pt-BR';
};

/**
 * Limpa o cache de detecção por IP.
 */
export const clearIPDetectionCache = (): void => {
  // No-op
};

/**
 * Verifica se a detecção automática de idioma está disponível.
 * DESATIVADO - Sempre retorna false
 */
export const isLanguageDetectionAvailable = (): boolean => {
  return false;
};

/**
 * Obtém o timezone atual do navegador.
 */
export const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
  } catch {
    return 'Unknown';
  }
};

/**
 * Detecta idioma usando múltiplas estratégias.
 * DESATIVADO - Sempre retorna pt-BR
 */
export const detectLanguageWithFallback = async (): Promise<SupportedLanguage> => {
  return 'pt-BR';
};
