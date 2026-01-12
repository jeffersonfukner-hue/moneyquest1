/**
 * ============================================================
 * MONEYQUEST SEO CONTENT SUGGESTIONS SYSTEM
 * ============================================================
 * 
 * Based on existing cluster, suggest:
 * - Missing satellites
 * - Strategic long-tails
 * 
 * For each suggestion:
 * - Main keyword
 * - Article type
 * - Parent article (pillar or satellite)
 */

import { ArticleType, INTERNAL_LINKING_RULES } from './seoRules';
import { BlogCategory } from './blogData';

export interface ArticleForSuggestions {
  slug: string;
  title: string;
  articleType?: ArticleType;
  category?: string;
  content?: string;
}

export interface ContentSuggestion {
  keyword: string;
  suggestedTitle: string;
  articleType: ArticleType;
  parentSlug: string;
  parentTitle: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface ContentGapAnalysis {
  timestamp: string;
  totalExisting: number;
  pillarCount: number;
  satelliteCount: number;
  longtailCount: number;
  suggestions: ContentSuggestion[];
  clusterHealth: Record<string, {
    pillar: boolean;
    satellites: number;
    longtails: number;
    status: 'complete' | 'developing' | 'weak';
  }>;
}

/**
 * Predefined keyword opportunities by category
 */
const KEYWORD_OPPORTUNITIES: Record<string, {
  keyword: string;
  type: ArticleType;
  priority: 'high' | 'medium' | 'low';
}[]> = {
  'controle-financeiro': [
    { keyword: 'controle financeiro familiar', type: 'satellite', priority: 'high' },
    { keyword: 'controle financeiro empresarial simples', type: 'longtail', priority: 'medium' },
    { keyword: 'controle financeiro para autônomos', type: 'satellite', priority: 'high' },
    { keyword: 'planilha controle financeiro grátis', type: 'longtail', priority: 'medium' },
    { keyword: 'controle financeiro casal', type: 'longtail', priority: 'low' },
    { keyword: 'controle financeiro estudante', type: 'longtail', priority: 'medium' },
    { keyword: 'app controle financeiro offline', type: 'longtail', priority: 'low' },
  ],
  'educacao-financeira': [
    { keyword: 'educação financeira para crianças', type: 'satellite', priority: 'high' },
    { keyword: 'educação financeira nas escolas', type: 'longtail', priority: 'medium' },
    { keyword: 'livros educação financeira', type: 'longtail', priority: 'low' },
    { keyword: 'curso educação financeira gratuito', type: 'longtail', priority: 'medium' },
    { keyword: 'educação financeira adolescentes', type: 'satellite', priority: 'high' },
  ],
  'gamificacao': [
    { keyword: 'jogos para aprender finanças', type: 'satellite', priority: 'high' },
    { keyword: 'gamificação poupança', type: 'longtail', priority: 'medium' },
    { keyword: 'desafio 52 semanas gamificado', type: 'longtail', priority: 'medium' },
    { keyword: 'recompensas economizar dinheiro', type: 'longtail', priority: 'low' },
  ],
  'economia-dia-a-dia': [
    { keyword: 'como economizar no supermercado', type: 'satellite', priority: 'high' },
    { keyword: 'economia energia elétrica casa', type: 'longtail', priority: 'medium' },
    { keyword: 'dicas economia água', type: 'longtail', priority: 'low' },
    { keyword: 'economizar gasolina dicas', type: 'longtail', priority: 'medium' },
    { keyword: 'economia doméstica moderna', type: 'satellite', priority: 'high' },
  ],
  'desafios-financeiros': [
    { keyword: 'desafio 30 dias sem gastar', type: 'satellite', priority: 'high' },
    { keyword: 'desafio guardar moedas', type: 'longtail', priority: 'low' },
    { keyword: 'desafio envelope dinheiro', type: 'longtail', priority: 'medium' },
    { keyword: 'desafio minimalismo financeiro', type: 'satellite', priority: 'medium' },
  ],
  'habitos-financeiros': [
    { keyword: 'como criar hábito poupar', type: 'satellite', priority: 'high' },
    { keyword: 'rotina financeira matinal', type: 'longtail', priority: 'medium' },
    { keyword: 'hábitos milionários simples', type: 'longtail', priority: 'low' },
    { keyword: 'mudança comportamento financeiro', type: 'satellite', priority: 'high' },
  ],
};

/**
 * Generate title from keyword
 */
const generateTitleFromKeyword = (keyword: string): string => {
  const templates = [
    `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Guia Completo`,
    `Como Implementar ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} na Prática`,
    `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} - Tudo que Você Precisa Saber`,
    `Guia Prático de ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
};

/**
 * Check if keyword is already covered by existing articles
 */
const isKeywordCovered = (
  keyword: string,
  articles: ArticleForSuggestions[]
): boolean => {
  const keywordWords = keyword.toLowerCase().split(' ');
  
  return articles.some(article => {
    const titleWords = article.title.toLowerCase();
    const slugWords = article.slug.toLowerCase();
    
    // Check if most keywords appear in title or slug
    const matchCount = keywordWords.filter(word => 
      titleWords.includes(word) || slugWords.includes(word)
    ).length;
    
    return matchCount >= Math.ceil(keywordWords.length * 0.6);
  });
};

/**
 * Analyze content gaps and generate suggestions
 */
export const analyzeContentGaps = (
  articles: ArticleForSuggestions[]
): ContentGapAnalysis => {
  const suggestions: ContentSuggestion[] = [];
  const pillarSlug = INTERNAL_LINKING_RULES.mainPillarSlug;
  
  // Count by type
  const pillarCount = articles.filter(a => a.articleType === 'pillar').length;
  const satelliteCount = articles.filter(a => a.articleType === 'satellite').length;
  const longtailCount = articles.filter(a => a.articleType === 'longtail').length;

  // Find pillar article
  const pillarArticle = articles.find(a => 
    a.articleType === 'pillar' || a.slug === pillarSlug
  );

  // Analyze by category
  const categories = Object.keys(KEYWORD_OPPORTUNITIES);
  const clusterHealth: Record<string, {
    pillar: boolean;
    satellites: number;
    longtails: number;
    status: 'complete' | 'developing' | 'weak';
  }> = {};

  for (const category of categories) {
    const categoryArticles = articles.filter(a => a.category === category);
    const satellites = categoryArticles.filter(a => a.articleType === 'satellite').length;
    const longtails = categoryArticles.filter(a => a.articleType === 'longtail').length;
    const hasPillar = category === 'controle-financeiro' ? !!pillarArticle : satellites >= 2;

    clusterHealth[category] = {
      pillar: hasPillar,
      satellites,
      longtails,
      status: satellites >= 3 && longtails >= 5 
        ? 'complete' 
        : satellites >= 1 || longtails >= 2 
          ? 'developing' 
          : 'weak'
    };

    // Generate suggestions for uncovered keywords
    const opportunities = KEYWORD_OPPORTUNITIES[category] || [];
    
    for (const opp of opportunities) {
      if (!isKeywordCovered(opp.keyword, categoryArticles)) {
        // Find parent article
        let parentSlug = pillarSlug;
        let parentTitle = 'Controle Financeiro Pessoal';

        if (opp.type === 'longtail') {
          // Long-tails should link to a satellite if available
          const categorySatellite = categoryArticles.find(a => a.articleType === 'satellite');
          if (categorySatellite) {
            parentSlug = categorySatellite.slug;
            parentTitle = categorySatellite.title;
          }
        }

        suggestions.push({
          keyword: opp.keyword,
          suggestedTitle: generateTitleFromKeyword(opp.keyword),
          articleType: opp.type,
          parentSlug,
          parentTitle,
          category,
          priority: opp.priority,
          reason: clusterHealth[category].status === 'weak' 
            ? 'Category needs more content'
            : `Add ${opp.type} to strengthen cluster`
        });
      }
    }
  }

  // Sort suggestions by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    timestamp: new Date().toISOString(),
    totalExisting: articles.length,
    pillarCount,
    satelliteCount,
    longtailCount,
    suggestions: suggestions.slice(0, 15), // Limit to top 15
    clusterHealth
  };
};

/**
 * Get cluster status emoji
 */
export const getClusterStatusEmoji = (status: 'complete' | 'developing' | 'weak'): string => {
  switch (status) {
    case 'complete': return '✅';
    case 'developing': return '🔄';
    case 'weak': return '⚠️';
  }
};

/**
 * Get priority badge color
 */
export const getPriorityColor = (priority: 'high' | 'medium' | 'low'): string => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    case 'low': return 'bg-green-100 text-green-700';
  }
};

/**
 * Generate a content calendar suggestion
 */
export const generateContentCalendar = (
  suggestions: ContentSuggestion[],
  weeksAhead: number = 4
): { week: number; suggestion: ContentSuggestion }[] => {
  const calendar: { week: number; suggestion: ContentSuggestion }[] = [];
  
  // Distribute suggestions across weeks, prioritizing high priority
  const sorted = [...suggestions].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  for (let week = 1; week <= weeksAhead && calendar.length < sorted.length; week++) {
    // One article per week
    if (sorted[calendar.length]) {
      calendar.push({
        week,
        suggestion: sorted[calendar.length]
      });
    }
  }

  return calendar;
};
