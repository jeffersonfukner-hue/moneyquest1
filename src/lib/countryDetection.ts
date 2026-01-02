import type { SupportedLanguage } from '@/i18n';

/**
 * Mapeamento de timezones para idiomas suportados.
 * Baseado no país/região do timezone.
 */
const TIMEZONE_TO_LANGUAGE: Record<string, SupportedLanguage> = {
  // Brasil → pt-BR
  'America/Sao_Paulo': 'pt-BR',
  'America/Fortaleza': 'pt-BR',
  'America/Recife': 'pt-BR',
  'America/Bahia': 'pt-BR',
  'America/Belem': 'pt-BR',
  'America/Manaus': 'pt-BR',
  'America/Cuiaba': 'pt-BR',
  'America/Campo_Grande': 'pt-BR',
  'America/Porto_Velho': 'pt-BR',
  'America/Boa_Vista': 'pt-BR',
  'America/Rio_Branco': 'pt-BR',
  'America/Araguaina': 'pt-BR',
  'America/Maceio': 'pt-BR',
  'America/Santarem': 'pt-BR',
  'America/Noronha': 'pt-BR',
  'America/Eirunepe': 'pt-BR',
  
  // Portugal → pt-BR (usamos pt-BR como fallback para português)
  'Europe/Lisbon': 'pt-BR',
  'Atlantic/Madeira': 'pt-BR',
  'Atlantic/Azores': 'pt-BR',
  
  // Espanha → es-ES
  'Europe/Madrid': 'es-ES',
  'Atlantic/Canary': 'es-ES',
  'Africa/Ceuta': 'es-ES',
  
  // México e América Latina Espanhola → es-ES
  'America/Mexico_City': 'es-ES',
  'America/Cancun': 'es-ES',
  'America/Merida': 'es-ES',
  'America/Monterrey': 'es-ES',
  'America/Matamoros': 'es-ES',
  'America/Mazatlan': 'es-ES',
  'America/Chihuahua': 'es-ES',
  'America/Ojinaga': 'es-ES',
  'America/Hermosillo': 'es-ES',
  'America/Tijuana': 'es-ES',
  'America/Bahia_Banderas': 'es-ES',
  'America/Argentina/Buenos_Aires': 'es-ES',
  'America/Argentina/Cordoba': 'es-ES',
  'America/Argentina/Salta': 'es-ES',
  'America/Argentina/Jujuy': 'es-ES',
  'America/Argentina/Tucuman': 'es-ES',
  'America/Argentina/Catamarca': 'es-ES',
  'America/Argentina/La_Rioja': 'es-ES',
  'America/Argentina/San_Juan': 'es-ES',
  'America/Argentina/Mendoza': 'es-ES',
  'America/Argentina/San_Luis': 'es-ES',
  'America/Argentina/Rio_Gallegos': 'es-ES',
  'America/Argentina/Ushuaia': 'es-ES',
  'America/Bogota': 'es-ES',
  'America/Lima': 'es-ES',
  'America/Santiago': 'es-ES',
  'America/Caracas': 'es-ES',
  'America/Guayaquil': 'es-ES',
  'America/La_Paz': 'es-ES',
  'America/Montevideo': 'es-ES',
  'America/Asuncion': 'es-ES',
  'America/Panama': 'es-ES',
  'America/Costa_Rica': 'es-ES',
  'America/Guatemala': 'es-ES',
  'America/El_Salvador': 'es-ES',
  'America/Tegucigalpa': 'es-ES',
  'America/Managua': 'es-ES',
  'America/Havana': 'es-ES',
  'America/Santo_Domingo': 'es-ES',
  'America/Puerto_Rico': 'es-ES',
  
  // Estados Unidos → en-US
  'America/New_York': 'en-US',
  'America/Detroit': 'en-US',
  'America/Kentucky/Louisville': 'en-US',
  'America/Kentucky/Monticello': 'en-US',
  'America/Indiana/Indianapolis': 'en-US',
  'America/Indiana/Vincennes': 'en-US',
  'America/Indiana/Winamac': 'en-US',
  'America/Indiana/Marengo': 'en-US',
  'America/Indiana/Petersburg': 'en-US',
  'America/Indiana/Vevay': 'en-US',
  'America/Chicago': 'en-US',
  'America/Indiana/Tell_City': 'en-US',
  'America/Indiana/Knox': 'en-US',
  'America/Menominee': 'en-US',
  'America/North_Dakota/Center': 'en-US',
  'America/North_Dakota/New_Salem': 'en-US',
  'America/North_Dakota/Beulah': 'en-US',
  'America/Denver': 'en-US',
  'America/Boise': 'en-US',
  'America/Phoenix': 'en-US',
  'America/Los_Angeles': 'en-US',
  'America/Anchorage': 'en-US',
  'America/Juneau': 'en-US',
  'America/Sitka': 'en-US',
  'America/Metlakatla': 'en-US',
  'America/Yakutat': 'en-US',
  'America/Nome': 'en-US',
  'America/Adak': 'en-US',
  'Pacific/Honolulu': 'en-US',
  
  // Canadá (inglês) → en-US
  'America/Toronto': 'en-US',
  'America/Vancouver': 'en-US',
  'America/Edmonton': 'en-US',
  'America/Winnipeg': 'en-US',
  'America/Halifax': 'en-US',
  'America/St_Johns': 'en-US',
  'America/Regina': 'en-US',
  'America/Calgary': 'en-US',
  
  // Reino Unido → en-US
  'Europe/London': 'en-US',
  
  // Irlanda → en-US
  'Europe/Dublin': 'en-US',
  
  // Austrália → en-US
  'Australia/Sydney': 'en-US',
  'Australia/Melbourne': 'en-US',
  'Australia/Brisbane': 'en-US',
  'Australia/Perth': 'en-US',
  'Australia/Adelaide': 'en-US',
  'Australia/Hobart': 'en-US',
  'Australia/Darwin': 'en-US',
  
  // Nova Zelândia → en-US
  'Pacific/Auckland': 'en-US',
  'Pacific/Chatham': 'en-US',
};

