/**
 * Level-based feature unlocks configuration
 * Defines what features get unlocked at each level
 */

export interface FeatureUnlock {
  key: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  isPremiumOverride?: boolean; // If true, premium users get it regardless of level
}

export const FEATURE_UNLOCKS: FeatureUnlock[] = [
  // Level 1 - Base features (everyone starts with these)
  {
    key: 'daily_quests',
    name: 'Missões Diárias',
    description: 'Desafios diários para ganhar XP',
    icon: '📅',
    level: 1,
  },
  {
    key: 'basic_stats',
    name: 'Estatísticas Básicas',
    description: 'Visualize seus gastos e receitas',
    icon: '📊',
    level: 1,
  },
  
  // Level 3 - Unlocks
  {
    key: 'weekly_quests',
    name: 'Missões Semanais',
    description: 'Desafios de 7 dias com mais XP',
    icon: '📆',
    level: 3,
    isPremiumOverride: true,
  },
  {
    key: 'custom_categories',
    name: 'Categorias Personalizadas',
    description: 'Crie suas próprias categorias',
    icon: '🏷️',
    level: 3,
  },
  
  // Level 5 - Unlocks
  {
    key: 'leaderboard',
    name: 'Ranking Global',
    description: 'Compare seu progresso com outros jogadores',
    icon: '🏆',
    level: 5,
  },
  {
    key: 'transaction_templates',
    name: 'Templates de Transação',
    description: 'Salve transações frequentes',
    icon: '⚡',
    level: 5,
  },
  
  // Level 7 - Unlocks
  {
    key: 'monthly_quests',
    name: 'Missões Mensais',
    description: 'Desafios épicos de 30 dias',
    icon: '🗓️',
    level: 7,
    isPremiumOverride: true,
  },
  {
    key: 'category_goals',
    name: 'Metas por Categoria',
    description: 'Defina limites de gastos por categoria',
    icon: '🎯',
    level: 7,
  },
  
  // Level 10 - Unlocks
  {
    key: 'special_quests',
    name: 'Missões Especiais',
    description: 'Eventos sazonais exclusivos',
    icon: '✨',
    level: 10,
    isPremiumOverride: true,
  },
  
  // Level 15 - Unlocks
  {
    key: 'advanced_reports',
    name: 'Relatórios Avançados',
    description: 'Análises detalhadas do seu fluxo de caixa',
    icon: '📈',
    level: 15,
    isPremiumOverride: true,
  },
  {
    key: 'multi_wallet',
    name: 'Múltiplas Carteiras',
    description: 'Gerencie várias contas e cartões',
    icon: '💳',
    level: 15,
  },
  
  // Level 20 - Unlocks
  {
    key: 'export_data',
    name: 'Exportar Dados',
    description: 'Exporte seus dados em CSV/PDF',
    icon: '📤',
    level: 20,
  },
  {
    key: 'narrative_events',
    name: 'Eventos Narrativos',
    description: 'Histórias personalizadas sobre suas finanças',
    icon: '📖',
    level: 20,
  },
];

/**
 * Get all features unlocked at or before a specific level
 */
export const getUnlockedFeatures = (level: number, isPremium: boolean = false): FeatureUnlock[] => {
  return FEATURE_UNLOCKS.filter(feature => {
    if (isPremium && feature.isPremiumOverride) return true;
    return feature.level <= level;
  });
};

/**
 * Get the next feature to be unlocked
 */
export const getNextUnlock = (level: number, isPremium: boolean = false): FeatureUnlock | null => {
  const locked = FEATURE_UNLOCKS.filter(feature => {
    if (isPremium && feature.isPremiumOverride) return false;
    return feature.level > level;
  }).sort((a, b) => a.level - b.level);
  
  return locked[0] || null;
};

/**
 * Check if a specific feature is unlocked
 */
export const isFeatureUnlocked = (featureKey: string, level: number, isPremium: boolean = false): boolean => {
  const feature = FEATURE_UNLOCKS.find(f => f.key === featureKey);
  if (!feature) return true; // Unknown features are available
  
  if (isPremium && feature.isPremiumOverride) return true;
  return feature.level <= level;
};

/**
 * Get features that will be unlocked at the next level
 */
export const getFeaturesAtLevel = (level: number): FeatureUnlock[] => {
  return FEATURE_UNLOCKS.filter(feature => feature.level === level);
};

/**
 * Get milestone levels (levels with unlocks)
 */
export const getMilestoneLevels = (): number[] => {
  const levels = new Set(FEATURE_UNLOCKS.map(f => f.level));
  return Array.from(levels).sort((a, b) => a - b);
};
