import { useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { getBillingCurrency, getCurrencyRegionName } from '@/lib/regionDetection';
import { STRIPE_PRICING, type BillingPeriod, type CurrencyPricing } from '@/lib/pricingConfig';
import type { SupportedCurrency } from '@/types/database';

export interface PremiumPricingResult {
  billingCurrency: SupportedCurrency;
  regionName: string;
  pricing: CurrencyPricing;
  getPriceId: (period: BillingPeriod) => string;
  getFormattedPrice: (period: BillingPeriod) => string;
  getAmount: (period: BillingPeriod) => number;
}

/**
 * Hook to get premium pricing based on user's region (timezone)
 * 
 * IMPORTANT: This determines billing currency by REGION, not by language!
 * - User in Brazil (any timezone) → BRL
 * - User in Europe (eurozone timezone) → EUR
 * - User in USA or anywhere else → USD (fallback)
 */
export const usePremiumPricing = (): PremiumPricingResult => {
  const { profile } = useProfile();

  const result = useMemo(() => {
    // Determine billing currency from timezone (region-based, not language-based)
    const timezone = profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
    const billingCurrency = getBillingCurrency(timezone);
    const regionName = getCurrencyRegionName(billingCurrency);
    const pricing = STRIPE_PRICING[billingCurrency] || STRIPE_PRICING.USD;

    return {
      billingCurrency,
      regionName,
      pricing,
      getPriceId: (period: BillingPeriod) => pricing[period].priceId,
      getFormattedPrice: (period: BillingPeriod) => pricing[period].formatted,
      getAmount: (period: BillingPeriod) => pricing[period].amount,
    };
  }, [profile?.timezone]);

  return result;
};
