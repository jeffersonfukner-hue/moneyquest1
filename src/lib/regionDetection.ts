import type { SupportedCurrency } from '@/types/database';

// Map timezones to billing currency
// Based on user's timezone, NOT language
const TIMEZONE_TO_CURRENCY: Record<string, SupportedCurrency> = {
  // Brazil (BRL)
  'America/Sao_Paulo': 'BRL',
  'America/Fortaleza': 'BRL',
  'America/Recife': 'BRL',
  'America/Bahia': 'BRL',
  'America/Belem': 'BRL',
  'America/Manaus': 'BRL',
  'America/Cuiaba': 'BRL',
  'America/Porto_Velho': 'BRL',
  'America/Boa_Vista': 'BRL',
  'America/Rio_Branco': 'BRL',
  'America/Campo_Grande': 'BRL',
  'America/Maceio': 'BRL',
  'America/Araguaina': 'BRL',
  'America/Santarem': 'BRL',
  'America/Noronha': 'BRL',
  'America/Eirunepe': 'BRL',

  // Europe (EUR) - Eurozone countries
  'Europe/Lisbon': 'EUR',
  'Europe/Madrid': 'EUR',
  'Europe/Paris': 'EUR',
  'Europe/Berlin': 'EUR',
  'Europe/Rome': 'EUR',
  'Europe/Amsterdam': 'EUR',
  'Europe/Brussels': 'EUR',
  'Europe/Vienna': 'EUR',
  'Europe/Dublin': 'EUR',
  'Europe/Helsinki': 'EUR',
  'Europe/Athens': 'EUR',
  'Europe/Luxembourg': 'EUR',
  'Europe/Malta': 'EUR',
  'Atlantic/Canary': 'EUR',
  'Atlantic/Madeira': 'EUR',
  'Atlantic/Azores': 'EUR',
  'Europe/Bratislava': 'EUR',
  'Europe/Ljubljana': 'EUR',
  'Europe/Tallinn': 'EUR',
  'Europe/Riga': 'EUR',
  'Europe/Vilnius': 'EUR',
  'Europe/Monaco': 'EUR',
  'Europe/San_Marino': 'EUR',
  'Europe/Vatican': 'EUR',
  'Europe/Andorra': 'EUR',

  // USA (USD)
  'America/New_York': 'USD',
  'America/Chicago': 'USD',
  'America/Denver': 'USD',
  'America/Los_Angeles': 'USD',
  'America/Phoenix': 'USD',
  'America/Anchorage': 'USD',
  'America/Juneau': 'USD',
  'Pacific/Honolulu': 'USD',
  'America/Detroit': 'USD',
  'America/Indiana/Indianapolis': 'USD',
  'America/Kentucky/Louisville': 'USD',
  'America/Boise': 'USD',
};

/**
 * Determines billing currency based on user's timezone
 * This is region-based, NOT language-based
 * @param timezone - User's timezone from profile (e.g., 'America/Sao_Paulo')
 * @returns SupportedCurrency - The billing currency (BRL, USD, or EUR)
 */
export const getBillingCurrency = (timezone: string): SupportedCurrency => {
  // Check direct mapping first
  if (TIMEZONE_TO_CURRENCY[timezone]) {
    return TIMEZONE_TO_CURRENCY[timezone];
  }

  // Check prefix patterns for broader matching
  if (timezone.startsWith('America/Sao') || timezone.includes('Brazil')) {
    return 'BRL';
  }

  if (timezone.startsWith('Europe/')) {
    // Most European timezones should use EUR
    return 'EUR';
  }

  // Default fallback is USD (as specified in requirements)
  return 'USD';
};

/**
 * Get currency display info for region indicator
 */
export const getCurrencyRegionName = (currency: SupportedCurrency): string => {
  const names: Record<SupportedCurrency, string> = {
    BRL: 'Brasil',
    USD: 'United States',
    EUR: 'Europe',
  };
  return names[currency] || 'United States';
};
