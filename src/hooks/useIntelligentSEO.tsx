/**
 * ============================================================
 * MONEYQUEST INTELLIGENT SEO SYSTEM HOOK
 * ============================================================
 * 
 * Main hook that integrates:
 * - SEO Scoring
 * - Auto-interlinking
 * - Orphan Detection
 * - Content Suggestions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { blogArticles, BlogArticle } from '@/lib/blogData';
import { 
  calculateSEOScore, 
  SEOScore, 
  ArticleForScoring 
} from '@/lib/seoScoring';
import { 
  analyzeInterlinking, 
  InterlinkingAnalysis,
  generateRelatedArticles,
  ArticleForInterlinking
} from '@/lib/seoInterlinking';
import { 
  detectOrphanArticles, 
  OrphanAnalysisReport,
  ArticleForOrphanCheck
} from '@/lib/seoOrphanDetection';
import { 
  analyzeContentGaps, 
  ContentGapAnalysis,
  ArticleForSuggestions
} from '@/lib/seoContentSuggestions';
import { ArticleType } from '@/lib/seoRules';

export interface ArticleSEOAnalysis {
  slug: string;
  title: string;
  articleType: ArticleType;
  category: string;
  score: SEOScore;
  interlinking: InterlinkingAnalysis;
  suggestedRelated: ArticleForInterlinking[];
}

export interface IntelligentSEOReport {
  timestamp: string;
  isLoading: boolean;
  error: string | null;
  
  // Article scores
  articleScores: ArticleSEOAnalysis[];
  averageScore: number;
  excellentCount: number;
  goodCount: number;
  attentionCount: number;
  criticalCount: number;
  
  // Orphan analysis
  orphanReport: OrphanAnalysisReport | null;
  
  // Content suggestions
  contentGaps: ContentGapAnalysis | null;
  
  // Summary
  overallHealth: 'excellent' | 'good' | 'attention' | 'critical';
}

/**
 * Convert BlogArticle to unified format
 */
const toUnifiedArticle = (article: BlogArticle): ArticleForScoring & ArticleForInterlinking & ArticleForOrphanCheck & ArticleForSuggestions => ({
  slug: article.slug,
  title: article.title,
  metaTitle: article.metaTitle,
  metaDescription: article.metaDescription,
  articleType: article.articleType,
  category: article.category,
  content: article.content,
  relatedSlugs: article.relatedSlugs,
  internalLinks: article.internalLinks,
  hasCanonical: true,
  inSitemap: true,
});

/**
 * Convert database article to unified format
 */
const dbToUnifiedArticle = (article: {
  slug: string;
  title: string;
  category: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  related_slugs?: string[];
}): ArticleForScoring & ArticleForInterlinking & ArticleForOrphanCheck & ArticleForSuggestions => ({
  slug: article.slug,
  title: article.title,
  metaTitle: article.meta_title,
  metaDescription: article.meta_description,
  articleType: 'longtail', // Default for generated articles
  category: article.category,
  content: article.content,
  relatedSlugs: article.related_slugs || [],
  internalLinks: [],
  hasCanonical: true,
  inSitemap: true,
});

/**
 * Main hook for intelligent SEO analysis
 */
