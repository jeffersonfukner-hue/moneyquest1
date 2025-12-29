import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { FinancialMood } from '@/types/database';
import { useProfile } from '@/hooks/useProfile';
import { calculateFinancialMood } from '@/lib/gameLogic';

interface MoodConfig {
  emoji: string;
  label: string;
  message: string;
  className: string;
}

const MOOD_CONFIG: Record<FinancialMood, MoodConfig> = {
  VERY_POSITIVE: {
    emoji: '🌟',
    label: 'Thriving',
    message: "You're building great habits!",
    className: 'mood-very-positive'
  },
  POSITIVE: {
    emoji: '💚',
    label: 'Growing',
    message: 'Keep up the momentum!',
    className: 'mood-positive'
  },
  NEUTRAL: {
    emoji: '💛',
    label: 'Balanced',
    message: 'Every journey starts here',
    className: 'mood-neutral'
  },
  NEGATIVE: {
    emoji: '🌙',
    label: 'Reflecting',
    message: 'Small steps lead to big changes',
    className: 'mood-negative'
  },
  CRITICAL: {
    emoji: '💜',
    label: 'Rebuilding',
    message: "You've got this. One step at a time.",
    className: 'mood-critical'
  }
};

interface FinancialMoodContextType {
  mood: FinancialMood;
  moodConfig: MoodConfig;
  isLoading: boolean;
}

const FinancialMoodContext = createContext<FinancialMoodContextType | undefined>(undefined);

export const FinancialMoodProvider = ({ children }: { children: ReactNode }) => {
  const { profile, loading } = useProfile();
  const [mood, setMood] = useState<FinancialMood>('NEUTRAL');

  useEffect(() => {
    if (profile) {
      // Use stored mood or calculate from income/expenses
      const calculatedMood = calculateFinancialMood(profile.total_income, profile.total_expenses);
      setMood(profile.financial_mood || calculatedMood);
    }
  }, [profile]);

  // Apply mood class to document
  useEffect(() => {
    const root = document.documentElement;
    // Remove all mood classes
    Object.values(MOOD_CONFIG).forEach(config => {
      root.classList.remove(config.className);
    });
    // Add current mood class
    root.classList.add(MOOD_CONFIG[mood].className);
  }, [mood]);

  return (
    <FinancialMoodContext.Provider 
      value={{ 
        mood, 
        moodConfig: MOOD_CONFIG[mood],
        isLoading: loading 
      }}
    >
      {children}
    </FinancialMoodContext.Provider>
  );
};

export const useFinancialMood = () => {
  const context = useContext(FinancialMoodContext);
  if (!context) {
    throw new Error('useFinancialMood must be used within a FinancialMoodProvider');
  }
  return context;
};

export { MOOD_CONFIG };
