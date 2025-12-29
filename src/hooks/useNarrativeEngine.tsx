import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  CATEGORY_TO_RPG, 
  calculateImpact, 
  moodToBalanceStatus 
} from '@/lib/narrativeConfig';

interface NarrativeResult {
  narrative: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export const useNarrativeEngine = () => {
  const { profile } = useProfile();
  const { formatCurrency } = useCurrency();
  const { language } = useLanguage();
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

      const impact = calculateImpact(amount, monthlyAverage);
      const rpgCategory = CATEGORY_TO_RPG[category] || 'impulse';
      const balanceStatus = moodToBalanceStatus(profile.financial_mood);
      const formattedValue = formatCurrency(amount);

      const { data, error } = await supabase.functions.invoke('narrative-engine', {
        body: {
          value: formattedValue,
          category: rpgCategory,
          impact,
          userLevel: profile.level,
          balanceStatus,
          eventType: type === 'INCOME' ? 'income' : 'expense',
          language,
        },
      });

      if (error) {
        console.error('Narrative engine error:', error);
        return null;
      }

      return {
        narrative: data.narrative,
        impact,
      };
    } catch (error) {
      console.error('Failed to generate narrative:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [profile, formatCurrency, language]);

  return {
    generateNarrative,
    isGenerating,
  };
};
