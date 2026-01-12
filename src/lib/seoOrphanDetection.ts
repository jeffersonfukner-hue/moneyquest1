/**
 * ============================================================
 * MONEYQUEST ORPHAN ARTICLE DETECTION SYSTEM
 * ============================================================
 * 
 * Automatic detection of:
 * - Articles without internal links received
 * - Articles that don't link to any other
 * - Articles outside any cluster
 * 
 * Classification:
 * - ALERT (when recoverable)
 * - CRITICAL (when totally isolated)
 */

import { ArticleType, INTERNAL_LINKING_RULES } from './seoRules';

export interface ArticleForOrphanCheck {
  slug: string;
  title: string;
  articleType?: ArticleType;
  category?: string;
  content?: string;
  relatedSlugs?: string[];
  internalLinks?: { text: string; url: string }[];
}

export type OrphanSeverity = 'alert' | 'critical';

export interface OrphanArticle {
  slug: string;
  title: string;
  articleType?: ArticleType;
  severity: OrphanSeverity;
  reasons: string[];
  linksReceived: number;
  linksSent: number;
  suggestions: string[];
}

export interface OrphanAnalysisReport {
  timestamp: string;
  totalArticles: number;
  orphanCount: number;
  alertCount: number;
  criticalCount: number;
  orphans: OrphanArticle[];
  healthScore: number; // 0-100
}

/**
 * Check if an article receives links from other articles
 */
const countLinksReceived = (
  article: ArticleForOrphanCheck,
  allArticles: ArticleForOrphanCheck[]
): number => {
  return allArticles.filter(a => 
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
};

/**
 * Check if an article links to other articles
 */
const countLinksSent = (article: ArticleForOrphanCheck): number => {
  const explicitLinks = article.internalLinks?.length || 0;
  const contentLinks = article.content?.match(/\[([^\]]+)\]\(\/[^)]+\)/g)?.length || 0;
  const relatedLinks = article.relatedSlugs?.length || 0;
  
  return explicitLinks + contentLinks + relatedLinks;
};

/**
 * Detect orphan articles in the content collection
 */
export const detectOrphanArticles = (
  articles: ArticleForOrphanCheck[]
): OrphanAnalysisReport => {
  const orphans: OrphanArticle[] = [];
  const pillarSlug = INTERNAL_LINKING_RULES.mainPillarSlug;

  for (const article of articles) {
    const linksReceived = countLinksReceived(article, articles);
    const linksSent = countLinksSent(article);
    const reasons: string[] = [];
    const suggestions: string[] = [];

    // Check for no links received
    if (linksReceived === 0) {
      reasons.push('No internal links received from other articles');
      suggestions.push('Add links to this article from related content');
    }

    // Check for no links sent
    if (linksSent === 0) {
      reasons.push('Does not link to any other article');
      suggestions.push('Add contextual internal links within the content');
    }

    // Check if satellite/longtail without pillar link
    const articleType = article.articleType || 'longtail';
    if (articleType !== 'pillar' && article.slug !== pillarSlug) {
      const hasPillarLink = 
        article.internalLinks?.some(link => link.url.includes(pillarSlug)) ||
        article.content?.includes(pillarSlug) ||
        article.relatedSlugs?.includes(pillarSlug);

      if (!hasPillarLink) {
        reasons.push('Missing link to pillar article');
        suggestions.push(`Add contextual link to the pillar article (/blog/${pillarSlug})`);
      }
    }

    // Check if outside any cluster (no category or unrelated)
    if (!article.category) {
      reasons.push('Article has no category defined');
      suggestions.push('Assign a category to integrate into a content cluster');
    }

    // Determine severity
    if (reasons.length > 0) {
      const severity: OrphanSeverity = 
        (linksReceived === 0 && linksSent === 0) || reasons.length >= 3
          ? 'critical'
          : 'alert';

      orphans.push({
        slug: article.slug,
        title: article.title,
        articleType: article.articleType,
        severity,
        reasons,
        linksReceived,
        linksSent,
        suggestions
      });
    }
  }

  const alertCount = orphans.filter(o => o.severity === 'alert').length;
  const criticalCount = orphans.filter(o => o.severity === 'critical').length;

  // Calculate health score
  const healthScore = Math.max(0, Math.round(
    100 - (alertCount * 5) - (criticalCount * 15)
  ));

  return {
    timestamp: new Date().toISOString(),
    totalArticles: articles.length,
    orphanCount: orphans.length,
    alertCount,
    criticalCount,
    orphans,
    healthScore
  };
};

/**
 * Get orphan severity color
 */
export const getOrphanSeverityColor = (severity: OrphanSeverity): string => {
  switch (severity) {
    case 'alert': return 'text-yellow-600';
    case 'critical': return 'text-red-600';
  }
};

/**
 * Get orphan severity background color
 */
export const getOrphanSeverityBgColor = (severity: OrphanSeverity): string => {
  switch (severity) {
    case 'alert': return 'bg-yellow-100';
    case 'critical': return 'bg-red-100';
  }
};

/**
 * Get orphan severity emoji
 */
export const getOrphanSeverityEmoji = (severity: OrphanSeverity): string => {
  switch (severity) {
    case 'alert': return '⚠️';
    case 'critical': return '❌';
  }
};

/**
 * Generate a quick fix report for orphan articles
 */
export const generateOrphanFixReport = (
  orphans: OrphanArticle[]
): { priority: 'high' | 'medium' | 'low'; slug: string; action: string }[] => {
  const fixes: { priority: 'high' | 'medium' | 'low'; slug: string; action: string }[] = [];

  for (const orphan of orphans) {
    if (orphan.severity === 'critical') {
      fixes.push({
        priority: 'high',
        slug: orphan.slug,
        action: `CRITICAL: ${orphan.reasons[0]}. ${orphan.suggestions[0] || 'Review article interlinking.'}`
      });
    } else {
      fixes.push({
        priority: orphan.linksReceived === 0 ? 'medium' : 'low',
        slug: orphan.slug,
        action: `${orphan.reasons[0]}. ${orphan.suggestions[0] || 'Add internal links.'}`
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  fixes.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return fixes;
};
