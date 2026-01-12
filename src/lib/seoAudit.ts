/**
 * ============================================================
 * MONEYQUEST SEO AUDIT SYSTEM - AUTOMATIC VALIDATION
 * ============================================================
 * 
 * This module provides automatic SEO auditing for:
 * - Canonical URL validation
 * - Indexation rules verification
 * - Sitemap presence checking
 * - Content hierarchy validation
 * - Internal linking policy compliance
 * - PWA/SPA navigation integrity
 * 
 * Runs automatically on:
 * - New article creation
 * - Article edits
 * - New public page addition
 * - Deploy/build time (via console logs)
 */

import { 
  SEO_PRIORITY_RULES,
  SITEMAP_EXCLUDED_ROUTES,
  INTERNAL_LINKING_RULES,
  CANONICAL_BASE_URL,
  isExcludedFromSitemap,
  getCanonicalUrl,
  isInternalLink,
  ArticleType,
  validateArticleType
} from './seoRules';
import { INDEXABLE_ROUTES, NOINDEX_PUBLIC_ROUTES, AUTHENTICATED_ROUTES } from './routeConfig';

// ============================================================
// TYPES
// ============================================================

export type AuditSeverity = 'error' | 'warning' | 'info' | 'success';

export interface AuditResult {
  id: string;
  severity: AuditSeverity;
  category: 'canonical' | 'indexation' | 'sitemap' | 'hierarchy' | 'linking' | 'pwa';
  url: string;
  message: string;
  suggestion?: string;
  details?: Record<string, unknown>;
}

export interface SEOAuditReport {
  timestamp: string;
  totalChecks: number;
  passed: number;
  warnings: number;
  errors: number;
  results: AuditResult[];
  summary: {
    canonical: { passed: number; failed: number };
    indexation: { passed: number; failed: number };
    sitemap: { passed: number; failed: number };
    hierarchy: { passed: number; failed: number };
    linking: { passed: number; failed: number };
    pwa: { passed: number; failed: number };
  };
}

export interface ArticleForAudit {
  slug: string;
  title: string;
  articleType?: ArticleType;
  category?: string;
  relatedSlugs?: string[];
  internalLinks?: { text: string; url: string }[];
  content?: string;
  updatedAt?: string;
}

// ============================================================
// CANONICAL VALIDATION
// ============================================================

/**
 * Validate canonical URL for a page
 */
export const validateCanonical = (
  pathname: string,
  currentCanonical?: string | null
): AuditResult => {
  const expectedCanonical = getCanonicalUrl(pathname);
  const id = `canonical-${pathname.replace(/\//g, '-')}`;

  // Check if canonical exists
  if (!currentCanonical) {
    return {
      id,
      severity: 'error',
      category: 'canonical',
      url: pathname,
      message: 'Missing canonical URL',
      suggestion: `Add canonical tag: <link rel="canonical" href="${expectedCanonical}" />`
    };
  }

  // Check if canonical is absolute
  if (!currentCanonical.startsWith('https://')) {
    return {
      id,
      severity: 'error',
      category: 'canonical',
      url: pathname,
      message: 'Canonical URL is not absolute',
      suggestion: `Change from "${currentCanonical}" to "${expectedCanonical}"`
    };
  }

  // Check if canonical points to preview or internal route
  if (
    currentCanonical.includes('preview') ||
    currentCanonical.includes('localhost') ||
    currentCanonical.includes('lovable')
  ) {
    return {
      id,
      severity: 'error',
      category: 'canonical',
      url: pathname,
      message: 'Canonical points to preview/internal URL',
      suggestion: `Change to production URL: "${expectedCanonical}"`
    };
  }

  // Check for query strings
  if (currentCanonical.includes('?')) {
    return {
      id,
      severity: 'warning',
      category: 'canonical',
      url: pathname,
      message: 'Canonical URL contains query string',
      suggestion: 'Remove query parameters from canonical URL'
    };
  }

  // Check if matches expected
  if (currentCanonical !== expectedCanonical) {
    return {
      id,
      severity: 'warning',
      category: 'canonical',
      url: pathname,
      message: `Canonical mismatch: expected "${expectedCanonical}", got "${currentCanonical}"`,
      suggestion: `Update canonical to: "${expectedCanonical}"`
    };
  }

  return {
    id,
    severity: 'success',
    category: 'canonical',
    url: pathname,
    message: 'Canonical URL is correct'
  };
};

// ============================================================
// INDEXATION VALIDATION
// ============================================================

/**
 * Validate indexation settings for a page
 */