export const useIntelligentSEO = () => {
  const [report, setReport] = useState<IntelligentSEOReport>({
    timestamp: '',
    isLoading: true,
    error: null,
    articleScores: [],
    averageScore: 0,
    excellentCount: 0,
    goodCount: 0,
    attentionCount: 0,
    criticalCount: 0,
    orphanReport: null,
    contentGaps: null,
    overallHealth: 'attention',
  });

  const runAnalysis = useCallback(async () => {
    setReport(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 1. Get all articles (static + database)
      const staticArticles = blogArticles.map(toUnifiedArticle);

      // Fetch database articles
      const { data: dbArticles, error } = await supabase
        .from('blog_articles_generated')
        .select('slug, title, category, content, meta_title, meta_description, related_slugs')
        .eq('status', 'published');

      if (error) {
        console.warn('Failed to fetch database articles:', error);
      }

      const dynamicArticles = (dbArticles || []).map(dbToUnifiedArticle);

      // Combine and deduplicate by slug
      const slugSet = new Set<string>();
      const allArticles: (ArticleForScoring & ArticleForInterlinking & ArticleForOrphanCheck & ArticleForSuggestions)[] = [];

      for (const article of [...staticArticles, ...dynamicArticles]) {
        if (!slugSet.has(article.slug)) {
          slugSet.add(article.slug);
          allArticles.push(article);
        }
      }

      // 2. Calculate SEO scores for each article
      const articleScores: ArticleSEOAnalysis[] = [];
      let totalScore = 0;
      let excellentCount = 0;
      let goodCount = 0;
      let attentionCount = 0;
      let criticalCount = 0;

      for (const article of allArticles) {
        const score = calculateSEOScore(article, allArticles);
        const interlinking = analyzeInterlinking(article, allArticles);
        const suggestedRelated = generateRelatedArticles(article, allArticles);

        articleScores.push({
          slug: article.slug,
          title: article.title,
          articleType: article.articleType || 'longtail',
          category: article.category || 'controle-financeiro',
          score,
          interlinking,
          suggestedRelated,
        });

        totalScore += score.total;

        switch (score.classification) {
          case 'excellent': excellentCount++; break;
          case 'good': goodCount++; break;
          case 'attention': attentionCount++; break;
          case 'critical': criticalCount++; break;
        }
      }

      const averageScore = allArticles.length > 0 
        ? Math.round(totalScore / allArticles.length) 
        : 0;

      // 3. Orphan detection
      const orphanReport = detectOrphanArticles(allArticles);

      // 4. Content gap analysis
      const contentGaps = analyzeContentGaps(allArticles);

      // 5. Determine overall health
      let overallHealth: 'excellent' | 'good' | 'attention' | 'critical';
      if (averageScore >= 85 && criticalCount === 0 && orphanReport.criticalCount === 0) {
        overallHealth = 'excellent';
      } else if (averageScore >= 70 && criticalCount <= 2) {
        overallHealth = 'good';
      } else if (averageScore >= 55) {
        overallHealth = 'attention';
      } else {
        overallHealth = 'critical';
      }

      // Sort by score (lowest first for prioritization)
      articleScores.sort((a, b) => a.score.total - b.score.total);

      setReport({
        timestamp: new Date().toISOString(),
        isLoading: false,
        error: null,
        articleScores,
        averageScore,
        excellentCount,
        goodCount,
        attentionCount,
        criticalCount,
        orphanReport,
        contentGaps,
        overallHealth,
      });

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.group('🧠 INTELLIGENT SEO REPORT');
        console.log(`📊 Average Score: ${averageScore}/100`);
        console.log(`🏆 Excellent: ${excellentCount} | ✅ Good: ${goodCount} | ⚠️ Attention: ${attentionCount} | ❌ Critical: ${criticalCount}`);
        console.log(`👻 Orphan Articles: ${orphanReport.orphanCount} (${orphanReport.criticalCount} critical)`);
        console.log(`💡 Content Suggestions: ${contentGaps.suggestions.length}`);
        console.log(`🏥 Overall Health: ${overallHealth.toUpperCase()}`);
        console.groupEnd();
      }

    } catch (error) {
      console.error('SEO Analysis failed:', error);
      setReport(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  // Run analysis on mount
  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  return {
    ...report,
    refresh: runAnalysis,
  };
};

/**
 * Hook for single article SEO analysis
 */
export const useArticleSEO = (slug: string) => {
  const [analysis, setAnalysis] = useState<ArticleSEOAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const analyze = async () => {
      setIsLoading(true);

      try {
        // Get all articles for context
        const staticArticles = blogArticles.map(toUnifiedArticle);
        const { data: dbArticles } = await supabase
          .from('blog_articles_generated')
          .select('slug, title, category, content, meta_title, meta_description, related_slugs')
          .eq('status', 'published');

        const dynamicArticles = (dbArticles || []).map(dbToUnifiedArticle);
        
        const slugSet = new Set<string>();
        const allArticles: (ArticleForScoring & ArticleForInterlinking)[] = [];

        for (const article of [...staticArticles, ...dynamicArticles]) {
          if (!slugSet.has(article.slug)) {
            slugSet.add(article.slug);
            allArticles.push(article);
          }
        }

        // Find the target article
        const article = allArticles.find(a => a.slug === slug);
        
        if (article) {
          const score = calculateSEOScore(article, allArticles);
          const interlinking = analyzeInterlinking(article, allArticles);
          const suggestedRelated = generateRelatedArticles(article, allArticles);

          setAnalysis({
            slug: article.slug,
            title: article.title,
            articleType: article.articleType || 'longtail',
            category: article.category || 'controle-financeiro',
            score,
            interlinking,
            suggestedRelated,
          });
        }
      } catch (error) {
        console.error('Article SEO analysis failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      analyze();
    }
  }, [slug]);

  return { analysis, isLoading };
};

export default useIntelligentSEO;
