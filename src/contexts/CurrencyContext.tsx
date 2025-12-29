import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from '@/i18n';

interface CurrencyContextType {
  currency: SupportedCurrency;
  locale: string;
  formatCurrency: (amount: number) => string;
  setCurrency: (currency: SupportedCurrency) => Promise<void>;
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, updateProfile } = useProfile();

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

  const value = useMemo(() => ({
    currency,
    locale,
    formatCurrency,
    setCurrency,
    currencySymbol,
  }), [currency, locale, formatCurrency, setCurrency, currencySymbol]);

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
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  // Return default context if not within provider (graceful degradation)
  return context ?? defaultCurrencyContext;
};