export const validateIndexation = (
  pathname: string,
  hasNoIndex: boolean
): AuditResult => {
  const id = `indexation-${pathname.replace(/\//g, '-')}`;
  const isPublicIndexable = INDEXABLE_ROUTES.some(
    route => pathname === route || (route !== '/' && pathname.startsWith(`${route}/`))
  );
  const shouldBeNoIndex = isExcludedFromSitemap(pathname) || 
    NOINDEX_PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));

  // Blog pages should be indexable
  if (pathname.startsWith('/blog/') && hasNoIndex) {
    return {
      id,
      severity: 'error',
      category: 'indexation',
      url: pathname,
      message: 'Blog article incorrectly marked as noindex',
      suggestion: 'Remove noindex tag from blog articles'
    };
  }

  // Public pages should not have noindex
  if (isPublicIndexable && hasNoIndex) {
    return {
      id,
      severity: 'error',
      category: 'indexation',
      url: pathname,
      message: 'Public page incorrectly marked as noindex',
      suggestion: 'Remove noindex tag from public indexable pages'
    };
  }

  // Private pages should have noindex
  if (shouldBeNoIndex && !hasNoIndex) {
    return {
      id,
      severity: 'warning',
      category: 'indexation',
      url: pathname,
      message: 'Private/auth page missing noindex',
      suggestion: 'Add noindex tag to authenticated routes'
    };
  }

  return {
    id,
    severity: 'success',
    category: 'indexation',
    url: pathname,
    message: `Indexation correct: ${hasNoIndex ? 'noindex' : 'indexable'}`
  };
};

// ============================================================
// SITEMAP VALIDATION
// ============================================================

/**
 * Validate sitemap entry for a page
 */
export const validateSitemapEntry = (
  pathname: string,
  articleType?: ArticleType,
  sitemapEntries?: Set<string>
): AuditResult => {
  const id = `sitemap-${pathname.replace(/\//g, '-')}`;
  const isExcluded = isExcludedFromSitemap(pathname);

  // Check if should be excluded
  if (isExcluded) {
    if (sitemapEntries?.has(pathname)) {
      return {
        id,
        severity: 'error',
        category: 'sitemap',
        url: pathname,
        message: 'Excluded route found in sitemap',
        suggestion: 'Remove this route from sitemap generation'
      };
    }
    return {
      id,
      severity: 'success',
      category: 'sitemap',
      url: pathname,
      message: 'Correctly excluded from sitemap'
    };
  }

  // Public pages should be in sitemap
  const isPublic = INDEXABLE_ROUTES.some(
    route => pathname === route || (route !== '/' && pathname.startsWith(`${route}/`))
  ) || pathname.startsWith('/blog/') || pathname.startsWith('/autor/');

  if (isPublic && sitemapEntries && !sitemapEntries.has(pathname)) {
    return {
      id,
      severity: 'error',
      category: 'sitemap',
      url: pathname,
      message: 'Public page missing from sitemap',
      suggestion: 'Add this page to sitemap generation sources'
    };
  }

  // Validate priority matches article type
  if (articleType) {
    const expectedConfig = SEO_PRIORITY_RULES[articleType];
    if (!expectedConfig) {
      return {
        id,
        severity: 'warning',
        category: 'sitemap',
        url: pathname,
        message: `Unknown articleType: ${articleType}`,
        suggestion: 'Use pillar, satellite, or longtail'
      };
    }
  }

  return {
    id,
    severity: 'success',
    category: 'sitemap',
    url: pathname,
    message: 'Sitemap entry is correct'
  };
};

// ============================================================
// CONTENT HIERARCHY VALIDATION
// ============================================================

/**
 * Validate article content hierarchy
 */
