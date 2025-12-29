import { SupportedCurrency } from '@/types/database';

const CURRENCY_CONFIG: Record<SupportedCurrency, { locale: string; symbol: string }> = {
  BRL: { locale: 'pt-BR', symbol: 'R$' },
  USD: { locale: 'en-US', symbol: '$' },
  EUR: { locale: 'de-DE', symbol: '€' },
};

/**
 * Format a monetary value with consistent 2 decimal places
 * @param amount - The amount to format
 * @param currency - The currency code (BRL, USD, EUR)
 * @param locale - Optional locale override
 * @returns Formatted currency string
 */
export const formatMoney = (
  amount: number | null | undefined,
  currency: SupportedCurrency = 'BRL',
  locale?: string
): string => {
  const safeAmount = amount ?? 0;
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.BRL;
  const effectiveLocale = locale || config.locale;

  return new Intl.NumberFormat(effectiveLocale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
};

/**
 * Format a number with 2 decimal places (no currency symbol)
 * @param amount - The amount to format
 * @param locale - The locale for formatting
 * @returns Formatted number string
 */
export const formatNumber = (
  amount: number | null | undefined,
  locale: string = 'pt-BR'
): string => {
  const safeAmount = amount ?? 0;
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
};

/**
 * Parse a localized number string back to a number
 * @param value - The string value to parse
 * @param locale - The locale the string is formatted in
 * @returns Parsed number
 */
export const parseLocalizedNumber = (
  value: string,
  locale: string = 'pt-BR'
): number => {
  // Remove currency symbols and spaces
  let cleaned = value.replace(/[R$€$\s]/g, '');
  
  // Handle different decimal separators based on locale
  if (locale.includes('BR') || locale.includes('DE')) {
    // Brazilian/German format: 1.234,56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // US format: 1,234.56
    cleaned = cleaned.replace(/,/g, '');
  }
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Get the currency symbol for a given currency
 * @param currency - The currency code
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currency: SupportedCurrency): string => {
  return CURRENCY_CONFIG[currency]?.symbol || 'R$';
};

/**
 * Format a percentage value
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number | null | undefined,
  decimals: number = 1
): string => {
  const safeValue = value ?? 0;
  return `${safeValue.toFixed(decimals)}%`;
};
