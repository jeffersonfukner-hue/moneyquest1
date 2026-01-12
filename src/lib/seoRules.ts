/**
 * ============================================================
 * MONEYQUEST SEO RULES - PERMANENT CONFIGURATION
 * ============================================================
 * 
 * This file defines PERMANENT SEO rules for the MoneyQuest project.
 * These rules apply AUTOMATICALLY to all new pages and articles.
 * 
 * NO MANUAL SITEMAP EDITS SHOULD EVER BE NECESSARY.
 * 
 * ============================================================
 * RULE 1: SITEMAP AUTOMATION
 * ============================================================
 * 
 * Sources (in order of priority):
 * 1. Static public pages from INDEXABLE_ROUTES (routeConfig.ts)
 * 2. Blog articles from blogData.ts (static articles with articleType)
 * 3. Blog articles from database (blog_articles_generated table)
 * 4. Author pages from authorData.ts
 * 
 * The sitemap is generated dynamically by the Edge Function.
 * It reflects the current state of the app at request time.
 * 
 * ============================================================
 * RULE 2: SEO PRIORITY POLICY (FIXED)
 * ============================================================
 */

export type ArticleType = 'pillar' | 'satellite' | 'longtail';
export type ChangeFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface SEOPriorityConfig {
  priority: number;
  changefreq: ChangeFrequency;
}

/**
 * Fixed SEO priority configuration by page/article type
 * These values MUST be consistent across the entire project
 */
export const SEO_PRIORITY_RULES: Record<string, SEOPriorityConfig> = {
  // Homepage - highest priority
  homepage: { priority: 1.0, changefreq: 'daily' },
  
  // SEO Landing Pages - high priority for organic traffic
  landingPage: { priority: 0.9, changefreq: 'weekly' },
  
  // Blog main page
  blogIndex: { priority: 0.9, changefreq: 'daily' },
  
  // Article types (cluster hierarchy)
  pillar: { priority: 0.85, changefreq: 'weekly' },
  satellite: { priority: 0.75, changefreq: 'monthly' },
  longtail: { priority: 0.68, changefreq: 'monthly' },
  
  // Institutional pages
  institutional: { priority: 0.8, changefreq: 'monthly' },
  
  // Author pages - lower priority
  author: { priority: 0.55, changefreq: 'monthly' },
  
  // Legal pages - lowest priority
  legal: { priority: 0.4, changefreq: 'yearly' },
};

/**
 * Get SEO config for an article type
 */
export const getArticleSEOConfig = (articleType: ArticleType): SEOPriorityConfig => {
  return SEO_PRIORITY_RULES[articleType] || SEO_PRIORITY_RULES.longtail;
};

/**
 * ============================================================
 * RULE 3: PERMANENT EXCLUSIONS FROM SITEMAP
 * ============================================================
 * 
 * These routes are NEVER included in the sitemap:
 * - Authentication routes (/login, /signup)
 * - Dashboard and authenticated routes
 * - System/internal routes
 * - noindex routes
 */

export const SITEMAP_EXCLUDED_ROUTES = [
  // Authentication (noindex public routes)
  '/login',
  '/signup',
  '/auth',
  
  // Premium/payment related
  '/premium',
  '/upgrade',
  '/premium-success',
  
  // Authenticated app routes
  '/dashboard',
  '/settings',
  '/profile',
  '/onboarding',
  '/wallets',
  '/categories',
  '/goals',
  '/ai-coach',
  '/leaderboard',
  '/journal',
  '/quests',
  '/cash-flow',
  '/period-comparison',
  '/referral',
  '/notifications',
  '/support',
  '/my-messages',
  '/scheduled-transactions',
  '/suppliers',
  '/shop',
  
  // System routes
  '/r', // referral redirect
  '/select-language',
  '/debug-seo',
  '/debug-auth',
  '/debug-i18n',
  
  // Admin routes
  '/admin',
  '/super-admin',
] as const;

/**
 * Check if a route should be excluded from sitemap
 */
export const isExcludedFromSitemap = (pathname: string): boolean => {
  return SITEMAP_EXCLUDED_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
};

/**
 * ============================================================
 * RULE 4: INTERNAL LINKING POLICY
 * ============================================================
 * 
 * Satellite and long-tail articles MUST:
 * - Link to the corresponding pillar article
 * - Use contextual links in the first or second paragraph
 * 
 * "Related Articles" section:
 * - Pillar always appears first
 * - Maximum of 3 links
 * - Internal links ALWAYS open in the same tab
 */