export const validateContentHierarchy = (
  article: ArticleForAudit,
  allArticles: ArticleForAudit[]
): AuditResult[] => {
  const results: AuditResult[] = [];
  const baseId = `hierarchy-${article.slug}`;

  // Check articleType exists
  if (!article.articleType) {
    results.push({
      id: `${baseId}-missing-type`,
      severity: 'error',
      category: 'hierarchy',
      url: `/blog/${article.slug}`,
      message: 'Article missing articleType field',
      suggestion: 'Add articleType: "pillar" | "satellite" | "longtail"'
    });
    return results;
  }

  const validatedType = validateArticleType(article.articleType);
  const pillarSlug = INTERNAL_LINKING_RULES.mainPillarSlug;

  // Satellite/longtail must link to pillar
  if (validatedType !== 'pillar') {
    const hasPillarLink = article.internalLinks?.some(
      link => link.url.includes(pillarSlug) || link.url.includes('controle-financeiro-pessoal')
    ) || article.content?.includes(pillarSlug);

    if (!hasPillarLink) {
      results.push({
        id: `${baseId}-no-pillar-link`,
        severity: 'error',
        category: 'hierarchy',
        url: `/blog/${article.slug}`,
        message: `${validatedType} article has no link to pillar article`,
        suggestion: `Add contextual link to /blog/${pillarSlug} in first paragraphs`
      });
    }
  }

  // Pillar should have satellites linking to it
  if (validatedType === 'pillar') {
    const satellites = allArticles.filter(
      a => a.articleType === 'satellite' || a.articleType === 'longtail'
    );
    const linkingToThis = satellites.filter(
      a => a.internalLinks?.some(link => link.url.includes(article.slug)) ||
           a.relatedSlugs?.includes(article.slug) ||
           a.content?.includes(article.slug)
    );

    if (linkingToThis.length === 0) {
      results.push({
        id: `${baseId}-no-satellites`,
        severity: 'warning',
        category: 'hierarchy',
        url: `/blog/${article.slug}`,
        message: 'Pillar article has no satellite articles linking to it',
        suggestion: 'Create satellite articles that link to this pillar'
      });
    }
  }

  // Check related articles count
  if (article.relatedSlugs && article.relatedSlugs.length > INTERNAL_LINKING_RULES.maxRelatedArticles) {
    results.push({
      id: `${baseId}-too-many-related`,
      severity: 'warning',
      category: 'hierarchy',
      url: `/blog/${article.slug}`,
      message: `Too many related articles (${article.relatedSlugs.length}/${INTERNAL_LINKING_RULES.maxRelatedArticles})`,
      suggestion: `Reduce to maximum ${INTERNAL_LINKING_RULES.maxRelatedArticles} related articles`
    });
  }

  if (results.length === 0) {
    results.push({
      id: `${baseId}-ok`,
      severity: 'success',
      category: 'hierarchy',
      url: `/blog/${article.slug}`,
      message: 'Content hierarchy is correct'
    });
  }

  return results;
};

// ============================================================
// INTERNAL LINKING VALIDATION
// ============================================================

/**
 * Validate internal linking policy
 */
export const validateInternalLinking = (
  content: string,
  pathname: string
): AuditResult[] => {
  const results: AuditResult[] = [];
  const baseId = `linking-${pathname.replace(/\//g, '-')}`;

  // Extract all links from content
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  const links: { url: string; hasBlank: boolean }[] = [];

  // HTML links
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[1];
    const hasBlank = match[0].includes('target="_blank"') || match[0].includes("target='_blank'");
    links.push({ url, hasBlank });
  }

  // Markdown links
  while ((match = markdownLinkRegex.exec(content)) !== null) {
    links.push({ url: match[2], hasBlank: false });
  }

  let internalErrors = 0;
  let externalErrors = 0;

  for (const link of links) {
    const isInternal = isInternalLink(link.url);

    // Internal links should NOT have target="_blank"
    if (isInternal && link.hasBlank) {
      internalErrors++;
    }

    // External links SHOULD have target="_blank"
    if (!isInternal && !link.url.startsWith('#') && !link.hasBlank) {
      externalErrors++;
    }
  }

  if (internalErrors > 0) {
    results.push({
      id: `${baseId}-internal-blank`,
      severity: 'error',
      category: 'linking',
      url: pathname,
      message: `${internalErrors} internal link(s) incorrectly use target="_blank"`,
      suggestion: 'Remove target="_blank" from internal links for PWA compatibility'
    });
  }

  if (externalErrors > 0) {
    results.push({
      id: `${baseId}-external-no-blank`,
      severity: 'warning',
      category: 'linking',
      url: pathname,
      message: `${externalErrors} external link(s) missing target="_blank"`,
      suggestion: 'Add target="_blank" rel="noopener noreferrer" to external links'
    });
  }

  if (results.length === 0) {
    results.push({
      id: `${baseId}-ok`,
      severity: 'success',
      category: 'linking',
      url: pathname,
      message: 'Internal linking policy is correct'
    });
  }

  return results;
};

// ============================================================
// PWA/SPA VALIDATION
// ============================================================

/**
 * Validate PWA/SPA navigation integrity
 */
export const validatePWANavigation = (
  pathname: string,
  hasServiceWorker: boolean = true
): AuditResult => {
  const id = `pwa-${pathname.replace(/\//g, '-')}`;

  // Blog routes should work in PWA
  if (pathname.startsWith('/blog/')) {
    return {
      id,
      severity: 'success',
      category: 'pwa',
      url: pathname,
      message: 'PWA navigation configured for blog routes'
    };
  }

  // Check if it's an authenticated route with PWA support
  const isAuthRoute = AUTHENTICATED_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAuthRoute && !hasServiceWorker) {
    return {
      id,
      severity: 'warning',
      category: 'pwa',
      url: pathname,
      message: 'Authenticated route may not work offline',
      suggestion: 'Ensure service worker caches necessary assets'
    };
  }

  return {
    id,
    severity: 'success',
    category: 'pwa',
    url: pathname,
    message: 'PWA navigation is configured correctly'
  };
};

// ============================================================
// FULL AUDIT RUNNER
// ============================================================

