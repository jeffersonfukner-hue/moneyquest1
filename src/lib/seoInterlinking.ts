/**
 * ============================================================
 * MONEYQUEST AUTO-INTERLINKING SYSTEM
 * ============================================================
 * 
 * Intelligent auto-interlinking for articles:
 * 
 * SATELLITE articles:
 * - 1 contextual link to PILLAR in first third of text
 * - 1 link to another related satellite
 * 
 * LONG-TAIL articles:
 * - Link to main pillar
 * - Link to a related satellite
 * 
 * PILLAR articles:
 * - Links to all main satellites
 * - At least 3 relevant long-tails
 */

import { ArticleType, INTERNAL_LINKING_RULES } from './seoRules';

export interface ArticleForInterlinking {
  slug: string;
  title: string;
  articleType?: ArticleType;
  category?: string;
  content?: string;
  relatedSlugs?: string[];
  internalLinks?: { text: string; url: string }[];
}

export interface InterlinkingSuggestion {
  type: 'add_link' | 'move_link' | 'remove_link';
  priority: 'high' | 'medium' | 'low';
  targetSlug: string;
  targetTitle: string;
  suggestedAnchor: string;
  suggestedPosition: 'first_third' | 'middle' | 'end' | 'related_section';
  reason: string;
}

export interface InterlinkingAnalysis {
  articleSlug: string;
  articleType: ArticleType;
  hasPillarLink: boolean;
  hasSatelliteLinks: boolean;
  suggestions: InterlinkingSuggestion[];
  score: number; // 0-100
}

/**
 * Analyze interlinking for an article and generate suggestions
 */
export const analyzeInterlinking = (
  article: ArticleForInterlinking,
  allArticles: ArticleForInterlinking[]
): InterlinkingAnalysis => {
  const suggestions: InterlinkingSuggestion[] = [];
  const pillarSlug = INTERNAL_LINKING_RULES.mainPillarSlug;
  const articleType = article.articleType || 'longtail';

  // Find pillar article
  const pillarArticle = allArticles.find(a => 
    a.articleType === 'pillar' || a.slug === pillarSlug
  );

  // Check if article links to pillar
  const hasPillarLink = !!(
    article.internalLinks?.some(link => 
      link.url.includes(pillarSlug) || link.url.includes('controle-financeiro-pessoal')
    ) ||
    article.content?.includes(pillarSlug) ||
    article.content?.includes('/controle-financeiro-pessoal') ||
    article.relatedSlugs?.includes(pillarSlug)
  );

  // Find satellites in same category
  const relatedSatellites = allArticles.filter(a => 
    a.slug !== article.slug &&
    a.articleType === 'satellite' &&
    a.category === article.category
  );

  // Check if has satellite links
  const hasSatelliteLinks = relatedSatellites.some(sat =>
    article.internalLinks?.some(link => link.url.includes(sat.slug)) ||
    article.content?.includes(sat.slug) ||
    article.relatedSlugs?.includes(sat.slug)
  );

  let score = 100;

  // Generate suggestions based on article type
  if (articleType === 'satellite' || articleType === 'longtail') {
    // Must link to pillar
    if (!hasPillarLink && pillarArticle) {
      score -= 30;
      suggestions.push({
        type: 'add_link',
        priority: 'high',
        targetSlug: pillarSlug,
        targetTitle: pillarArticle.title || 'Controle Financeiro Pessoal',
        suggestedAnchor: 'guia completo de controle financeiro',
        suggestedPosition: 'first_third',
        reason: `${articleType === 'satellite' ? 'Satellite' : 'Long-tail'} articles MUST link to the pillar article`
      });
    }

    // Should link to at least one related satellite
    if (!hasSatelliteLinks && relatedSatellites.length > 0) {
      score -= 20;
      const suggestedSatellite = relatedSatellites[0];
      suggestions.push({
        type: 'add_link',
        priority: 'medium',
        targetSlug: suggestedSatellite.slug,
        targetTitle: suggestedSatellite.title,
        suggestedAnchor: suggestedSatellite.title.toLowerCase(),
        suggestedPosition: 'middle',
        reason: 'Add contextual link to a related satellite article'
      });
    }
  }

  if (articleType === 'pillar') {
    // Pillar should link to all main satellites
    const satellites = allArticles.filter(a => a.articleType === 'satellite');
    const linkedSatellites = satellites.filter(sat =>
      article.content?.includes(sat.slug) ||
      article.internalLinks?.some(link => link.url.includes(sat.slug)) ||
      article.relatedSlugs?.includes(sat.slug)
    );

    const unlinkedSatellites = satellites.filter(sat => !linkedSatellites.includes(sat));

    if (unlinkedSatellites.length > 0) {
      score -= Math.min(unlinkedSatellites.length * 10, 30);
      
      // Suggest top 3 unlinked satellites
      unlinkedSatellites.slice(0, 3).forEach(sat => {
        suggestions.push({
          type: 'add_link',
          priority: 'high',
          targetSlug: sat.slug,
          targetTitle: sat.title,
          suggestedAnchor: sat.title.toLowerCase(),
          suggestedPosition: 'middle',
          reason: 'Pillar should link to all satellite articles'
        });
      });
    }

    // Should link to at least 3 long-tails
    const longtails = allArticles.filter(a => a.articleType === 'longtail');
    const linkedLongtails = longtails.filter(lt =>
      article.content?.includes(lt.slug) ||
      article.internalLinks?.some(link => link.url.includes(lt.slug)) ||
      article.relatedSlugs?.includes(lt.slug)
    );

    if (linkedLongtails.length < 3) {
      score -= 15;
      const unlinkedLongtails = longtails.filter(lt => !linkedLongtails.includes(lt));
      
      unlinkedLongtails.slice(0, 3 - linkedLongtails.length).forEach(lt => {
        suggestions.push({
          type: 'add_link',
          priority: 'medium',
          targetSlug: lt.slug,
          targetTitle: lt.title,
          suggestedAnchor: lt.title.toLowerCase(),
          suggestedPosition: 'end',
          reason: 'Pillar should link to at least 3 long-tail articles'
        });
      });
    }
  }

  return {
    articleSlug: article.slug,
    articleType,
    hasPillarLink,
    hasSatelliteLinks,
    suggestions,
    score: Math.max(0, score)
  };
};