export const INTERNAL_LINKING_RULES = {
  // Maximum number of related articles to show
  maxRelatedArticles: 3,
  
  // Pillar articles for each content cluster
  contentClusters: {
    'controle-financeiro': 'controle-financeiro-pessoal',
    'gamificacao': 'controle-financeiro-pessoal',
    'educacao-financeira': 'controle-financeiro-pessoal',
    'economia-dia-a-dia': 'controle-financeiro-pessoal',
    'desafios-financeiros': 'controle-financeiro-pessoal',
    'habitos-financeiros': 'controle-financeiro-pessoal',
  } as Record<string, string>,
  
  // Pillar slug for the main content cluster
  mainPillarSlug: 'controle-financeiro-pessoal',
};

/**
 * Get the pillar article for a given category
 */
export const getPillarForCategory = (category: string): string => {
  return INTERNAL_LINKING_RULES.contentClusters[category] || 
         INTERNAL_LINKING_RULES.mainPillarSlug;
};

/**
 * ============================================================
 * RULE 5: LINK BEHAVIOR
 * ============================================================
 * 
 * Internal links (relative paths or moneyquest.app.br domain):
 * - NO target="_blank"
 * - Open in the same tab (including PWA)
 * 
 * External links:
 * - Use target="_blank"
 * - Use rel="noopener noreferrer"
 */

export const DOMAIN = 'https://moneyquest.app.br';

export const isInternalLink = (url: string): boolean => {
  if (url.startsWith('/')) return true;
  if (url.startsWith(DOMAIN)) return true;
  if (url.startsWith('https://moneyquest.app.br')) return true;
  return false;
};

/**
 * ============================================================
 * RULE 6: TECHNICAL SEO REQUIREMENTS
 * ============================================================
 * 
 * All public pages MUST have:
 * - Correct absolute canonical URL
 * - Indexing enabled (no noindex for public pages)
 * - Breadcrumb JSON-LD when applicable
 * - Consistent SEO structure even in SPA/PWA
 * 
 * Blog content IS indexable.
 * Only private pages use noindex.
 */

export const CANONICAL_BASE_URL = 'https://moneyquest.app.br';

/**
 * Generate absolute canonical URL
 */
export const getCanonicalUrl = (pathname: string): string => {
  // Remove trailing slash except for root
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  return `${CANONICAL_BASE_URL}${cleanPath}`;
};

/**
 * ============================================================
 * RULE 7: ARTICLE CLASSIFICATION (MANDATORY)
 * ============================================================
 * 
 * Every article MUST have the field:
 *   articleType: "pillar" | "satellite" | "longtail"
 * 
 * This field is used for:
 * - Sitemap priority calculation
 * - Internal linking strategy
 * - SEO priority assignment
 * - Change frequency determination
 */

/**
 * Default article type for articles without explicit type
 */
export const DEFAULT_ARTICLE_TYPE: ArticleType = 'longtail';

/**
 * Validate that an article has the required articleType field
 */
export const validateArticleType = (articleType?: ArticleType): ArticleType => {
  if (!articleType || !['pillar', 'satellite', 'longtail'].includes(articleType)) {
    console.warn(`Article missing or invalid articleType, defaulting to '${DEFAULT_ARTICLE_TYPE}'`);
    return DEFAULT_ARTICLE_TYPE;
  }
  return articleType;
};

/**
 * ============================================================
 * RULE 8: CONTINUITY RULE (IMPORTANT)
 * ============================================================
 * 
 * These rules:
 * - Are NOT one-time configurations
 * - Do NOT depend on new prompts
 * - MUST be applied automatically to any new page or article
 * 
 * Whenever:
 * - A new article is created
 * - A new public page is added
 * - Content is modified
 * 
 * → The sitemap, SEO, and internal linking MUST adjust automatically.
 */

// Export all rules as a single object for documentation
export const SEO_RULES = {
  priorityRules: SEO_PRIORITY_RULES,
  excludedRoutes: SITEMAP_EXCLUDED_ROUTES,
  internalLinking: INTERNAL_LINKING_RULES,
  domain: DOMAIN,
  canonicalBaseUrl: CANONICAL_BASE_URL,
  defaultArticleType: DEFAULT_ARTICLE_TYPE,
};

export default SEO_RULES;
