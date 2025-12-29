// RPG Category Mapping
export const CATEGORY_TO_RPG: Record<string, string> = {
  // Expense categories
  food: 'food',
  transport: 'transport',
  bills: 'housing',
  entertainment: 'fun',
  shopping: 'impulse',
  health: 'emergency',
  education: 'investment',
  other_expense: 'impulse',
  
  // Income categories
  salary: 'investment',
  freelance: 'investment',
  investment: 'investment',
  gift: 'fun',
  other_income: 'investment',
};

// Impact thresholds (percentage of monthly average)
export const IMPACT_THRESHOLDS = {
  low: 0.05,      // < 5% of monthly average
  medium: 0.15,   // 5-15%
  high: 0.30,     // 15-30%
  // > 30% = critical
};

// Calculate impact level based on amount and monthly average
export const calculateImpact = (
  amount: number,
  monthlyAverage: number
): 'low' | 'medium' | 'high' | 'critical' => {
  if (monthlyAverage <= 0) return 'low';
  
  const ratio = amount / monthlyAverage;
  
  if (ratio < IMPACT_THRESHOLDS.low) return 'low';
  if (ratio < IMPACT_THRESHOLDS.medium) return 'medium';
  if (ratio < IMPACT_THRESHOLDS.high) return 'high';
  return 'critical';
};

// Map financial mood to balance status
export const moodToBalanceStatus = (
  mood: string
): 'positive' | 'neutral' | 'negative' => {
  switch (mood) {
    case 'VERY_POSITIVE':
    case 'POSITIVE':
      return 'positive';
    case 'NEUTRAL':
      return 'neutral';
    case 'NEGATIVE':
    case 'CRITICAL':
      return 'negative';
    default:
      return 'neutral';
  }
};

// Impact colors for UI
export const IMPACT_COLORS = {
  low: 'from-emerald-500/20 to-emerald-600/10',
  medium: 'from-amber-500/20 to-amber-600/10',
  high: 'from-orange-500/20 to-orange-600/10',
  critical: 'from-red-500/20 to-red-600/10',
};

// Impact icons
export const IMPACT_ICONS = {
  low: '🛡️',
  medium: '⚔️',
  high: '💥',
  critical: '🔥',
};

// Income specific icons
export const INCOME_ICONS = {
  salary: '💰',
  freelance: '🎯',
  investment: '📈',
  gift: '🎁',
  other_income: '✨',
};