/**
 * Mapeamento de códigos de país (ISO 3166-1 alpha-2) para idiomas suportados.
 * Usado pela detecção por IP.
 */
const COUNTRY_CODE_TO_LANGUAGE: Record<string, SupportedLanguage> = {
  // Países lusófonos → pt-BR
  'BR': 'pt-BR', // Brasil
  'PT': 'pt-BR', // Portugal
  'AO': 'pt-BR', // Angola
  'MZ': 'pt-BR', // Moçambique
  'CV': 'pt-BR', // Cabo Verde
  'GW': 'pt-BR', // Guiné-Bissau
  'ST': 'pt-BR', // São Tomé e Príncipe
  'TL': 'pt-BR', // Timor-Leste
  
  // Países hispanófonos → es-ES
  'ES': 'es-ES', // Espanha
  'MX': 'es-ES', // México
  'AR': 'es-ES', // Argentina
  'CO': 'es-ES', // Colômbia
  'PE': 'es-ES', // Peru
  'VE': 'es-ES', // Venezuela
  'CL': 'es-ES', // Chile
  'EC': 'es-ES', // Equador
  'GT': 'es-ES', // Guatemala
  'CU': 'es-ES', // Cuba
  'BO': 'es-ES', // Bolívia
  'DO': 'es-ES', // República Dominicana
  'HN': 'es-ES', // Honduras
  'PY': 'es-ES', // Paraguai
  'SV': 'es-ES', // El Salvador
  'NI': 'es-ES', // Nicarágua
  'CR': 'es-ES', // Costa Rica
  'PA': 'es-ES', // Panamá
  'UY': 'es-ES', // Uruguai
  'PR': 'es-ES', // Porto Rico
  'GQ': 'es-ES', // Guiné Equatorial
  
  // Países anglófonos → en-US
  'US': 'en-US', // Estados Unidos
  'GB': 'en-US', // Reino Unido
  'CA': 'en-US', // Canadá
  'AU': 'en-US', // Austrália
  'NZ': 'en-US', // Nova Zelândia
  'IE': 'en-US', // Irlanda
  'ZA': 'en-US', // África do Sul
  'PH': 'en-US', // Filipinas
  'SG': 'en-US', // Singapura
  'IN': 'en-US', // Índia
  'PK': 'en-US', // Paquistão
  'NG': 'en-US', // Nigéria
  'KE': 'en-US', // Quênia
  'GH': 'en-US', // Gana
  'JM': 'en-US', // Jamaica
  'TT': 'en-US', // Trinidad e Tobago
};

/**
 * Prefixos de timezone para idiomas (fallback por região)
 */
const TIMEZONE_PREFIX_TO_LANGUAGE: Record<string, SupportedLanguage> = {
  // América do Sul (exceto Brasil que já está mapeado)
  'America/Argentina': 'es-ES',
  
  // Europa
  'Europe/': 'en-US', // Fallback para inglês na Europa (exceto já mapeados)
};

