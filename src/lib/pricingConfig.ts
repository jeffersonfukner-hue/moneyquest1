import type { SupportedCurrency } from '@/types/database';

export type BillingPeriod = 'monthly' | 'yearly';

export interface PriceConfig {
  priceId: string;
  amount: number;
  formatted: string;
}

export interface YearlyPriceConfig extends PriceConfig {
  savings: string;
  monthlyEquivalent: number;
  monthlyEquivalentFormatted: string;
}

export interface CurrencyPricing {
  monthly: PriceConfig;
  yearly: YearlyPriceConfig;
}

/**
 * Stripe Price IDs for MoneyQuest Premium
 * 
 * IMPORTANT: These are fixed IDs from Stripe dashboard
 * - Language does NOT determine currency
 * - Region (timezone) determines currency
 */
export const STRIPE_PRICING: Record<SupportedCurrency, CurrencyPricing> = {
  BRL: {
    monthly: {
      priceId: 'price_1SkC27D4rxstgK3glo545ngb',
      amount: 14.99,
      formatted: 'R$ 14,99',
    },
    yearly: {
      priceId: 'price_1SkC2oD4rxstgK3gpy39gcoe',
      amount: 149.00,
      formatted: 'R$ 149,00',
      savings: 'R$ 30,88',
      monthlyEquivalent: 12.42,
      monthlyEquivalentFormatted: 'R$ 12,42',
    },
  },
  USD: {
    monthly: {
      priceId: 'price_1SkC27D4rxstgK3gPgkwdh3q',
      amount: 4.99,
      formatted: '$4.99',
    },
    yearly: {
      priceId: 'price_1SkC3ID4rxstgK3gGAwi8vrN',
      amount: 49.99,
      formatted: '$49.99',
      savings: '$9.89',
      monthlyEquivalent: 4.17,
      monthlyEquivalentFormatted: '$4.17',
    },
  },
  EUR: {
    monthly: {
      priceId: 'price_1SkC27D4rxstgK3gflhesN0C',
      amount: 4.99,
      formatted: '€4.99',
    },
    yearly: {
      priceId: 'price_1SkC3fD4rxstgK3gNjhDPvDT',
      amount: 49.99,
      formatted: '€49.99',
      savings: '€9.89',
      monthlyEquivalent: 4.17,
      monthlyEquivalentFormatted: '€4.17',
    },
  },
};

/**
 * Get pricing for a specific currency and period
 */
export const getPricing = (currency: SupportedCurrency, period: BillingPeriod) => {
  const currencyPricing = STRIPE_PRICING[currency] || STRIPE_PRICING.USD;
  return currencyPricing[period];
};

/**
 * Get the price ID for checkout
 */
export const getPriceId = (currency: SupportedCurrency, period: BillingPeriod): string => {
  return getPricing(currency, period).priceId;
};