/**
 * Run complete SEO audit for an article
 */
export const auditArticle = (
  article: ArticleForAudit,
  allArticles: ArticleForAudit[],
  options: {
    checkCanonical?: string | null;
    hasNoIndex?: boolean;
    sitemapEntries?: Set<string>;
  } = {}
): AuditResult[] => {
  const pathname = `/blog/${article.slug}`;
  const results: AuditResult[] = [];

  // Canonical validation
  results.push(validateCanonical(pathname, options.checkCanonical ?? getCanonicalUrl(pathname)));

  // Indexation validation
  results.push(validateIndexation(pathname, options.hasNoIndex ?? false));

  // Sitemap validation
  results.push(validateSitemapEntry(pathname, article.articleType, options.sitemapEntries));

  // Hierarchy validation
  results.push(...validateContentHierarchy(article, allArticles));

  // Linking validation
  if (article.content) {
    results.push(...validateInternalLinking(article.content, pathname));
  }

  // PWA validation
  results.push(validatePWANavigation(pathname));

  return results;
};

/**
 * Run complete SEO audit for all articles
 */
export const auditAllArticles = (
  articles: ArticleForAudit[],
  sitemapEntries?: Set<string>
): SEOAuditReport => {
  const allResults: AuditResult[] = [];

  for (const article of articles) {
    allResults.push(...auditArticle(article, articles, { sitemapEntries }));
  }

  // Generate summary
  const summary = {
    canonical: { passed: 0, failed: 0 },
    indexation: { passed: 0, failed: 0 },
    sitemap: { passed: 0, failed: 0 },
    hierarchy: { passed: 0, failed: 0 },
    linking: { passed: 0, failed: 0 },
    pwa: { passed: 0, failed: 0 }
  };

  let passed = 0;
  let warnings = 0;
  let errors = 0;

  for (const result of allResults) {
    if (result.severity === 'success') {
      passed++;
      summary[result.category].passed++;
    } else if (result.severity === 'warning') {
      warnings++;
      summary[result.category].failed++;
    } else if (result.severity === 'error') {
      errors++;
      summary[result.category].failed++;
    }
  }

  return {
    timestamp: new Date().toISOString(),
    totalChecks: allResults.length,
    passed,
    warnings,
    errors,
    results: allResults,
    summary
  };
};

/**
 * Generate console-friendly audit report
 */
export const logAuditReport = (report: SEOAuditReport): void => {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  console.group('🔍 SEO AUDIT REPORT');
  console.log(`📅 Timestamp: ${report.timestamp}`);
  console.log(`📊 Total Checks: ${report.totalChecks}`);
  console.log(`✅ Passed: ${report.passed}`);
  console.log(`⚠️ Warnings: ${report.warnings}`);
  console.log(`❌ Errors: ${report.errors}`);

  if (report.errors > 0) {
    console.group('❌ ERRORS');
    for (const result of report.results.filter(r => r.severity === 'error')) {
      console.error(`[${result.category.toUpperCase()}] ${result.url}`);
      console.error(`   → ${result.message}`);
      if (result.suggestion) {
        console.error(`   💡 ${result.suggestion}`);
      }
    }
    console.groupEnd();
  }

  if (report.warnings > 0) {
    console.group('⚠️ WARNINGS');
    for (const result of report.results.filter(r => r.severity === 'warning')) {
      console.warn(`[${result.category.toUpperCase()}] ${result.url}`);
      console.warn(`   → ${result.message}`);
      if (result.suggestion) {
        console.warn(`   💡 ${result.suggestion}`);
      }
    }
    console.groupEnd();
  }

  console.group('📋 SUMMARY BY CATEGORY');
  for (const [category, counts] of Object.entries(report.summary)) {
    const status = counts.failed === 0 ? '✅' : counts.failed > 2 ? '❌' : '⚠️';
    console.log(`${status} ${category}: ${counts.passed} passed, ${counts.failed} failed`);
  }
  console.groupEnd();

  console.groupEnd();
};

/**
 * Check if audit has critical errors that should block deploy
 */
export const hasBlockingErrors = (report: SEOAuditReport): boolean => {
  // Critical errors that should block:
  // 1. Public pages missing from sitemap
  // 2. Blog articles without articleType
  // 3. Canonical pointing to preview/localhost
  const blockingCategories = ['sitemap', 'hierarchy', 'canonical'];
  
  return report.results.some(
    r => r.severity === 'error' && blockingCategories.includes(r.category)
  );
};

/**
 * Get blocking errors for display
 */
export const getBlockingErrors = (report: SEOAuditReport): AuditResult[] => {
  const blockingCategories = ['sitemap', 'hierarchy', 'canonical'];
  return report.results.filter(
    r => r.severity === 'error' && blockingCategories.includes(r.category)
  );
};
