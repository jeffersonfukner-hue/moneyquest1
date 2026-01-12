/**
 * ============================================================
 * MONEYQUEST SEO SCORING SYSTEM
 * ============================================================
 * 
 * Calculates internal SEO Score (0-100) for each article based on:
 * - articleType defined correctly
 * - Presence of H1, meta title, meta description
 * - Internal links (received and sent)
 * - Pillar link presence (when applicable)
 * - Sitemap inclusion
 * - Canonical correctness
 * 
 * Classification:
 * - 90-100 → Excellent
 * - 75-89 → Good
 * - 60-74 → Attention
 * - <60 → Critical
 */

import { ArticleType, INTERNAL_LINKING_RULES, validateArticleType } from './seoRules';

export interface SEOScoreBreakdown {
  articleType: number;        // 0-15 points
  h1Unique: number;           // 0-10 points
  metaTitle: number;          // 0-10 points
  metaDescription: number;    // 0-10 points
  internalLinksReceived: number; // 0-15 points
  internalLinksSent: number;  // 0-15 points
  pillarLink: number;         // 0-10 points
  sitemapPresent: number;     // 0-5 points
  canonicalCorrect: number;   // 0-5 points
  relatedArticles: number;    // 0-5 points
}

export interface SEOScore {
  total: number;
  classification: 'excellent' | 'good' | 'attention' | 'critical';
  breakdown: SEOScoreBreakdown;
  suggestions: string[];
}

export interface ArticleForScoring {
  slug: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  articleType?: ArticleType;
  content?: string;
  internalLinks?: { text: string; url: string }[];
  relatedSlugs?: string[];
  hasCanonical?: boolean;
  inSitemap?: boolean;
}

/**
 * Calculate SEO Score for an article
 */