// Cache para resultado da detecção por IP (evita múltiplas chamadas)
let ipDetectionCache: { language: SupportedLanguage | null; timestamp: number } | null = null;
const IP_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Detecta o idioma baseado no timezone do navegador.
 * Retorna null se não conseguir mapear o timezone para um idioma conhecido.
 */
export const detectLanguageFromTimezone = (): SupportedLanguage | null => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    if (!timezone) {
      return null;
    }
    
    // Primeiro, verifica mapeamento exato
    if (TIMEZONE_TO_LANGUAGE[timezone]) {
      return TIMEZONE_TO_LANGUAGE[timezone];
    }
    
    // Verifica prefixos conhecidos
    for (const [prefix, language] of Object.entries(TIMEZONE_PREFIX_TO_LANGUAGE)) {
      if (timezone.startsWith(prefix)) {
        return language;
      }
    }
    
    // Inferência por continente/região
    if (timezone.startsWith('America/Sao') || 
        timezone.startsWith('America/Bra') ||
        timezone.includes('Brazil')) {
      return 'pt-BR';
    }
    
    if (timezone.startsWith('Europe/Madrid') || 
        timezone.startsWith('America/Mexico') ||
        timezone.startsWith('America/Bogota') ||
        timezone.startsWith('America/Lima') ||
        timezone.startsWith('America/Santiago')) {
      return 'es-ES';
    }
    
    // Não conseguiu mapear
    return null;
  } catch {
    return null;
  }
};

/**
 * Detecta o idioma baseado no IP do usuário usando serviço externo.
 * Usa cache para evitar múltiplas chamadas à API.
 * Retorna null se a detecção falhar.
 */
export const detectLanguageFromIP = async (): Promise<SupportedLanguage | null> => {
  // Verifica cache válido
  if (ipDetectionCache && Date.now() - ipDetectionCache.timestamp < IP_CACHE_DURATION) {
    return ipDetectionCache.language;
  }
  
  try {
    // Usa ipapi.co que é gratuito e não requer API key
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Timeout de 5 segundos
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      throw new Error(`IP API returned ${response.status}`);
    }
    
    const data = await response.json();
    const countryCode = data.country_code?.toUpperCase();
    
    if (!countryCode) {
      ipDetectionCache = { language: null, timestamp: Date.now() };
      return null;
    }
    
    const language = COUNTRY_CODE_TO_LANGUAGE[countryCode] || null;
    
    // Salva no cache
    ipDetectionCache = { language, timestamp: Date.now() };
    
    console.log(`[IP Detection] Country: ${countryCode}, Language: ${language || 'not mapped'}`);
    
    return language;
  } catch (error) {
    console.warn('[IP Detection] Failed:', error);
    
    // Em caso de erro, tenta serviço alternativo (ip-api.com)
    try {
      const fallbackResponse = await fetch('http://ip-api.com/json/?fields=countryCode', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const countryCode = fallbackData.countryCode?.toUpperCase();
        
        if (countryCode) {
          const language = COUNTRY_CODE_TO_LANGUAGE[countryCode] || null;
          ipDetectionCache = { language, timestamp: Date.now() };
          console.log(`[IP Detection Fallback] Country: ${countryCode}, Language: ${language || 'not mapped'}`);
          return language;
        }
      }
    } catch (fallbackError) {
      console.warn('[IP Detection Fallback] Also failed:', fallbackError);
    }
    
    ipDetectionCache = { language: null, timestamp: Date.now() };
    return null;
  }
};

/**
 * Limpa o cache de detecção por IP.
 */
export const clearIPDetectionCache = (): void => {
  ipDetectionCache = null;
};

/**
 * Verifica se a detecção automática de idioma está disponível (timezone).
 */
export const isLanguageDetectionAvailable = (): boolean => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return !!timezone && detectLanguageFromTimezone() !== null;
  } catch {
    return false;
  }
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
 * Detecta idioma usando múltiplas estratégias em ordem de prioridade.
 * 1. Timezone (síncrono, mais rápido)
 * 2. IP (assíncrono, fallback)
 * 3. Retorna null se ambos falharem
 */
export const detectLanguageWithFallback = async (): Promise<SupportedLanguage | null> => {
  // Primeiro tenta timezone (síncrono)
  const timezoneLanguage = detectLanguageFromTimezone();
  if (timezoneLanguage) {
    return timezoneLanguage;
  }
  
  // Fallback para detecção por IP
  const ipLanguage = await detectLanguageFromIP();
  return ipLanguage;
};
