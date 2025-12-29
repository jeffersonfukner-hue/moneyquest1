import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from '@/i18n';

interface CurrencyContextType {
  currency: SupportedCurrency;
  locale: string;
  formatCurrency: (amount: number) => string;
  setCurrency: (currency: SupportedCurrency) => Promise<void>;
  currencySymbol: string;
  // New conversion capabilities
  convertCurrency: (amount: number, from: SupportedCurrency, to: SupportedCurrency) => number;
  convertToUserCurrency: (amount: number, from: SupportedCurrency) => number;
  formatConverted: (amount: number, from: SupportedCurrency) => string;
  refreshRates: () => Promise<void>;
  lastRateUpdate: Date | null;
  ratesLoading: boolean;
  isRatesStale: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, updateProfile } = useProfile();
  const { 
    convertCurrency: exchangeConvert, 
    refreshRates, 
    lastUpdate, 
    loading: ratesLoading,
    isStale 
  } = useExchangeRates();

  const currency = (profile?.currency as SupportedCurrency) || 'BRL';
  const currencyConfig = SUPPORTED_CURRENCIES[currency];
  const locale = currencyConfig?.locale || 'pt-BR';
  const currencySymbol = currencyConfig?.symbol || 'R$';

  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, [locale, currency]);

  const setCurrency = useCallback(async (newCurrency: SupportedCurrency) => {
    await updateProfile({ currency: newCurrency });
  }, [updateProfile]);

  // Convert between any two currencies
  const convertCurrency = useCallback((
    amount: number, 
    from: SupportedCurrency, 
    to: SupportedCurrency
  ): number => {
    return exchangeConvert(amount, from, to);
  }, [exchangeConvert]);

  // Convert from any currency to user's preferred currency
  const convertToUserCurrency = useCallback((
    amount: number, 
    from: SupportedCurrency
  ): number => {
    return exchangeConvert(amount, from, currency);
  }, [exchangeConvert, currency]);

  // Convert and format in user's currency
  const formatConverted = useCallback((
    amount: number, 
    from: SupportedCurrency
  ): string => {
    const converted = exchangeConvert(amount, from, currency);
    return formatCurrency(converted);
  }, [exchangeConvert, currency, formatCurrency]);

  const value = useMemo(() => ({
    currency,
    locale,
    formatCurrency,
    setCurrency,
    currencySymbol,
    convertCurrency,
    convertToUserCurrency,
    formatConverted,
    refreshRates,
    lastRateUpdate: lastUpdate,
    ratesLoading,
    isRatesStale: isStale(),
  }), [
    currency, 
    locale, 
    formatCurrency, 
    setCurrency, 
    currencySymbol,
    convertCurrency,
    convertToUserCurrency,
    formatConverted,
    refreshRates,
    lastUpdate,
    ratesLoading,
    isStale
  ]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Default values for when context is not available (e.g., during initial render)
const defaultCurrencyContext: CurrencyContextType = {
  currency: 'BRL',
  locale: 'pt-BR',
  formatCurrency: (amount: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount),
  setCurrency: async () => {},
  currencySymbol: 'R$',
  convertCurrency: (amount) => amount,
  convertToUserCurrency: (amount) => amount,
  formatConverted: (amount) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount),
  refreshRates: async () => {},
  lastRateUpdate: null,
  ratesLoading: false,
  isRatesStale: false,
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  // Return default context if not within provider (graceful degradation)
  return context ?? defaultCurrencyContext;
};
