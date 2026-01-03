import { useMemo } from 'react';
import { useProfile } from './useProfile';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { isFeatureUnlocked, getNextUnlock, FEATURE_UNLOCKS, FeatureUnlock } from '@/lib/levelUnlocks';
import { getLevelFromXP } from '@/lib/gameLogic';

interface LevelAccessResult {
  level: number;
  isPremium: boolean;
  loading: boolean;
  // Check if a specific feature is unlocked
  canAccess: (featureKey: string) => boolean;
  // Get feature info with unlock status
  getFeatureStatus: (featureKey: string) => {
    unlocked: boolean;
    requiredLevel: number;
    levelsAway: number;
    feature: FeatureUnlock | null;
  };
  // Next feature to unlock
  nextUnlock: FeatureUnlock | null;
}

/**
 * Hook to check feature access based on user level and premium status
 * Combines level-based unlocks with premium overrides
 */
export const useLevelAccess = (): LevelAccessResult => {
  const { profile, loading: profileLoading } = useProfile();
  const { isPremium, loading: subLoading } = useSubscription();

  const level = useMemo(() => {
    if (!profile) return 1;
    return getLevelFromXP(profile.xp);
  }, [profile]);

  const canAccess = useMemo(() => {
    return (featureKey: string): boolean => {
      return isFeatureUnlocked(featureKey, level, isPremium);
    };
  }, [level, isPremium]);

  const getFeatureStatus = useMemo(() => {
    return (featureKey: string) => {
      const feature = FEATURE_UNLOCKS.find(f => f.key === featureKey) || null;
      const unlocked = isFeatureUnlocked(featureKey, level, isPremium);
      const requiredLevel = feature?.level || 1;
      const levelsAway = Math.max(0, requiredLevel - level);

      return { unlocked, requiredLevel, levelsAway, feature };
    };
  }, [level, isPremium]);

  const nextUnlock = useMemo(() => {
    return getNextUnlock(level, isPremium);
  }, [level, isPremium]);

  return {
    level,
    isPremium,
    loading: profileLoading || subLoading,
    canAccess,
    getFeatureStatus,
    nextUnlock,
  };
};
