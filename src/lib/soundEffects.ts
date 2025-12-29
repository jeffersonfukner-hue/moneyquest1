// Sound effect selection utilities for narrative events
import type { SoundType } from '@/contexts/SoundContext';

type Impact = 'low' | 'medium' | 'high' | 'critical';

// Get the appropriate sound for a narrative event
export const getNarrativeSound = (
  eventType: 'INCOME' | 'EXPENSE',
  impact: Impact,
  category: string,
  amount?: number
): SoundType => {
  if (eventType === 'INCOME') {
    // Treasure sounds based on amount thresholds
    if (amount && amount >= 1000) return 'treasureLarge';
    if (amount && amount >= 100) return 'treasureMedium';
    return 'treasureSmall';
  }

  // Expense sounds based on impact and category
  // Essential expenses get shield sounds (softer, defensive)
  const essentialCategories = ['food', 'bills', 'health', 'transport'];
  const isEssential = essentialCategories.includes(category.toLowerCase());

  if (isEssential && impact === 'low') {
    return 'shieldBlock';
  }

  // Combat sounds based on impact
  const impactSounds: Record<Impact, SoundType> = {
    low: 'combatLow',
    medium: 'combatMedium',
    high: 'combatHigh',
    critical: 'combatCritical',
  };

  return impactSounds[impact];
};

// Get ambient sound for category (optional enhancement)
export const getCategoryAmbient = (category: string): SoundType | null => {
  const categoryAmbients: Record<string, SoundType> = {
    shopping: 'combatMedium',
    entertainment: 'combatLow',
    education: 'shieldBlock',
    investment: 'treasureMedium',
  };
  
  return categoryAmbients[category.toLowerCase()] || null;
};
