/**
 * SEO Audit Hook
 * 
 * Provides automatic SEO auditing for:
 * - Article creation/editing
 * - Public page changes
 * - Deploy-time validation
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  auditArticle, 
  auditAllArticles, 
  logAuditReport, 
  hasBlockingErrors,
  getBlockingErrors,
  ArticleForAudit,
  SEOAuditReport,
  AuditResult
} from '@/lib/seoAudit';
import { blogArticles, BlogArticle } from '@/lib/blogData';
import { supabase } from '@/integrations/supabase/client';

interface UseSEOAuditOptions {
  /** Run audit on mount */
  runOnMount?: boolean;
  /** Auto-run when route changes */
  watchRoutes?: boolean;
  /** Include database articles */
  includeDatabase?: boolean;
  /** Log results to console */
  logToConsole?: boolean;
}

interface UseSEOAuditReturn {
  /** Run full audit */
  runFullAudit: () => Promise<SEOAuditReport>;
  /** Audit single article */
  auditSingleArticle: (article: ArticleForAudit) => AuditResult[];
  /** Last audit report */
  lastReport: SEOAuditReport | null;
  /** Is audit running */
  isAuditing: boolean;
  /** Has blocking errors */
  hasErrors: boolean;
  /** Blocking errors list */
  blockingErrors: AuditResult[];
}

/**
 * Convert BlogArticle to ArticleForAudit
 */
const toAuditArticle = (article: BlogArticle): ArticleForAudit => ({
  slug: article.slug,
  title: article.title,
  articleType: article.articleType,
  category: article.category,
  relatedSlugs: article.relatedSlugs,
  internalLinks: article.internalLinks,
  content: article.content,
  updatedAt: article.updatedAt
});

/**
 * Hook for SEO auditing
 */
export const useSEOAudit = (options: UseSEOAuditOptions = {}): UseSEOAuditReturn => {
  const {
    runOnMount = false,
    watchRoutes = false,
    includeDatabase = true,
    logToConsole = true
  } = options;

  const location = useLocation();
  const lastReportRef = useRef<SEOAuditReport | null>(null);
  const isAuditingRef = useRef(false);
  const blockingErrorsRef = useRef<AuditResult[]>([]);

  /**
   * Fetch articles from database
   */
  const fetchDatabaseArticles = useCallback(async (): Promise<ArticleForAudit[]> => {
    if (!includeDatabase) return [];

    try {
      const { data, error } = await supabase
        .from('blog_articles_generated')
        .select('slug, title, category, meta_title, meta_description, content, related_slugs, internal_links, created_at')
        .eq('status', 'published');

      if (error) {
        console.error('Error fetching database articles for audit:', error);
        return [];
      }

      return (data || []).map(article => ({
        slug: article.slug,
        title: article.title,
        articleType: 'longtail' as const, // Default for generated articles
        category: article.category,
        relatedSlugs: article.related_slugs || [],
        internalLinks: (article.internal_links as { text: string; url: string }[] | null) || [],
        content: article.content,
        updatedAt: article.created_at
      }));
    } catch (err) {
      console.error('Failed to fetch database articles:', err);
      return [];
    }
  }, [includeDatabase]);

  /**
   * Run full SEO audit
   */
  const runFullAudit = useCallback(async (): Promise<SEOAuditReport> => {
    isAuditingRef.current = true;

    try {
      // Collect all articles
      const staticArticles = blogArticles.map(toAuditArticle);
      const dbArticles = await fetchDatabaseArticles();
      const allArticles = [...staticArticles, ...dbArticles];

      // Run audit
      const report = auditAllArticles(allArticles);

      // Store results
      lastReportRef.current = report;
      blockingErrorsRef.current = getBlockingErrors(report);

      // Log if enabled
      if (logToConsole && process.env.NODE_ENV === 'development') {
        logAuditReport(report);
      }

      return report;
    } finally {
      isAuditingRef.current = false;
    }
  }, [fetchDatabaseArticles, logToConsole]);

  /**
   * Audit single article
   */
  const auditSingleArticle = useCallback((article: ArticleForAudit): AuditResult[] => {
    const allArticles = blogArticles.map(toAuditArticle);
    return auditArticle(article, allArticles);
  }, []);

  // Run on mount if enabled
  useEffect(() => {
    if (runOnMount) {
      runFullAudit();
    }
  }, [runOnMount, runFullAudit]);

  // Watch route changes if enabled
  useEffect(() => {
    if (watchRoutes && location.pathname.startsWith('/blog/')) {
      // Run audit for the current blog article
      const slug = location.pathname.replace('/blog/', '');
      const article = blogArticles.find(a => a.slug === slug);
      if (article) {
        const results = auditSingleArticle(toAuditArticle(article));
        
        if (logToConsole && process.env.NODE_ENV === 'development') {
          const errors = results.filter(r => r.severity === 'error');
          const warnings = results.filter(r => r.severity === 'warning');
          
          if (errors.length > 0 || warnings.length > 0) {
            console.group(`🔍 SEO Audit: ${slug}`);
            errors.forEach(e => console.error(`❌ ${e.message}`));
            warnings.forEach(w => console.warn(`⚠️ ${w.message}`));
            console.groupEnd();
          }
        }
      }
    }
  }, [location.pathname, watchRoutes, auditSingleArticle, logToConsole]);

  return {
    runFullAudit,
    auditSingleArticle,
    lastReport: lastReportRef.current,
    isAuditing: isAuditingRef.current,
    hasErrors: blockingErrorsRef.current.length > 0,
    blockingErrors: blockingErrorsRef.current
  };
};

/**
 * Hook to run audit on article save (for editors)
 */
export const useArticleSaveAudit = (onError?: (errors: AuditResult[]) => void) => {
  const { auditSingleArticle } = useSEOAudit({ logToConsole: true });

  const validateBeforeSave = useCallback((article: ArticleForAudit): boolean => {
    const results = auditSingleArticle(article);
    const errors = results.filter(r => r.severity === 'error');

    if (errors.length > 0) {
      console.error('🚫 SEO Audit failed - cannot save article');
      errors.forEach(e => console.error(`   ❌ ${e.message}`));
      
      if (onError) {
        onError(errors);
      }
      return false;
    }

    console.log('✅ SEO Audit passed - article can be saved');
    return true;
  }, [auditSingleArticle, onError]);

  return { validateBeforeSave };
};

export default useSEOAudit;
