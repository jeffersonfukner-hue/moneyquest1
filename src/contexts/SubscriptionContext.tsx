import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useTrialStatus } from '@/hooks/useTrialStatus';

export type SubscriptionPlan = 'FREE' | 'PREMIUM';

export interface PremiumFeature {
  key: string;
  available: boolean;
}

interface SubscriptionContextType {
  plan: SubscriptionPlan;
  isPremium: boolean;
  loading: boolean;
  // Feature checks
  canAccessWeeklyQuests: boolean;
  canAccessMonthlyQuests: boolean;
  canAccessSpecialQuests: boolean;
  canAccessRareBadges: boolean;
  canAccessCategoryGoals: boolean;
  canAccessMultiCurrency: boolean;
  canAccessAdvancedThemes: boolean;
  canAccessDataExport: boolean;
  canAccessUnlimitedHistory: boolean;
  // Utility
  checkFeature: (feature: string) => boolean;
  subscriptionExpiresAt: string | null;
  // Trial info
  isInTrial: boolean;
  trialExpired: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Features available only to Premium users
const PREMIUM_FEATURES = [
  'weekly_quests',
  'monthly_quests', 
  'special_quests',
  'rare_badges',
  'category_goals',
  'multi_currency',
  'advanced_themes',
  'data_export',
  'unlimited_history',
  'premium_cash_flow',
  'batch_edit',
] as const;

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading } = useProfile();
  const trialStatus = useTrialStatus();

  // Determine effective plan considering trial status
  const basePlan: SubscriptionPlan = (profile?.subscription_plan as SubscriptionPlan) || 'FREE';
  
  // User is premium if:
  // 1. Has paid subscription (PREMIUM plan with active Stripe status), OR
  // 2. Is currently in an active trial (not expired)
  const hasPaidSubscription = trialStatus.hasPaidSubscription;
  const isInActiveTrial = trialStatus.isInTrial && trialStatus.phase !== 'expired';
  
  // If trial expired and no paid subscription, force FREE plan
  const plan: SubscriptionPlan = hasPaidSubscription ? 'PREMIUM' : 
                                  isInActiveTrial ? 'PREMIUM' : 
                                  'FREE';
  
  const isPremium = plan === 'PREMIUM';

  const checkFeature = useCallback((feature: string): boolean => {
    if (isPremium) return true;
    // Free users only get: unlimited transactions, daily quests, basic XP, basic mood UI, 30-day history
    const freeFeatures = ['transactions', 'daily_quests', 'xp_system', 'basic_mood'];
    return freeFeatures.includes(feature);
  }, [isPremium]);

  const value = useMemo(() => ({
    plan,
    isPremium,
    loading,
    // Premium feature checks
    canAccessWeeklyQuests: isPremium,
    canAccessMonthlyQuests: isPremium,
    canAccessSpecialQuests: isPremium,
    canAccessRareBadges: isPremium,
    canAccessCategoryGoals: isPremium,
    canAccessMultiCurrency: isPremium,
    canAccessAdvancedThemes: isPremium,
    canAccessDataExport: isPremium,
    canAccessUnlimitedHistory: isPremium,
    checkFeature,
    subscriptionExpiresAt: profile?.subscription_expires_at || null,
    // Trial info
    isInTrial: isInActiveTrial,
    trialExpired: trialStatus.phase === 'expired',
  }), [plan, isPremium, loading, checkFeature, profile?.subscription_expires_at, isInActiveTrial, trialStatus.phase]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);

  // Resilient default (prevents blank screens if used outside provider)
  if (context === undefined) {
    return {
      plan: 'FREE',
      isPremium: false,
      // Treat as loading so premium gates / ads don't flicker incorrectly
      loading: true,
      canAccessWeeklyQuests: false,
      canAccessMonthlyQuests: false,
      canAccessSpecialQuests: false,
      canAccessRareBadges: false,
      canAccessCategoryGoals: false,
      canAccessMultiCurrency: false,
      canAccessAdvancedThemes: false,
      canAccessDataExport: false,
      canAccessUnlimitedHistory: false,
      checkFeature: () => false,
      subscriptionExpiresAt: null,
      isInTrial: false,
      trialExpired: false,
    };
  }

  return context;
};

// Pricing is now centralized in src/lib/pricingConfig.ts
// This is kept for backward compatibility with components that still use it
export const PREMIUM_PRICING = {
  BRL: { 
    monthly: { amount: 14.99, formatted: 'R$ 14,99' },
    yearly: { amount: 149.00, formatted: 'R$ 149,00' },
    // Legacy fields for backward compatibility
    amount: 14.99, symbol: 'R$', formatted: 'R$14,90'
  },
  USD: { 
    monthly: { amount: 4.99, formatted: '$4.99' },
    yearly: { amount: 49.99, formatted: '$49.99' },
    amount: 4.99, symbol: '$', formatted: '$4.99'
  },
  EUR: { 
    monthly: { amount: 4.99, formatted: '€4.99' },
    yearly: { amount: 49.99, formatted: '€49.99' },
    amount: 4.99, symbol: '€', formatted: '€4.99'
  },
} as const;

// Premium benefits for display
export const PREMIUM_BENEFITS = [
  { key: 'unlimited_history', icon: '📊' },
  { key: 'advanced_quests', icon: '🎯' },
  { key: 'rare_badges', icon: '🏆' },
  { key: 'category_goals', icon: '💰' },
  { key: 'multi_currency', icon: '💱' },
  { key: 'advanced_themes', icon: '🎨' },
  { key: 'data_export', icon: '📥' },
] as const;
