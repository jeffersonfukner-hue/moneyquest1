import { useMemo } from 'react';
import { useProfile } from './useProfile';

export type TrialPhase = 'normal' | 'warning' | 'critical' | 'expired' | null;

export interface TrialStatus {
  isInTrial: boolean;
  trialEndDate: Date | null;
  trialStartDate: Date | null;
  daysRemaining: number;
  hoursRemaining: number;
  progressPercentage: number;
  phase: TrialPhase;
  hasUsedTrial: boolean;
  hasPaidSubscription: boolean;
}

export const useTrialStatus = (): TrialStatus => {
  const { profile } = useProfile();

  return useMemo(() => {
    // Default state when no profile
    if (!profile) {
      return {
        isInTrial: false,
        trialEndDate: null,
        trialStartDate: null,
        daysRemaining: 0,
        hoursRemaining: 0,
        progressPercentage: 0,
        phase: null,
        hasUsedTrial: false,
        hasPaidSubscription: false,
      };
    }

    const now = new Date();
    const hasUsedTrial = profile.has_used_trial ?? false;
    
    // Check if user has paid Stripe subscription
    const hasPaidSubscription = 
      profile.stripe_subscription_status === 'active' || 
      profile.stripe_subscription_status === 'trialing';
    
    // If user has paid subscription, they're not in trial
    if (hasPaidSubscription) {
      return {
        isInTrial: false,
        trialEndDate: null,
        trialStartDate: null,
        daysRemaining: 0,
        hoursRemaining: 0,
        progressPercentage: 0,
        phase: null,
        hasUsedTrial,
        hasPaidSubscription: true,
      };
    }

    const trialStartDate = profile.trial_start_date ? new Date(profile.trial_start_date) : null;
    const trialEndDate = profile.trial_end_date ? new Date(profile.trial_end_date) : null;

    // No trial dates set
    if (!trialStartDate || !trialEndDate) {
      return {
        isInTrial: false,
        trialEndDate: null,
        trialStartDate: null,
        daysRemaining: 0,
        hoursRemaining: 0,
        progressPercentage: 0,
        phase: hasUsedTrial ? 'expired' : null,
        hasUsedTrial,
        hasPaidSubscription: false,
      };
    }

    // Calculate time remaining
    const timeRemainingMs = trialEndDate.getTime() - now.getTime();
    const totalTrialMs = trialEndDate.getTime() - trialStartDate.getTime();
    
    // Trial has expired
    if (timeRemainingMs <= 0) {
      return {
        isInTrial: false,
        trialEndDate,
        trialStartDate,
        daysRemaining: 0,
        hoursRemaining: 0,
        progressPercentage: 0,
        phase: 'expired',
        hasUsedTrial,
        hasPaidSubscription: false,
      };
    }

    const hoursRemaining = Math.ceil(timeRemainingMs / (1000 * 60 * 60));
    const daysRemaining = Math.ceil(timeRemainingMs / (1000 * 60 * 60 * 24));
    const progressPercentage = Math.max(0, Math.min(100, (timeRemainingMs / totalTrialMs) * 100));

    // Determine phase based on time remaining
    let phase: TrialPhase = 'normal';
    if (hoursRemaining < 24) {
      phase = 'critical';
    } else if (daysRemaining <= 3) {
      phase = 'warning';
    }

    return {
      isInTrial: true,
      trialEndDate,
      trialStartDate,
      daysRemaining,
      hoursRemaining,
      progressPercentage,
      phase,
      hasUsedTrial,
      hasPaidSubscription: false,
    };
  }, [profile]);
};