export const calculateSEOScore = (
  article: ArticleForScoring,
  allArticles: ArticleForScoring[],
  options: {
    sitemapSlugs?: Set<string>;
  } = {}
): SEOScore => {
  const breakdown: SEOScoreBreakdown = {
    articleType: 0,
    h1Unique: 0,
    metaTitle: 0,
    metaDescription: 0,
    internalLinksReceived: 0,
    internalLinksSent: 0,
    pillarLink: 0,
    sitemapPresent: 0,
    canonicalCorrect: 0,
    relatedArticles: 0,
  };
  const suggestions: string[] = [];

  // 1. Article Type (15 points)
  if (article.articleType && ['pillar', 'satellite', 'longtail'].includes(article.articleType)) {
    breakdown.articleType = 15;
  } else {
    suggestions.push('Define articleType: "pillar", "satellite", or "longtail"');
  }

  // 2. H1 Unique (10 points)
  if (article.content) {
    const h1Matches = article.content.match(/^# .+$/gm) || [];
    if (h1Matches.length === 1) {
      breakdown.h1Unique = 10;
    } else if (h1Matches.length > 1) {
      breakdown.h1Unique = 5;
      suggestions.push(`Multiple H1 tags found (${h1Matches.length}). Use only one H1 per article.`);
    } else {
      suggestions.push('Add a single H1 heading to the article content');
    }
  }

  // 3. Meta Title (10 points)
  if (article.metaTitle) {
    if (article.metaTitle.length <= 60 && article.metaTitle.length >= 30) {
      breakdown.metaTitle = 10;
    } else if (article.metaTitle.length > 0) {
      breakdown.metaTitle = 6;
      if (article.metaTitle.length > 60) {
        suggestions.push(`Meta title too long (${article.metaTitle.length} chars). Keep under 60 chars.`);
      } else {
        suggestions.push(`Meta title too short (${article.metaTitle.length} chars). Aim for 30-60 chars.`);
      }
    }
  } else {
    suggestions.push('Add a meta title (30-60 characters)');
  }

  // 4. Meta Description (10 points)
  if (article.metaDescription) {
    if (article.metaDescription.length <= 160 && article.metaDescription.length >= 120) {
      breakdown.metaDescription = 10;
    } else if (article.metaDescription.length > 0) {
      breakdown.metaDescription = 6;
      if (article.metaDescription.length > 160) {
        suggestions.push(`Meta description too long (${article.metaDescription.length} chars). Keep under 160.`);
      } else {
        suggestions.push(`Meta description too short (${article.metaDescription.length} chars). Aim for 120-160.`);
      }
    }
  } else {
    suggestions.push('Add a meta description (120-160 characters)');
  }

  // 5. Internal Links Received (15 points)
  const linksReceived = allArticles.filter(a => 
    a.slug !== article.slug && (
      a.internalLinks?.some(link => 
        link.url.includes(article.slug) || 
        link.url.includes(`/blog/${article.slug}`)
      ) ||
      a.relatedSlugs?.includes(article.slug) ||
      a.content?.includes(`/blog/${article.slug}`) ||
      a.content?.includes(`/${article.slug}`)
    )
  ).length;

  if (linksReceived >= 3) {
    breakdown.internalLinksReceived = 15;
  } else if (linksReceived >= 2) {
    breakdown.internalLinksReceived = 10;
  } else if (linksReceived >= 1) {
    breakdown.internalLinksReceived = 5;
  } else {
    suggestions.push('No other articles link to this one. Consider adding internal links from related content.');
  }

  // 6. Internal Links Sent (15 points)
  const linksSent = (article.internalLinks?.length || 0) + 
    (article.content?.match(/\[([^\]]+)\]\(\/[^)]+\)/g)?.length || 0);

  if (linksSent >= 3) {
    breakdown.internalLinksSent = 15;
  } else if (linksSent >= 2) {
    breakdown.internalLinksSent = 10;
  } else if (linksSent >= 1) {
    breakdown.internalLinksSent = 5;
  } else {
    suggestions.push('Add internal links to other related articles');
  }

  // 7. Pillar Link (10 points) - Only for satellite/longtail
  const validatedType = validateArticleType(article.articleType);
  const pillarSlug = INTERNAL_LINKING_RULES.mainPillarSlug;

  if (validatedType === 'pillar') {
    // Pillars don't need to link to themselves
    breakdown.pillarLink = 10;
  } else {
    const hasPillarLink = 
      article.internalLinks?.some(link => link.url.includes(pillarSlug)) ||
      article.relatedSlugs?.includes(pillarSlug) ||
      article.content?.includes(pillarSlug) ||
      article.content?.includes('/controle-financeiro-pessoal');

    if (hasPillarLink) {
      breakdown.pillarLink = 10;
    } else {
      suggestions.push(`Add a contextual link to the pillar article (/blog/${pillarSlug})`);
    }
  }

  // 8. Sitemap Present (5 points)
  if (options.sitemapSlugs?.has(article.slug) || article.inSitemap !== false) {
    breakdown.sitemapPresent = 5;
  } else {
    suggestions.push('Article is not in the sitemap');
  }

  // 9. Canonical Correct (5 points)
  if (article.hasCanonical !== false) {
    breakdown.canonicalCorrect = 5;
  } else {
    suggestions.push('Ensure canonical URL is set correctly');
  }

  // 10. Related Articles (5 points)
  if (article.relatedSlugs && article.relatedSlugs.length >= 2 && article.relatedSlugs.length <= 3) {
    breakdown.relatedArticles = 5;
  } else if (article.relatedSlugs && article.relatedSlugs.length > 0) {
    breakdown.relatedArticles = 3;
    if (article.relatedSlugs.length > 3) {
      suggestions.push('Reduce related articles to maximum 3');
    }
  } else {
    suggestions.push('Add 2-3 related articles');
  }

  // Calculate total
  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  // Determine classification
  let classification: SEOScore['classification'];
  if (total >= 90) {
    classification = 'excellent';
  } else if (total >= 75) {
    classification = 'good';
  } else if (total >= 60) {
    classification = 'attention';
  } else {
    classification = 'critical';
  }

  return {
    total,
    classification,
    breakdown,
    suggestions: suggestions.slice(0, 5), // Limit to top 5 suggestions
  };
};

/**
 * Get classification emoji
 */
export const getClassificationEmoji = (classification: SEOScore['classification']): string => {
  switch (classification) {
    case 'excellent': return '🏆';
    case 'good': return '✅';
    case 'attention': return '⚠️';
    case 'critical': return '❌';
  }
};

/**
 * Get classification color (Tailwind class)
 */
export const getClassificationColor = (classification: SEOScore['classification']): string => {
  switch (classification) {
    case 'excellent': return 'text-green-600';
    case 'good': return 'text-blue-600';
    case 'attention': return 'text-yellow-600';
    case 'critical': return 'text-red-600';
  }
};

/**
 * Get classification background color (Tailwind class)
 */
export const getClassificationBgColor = (classification: SEOScore['classification']): string => {
  switch (classification) {
    case 'excellent': return 'bg-green-100';
    case 'good': return 'bg-blue-100';
    case 'attention': return 'bg-yellow-100';
    case 'critical': return 'bg-red-100';
  }
};