/**
 * Generate recommended related articles for an article
 */
export const generateRelatedArticles = (
  article: ArticleForInterlinking,
  allArticles: ArticleForInterlinking[]
): ArticleForInterlinking[] => {
  const pillarSlug = INTERNAL_LINKING_RULES.mainPillarSlug;
  const maxRelated = INTERNAL_LINKING_RULES.maxRelatedArticles;
  const related: ArticleForInterlinking[] = [];

  // 1. Pillar always first (if not the article itself)
  if (article.slug !== pillarSlug) {
    const pillar = allArticles.find(a => a.slug === pillarSlug || a.articleType === 'pillar');
    if (pillar) {
      related.push(pillar);
    }
  }

  // 2. Closest satellite semantically (same category)
  if (related.length < maxRelated) {
    const sameCategorySatellites = allArticles.filter(a => 
      a.slug !== article.slug &&
      a.articleType === 'satellite' &&
      a.category === article.category &&
      !related.includes(a)
    );

    if (sameCategorySatellites.length > 0) {
      related.push(sameCategorySatellites[0]);
    }
  }

  // 3. Another satellite or long-tail
  if (related.length < maxRelated) {
    const others = allArticles.filter(a => 
      a.slug !== article.slug &&
      !related.includes(a) &&
      (a.articleType === 'satellite' || a.articleType === 'longtail') &&
      a.category === article.category
    );

    if (others.length > 0) {
      related.push(others[0]);
    } else {
      // Try from any category
      const anyOthers = allArticles.filter(a => 
        a.slug !== article.slug &&
        !related.includes(a) &&
        (a.articleType === 'satellite' || a.articleType === 'longtail')
      );
      if (anyOthers.length > 0) {
        related.push(anyOthers[0]);
      }
    }
  }

  return related.slice(0, maxRelated);
};

/**
 * Generate contextual anchor text for a link
 */
export const generateAnchorText = (
  targetArticle: ArticleForInterlinking,
  context: 'pillar' | 'satellite' | 'longtail'
): string[] => {
  const anchors: string[] = [];

  if (context === 'pillar') {
    anchors.push(
      'guia completo de controle financeiro',
      'controle financeiro pessoal',
      'gestão financeira completa',
      'organização das finanças'
    );
  } else {
    // Extract keywords from title
    const titleWords = targetArticle.title
      .toLowerCase()
      .replace(/[^a-záàâãéèêíïóôõöúç\s]/gi, '')
      .split(' ')
      .filter(w => w.length > 3);

    if (titleWords.length >= 2) {
      anchors.push(titleWords.slice(0, 3).join(' '));
    }
    anchors.push(targetArticle.title.toLowerCase());
  }

  return anchors;
};

/**
 * Check if an internal link uses target="_blank" (should not)
 */
export const validateInternalLinkBehavior = (
  content: string
): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Find internal links with target="_blank"
  const internalBlankRegex = /<a[^>]*href=["'](\/[^"']*|https?:\/\/moneyquest\.app\.br[^"']*)["'][^>]*target=["']_blank["'][^>]*>/gi;
  const matches = content.match(internalBlankRegex);

  if (matches && matches.length > 0) {
    issues.push(`Found ${matches.length} internal link(s) with target="_blank" - remove for PWA compatibility`);
  }

  return {
    valid: issues.length === 0,
    issues
  };
};
