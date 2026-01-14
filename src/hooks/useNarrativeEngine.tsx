import { useState, useCallback } from 'react';
import { useProfile } from './useProfile';
import { generateStaticNarrative } from '@/lib/staticNarratives';

interface NarrativeResult {
  narrative: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Narrative Engine Hook - AI-free version
 * Uses static templates instead of AI-generated narratives
 */
export const useNarrativeEngine = () => {
  const { profile } = useProfile();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateNarrative = useCallback(async (
    amount: number,
    category: string,
    type: 'INCOME' | 'EXPENSE'
  ): Promise<NarrativeResult | null> => {
    if (!profile) return null;

    setIsGenerating(true);

    try {
      // Calculate monthly average for impact calculation
      const monthlyAverage = type === 'EXPENSE' 
        ? profile.total_expenses / Math.max(1, Math.ceil((Date.now() - new Date(profile.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000)))
        : profile.total_income / Math.max(1, Math.ceil((Date.now() - new Date(profile.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000)));

      // Use static narrative generator instead of AI
      const result = generateStaticNarrative(amount, category, type, monthlyAverage);

      // Small delay to maintain UX consistency
      await new Promise(resolve => setTimeout(resolve, 100));

      return result;
    } catch (error) {
      console.error('Failed to generate narrative:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [profile]);

  return {
    generateNarrative,
    isGenerating,
  };
};
