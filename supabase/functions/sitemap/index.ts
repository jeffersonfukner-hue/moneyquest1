import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
  // Prevent CDN/browser caching of sitemap.xml to avoid serving stale URLs
  "Cache-Control": "no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Pragma": "no-cache",
};

const DOMAIN = "https://moneyquest.app.br";

/**
 * SEO SITEMAP POLICY - MoneyQuest
 * 
 * This sitemap includes ONLY public, indexable pages.
 * 
 * EXCLUDED (never in sitemap):
 * - /login, /signup (noindex public routes)
 * - /dashboard, /app/* (authenticated routes)
 * - /settings, /profile, /premium (private routes)
 * - /onboarding, /r/* (system routes)
 * 
 * PRIORITY HIERARCHY:
 * - Homepage: 1.0 (daily)
 * - SEO Landing Pages: 0.9 (weekly)
 * - Blog main: 0.9 (daily)
 * - Pillar articles: 0.85-0.9 (weekly)
 * - Satellite articles: 0.75 (monthly)
 * - Long-tail articles: 0.65-0.7 (monthly)
 * - Author pages: 0.5-0.6 (monthly)
 * - Legal pages: 0.4 (yearly)
 */

// Static pages that SHOULD be indexed (matching routeConfig.ts INDEXABLE_ROUTES)
const staticPages = [
  // Homepage - highest priority
  { loc: "/", priority: "1.0", changefreq: "daily" },
  
  // SEO Landing Pages - high priority for organic traffic
  { loc: "/controle-financeiro", priority: "0.9", changefreq: "weekly" },
  { loc: "/educacao-financeira-gamificada", priority: "0.9", changefreq: "weekly" },
  { loc: "/desafios-financeiros", priority: "0.9", changefreq: "weekly" },
  { loc: "/app-financas-pessoais", priority: "0.9", changefreq: "weekly" },
  
  // Features & Info (public indexable pages)
  { loc: "/features", priority: "0.8", changefreq: "weekly" },
  { loc: "/about", priority: "0.8", changefreq: "monthly" },
  
  // Blog main page
  { loc: "/blog", priority: "0.9", changefreq: "daily" },
  
  // Author pages - lower priority
  { loc: "/autor/equipe-moneyquest", priority: "0.55", changefreq: "monthly" },
  
  // Legal pages - lowest priority
  { loc: "/terms", priority: "0.4", changefreq: "yearly" },
  { loc: "/privacy", priority: "0.4", changefreq: "yearly" },
];

/**
 * Complete list of blog articles from blogData.ts
 * These are automatically included in the sitemap
 * 
 * Article Types:
 * - pillar: Main cluster article (priority 0.85, changefreq weekly)
 * - satellite: Supporting cluster article (priority 0.75, changefreq monthly)
 * - longtail: Long-tail keyword article (priority 0.68, changefreq monthly)
 */
interface BlogArticleMeta {
  slug: string;
  updatedAt: string;
  articleType: 'pillar' | 'satellite' | 'longtail';
}

// All blog articles with their types and last update dates
// This list is the source of truth for sitemap blog entries
const blogArticles: BlogArticleMeta[] = [
  // PILLAR ARTICLES (cluster centers)
  { slug: 'controle-financeiro-pessoal', updatedAt: '2026-01-11', articleType: 'pillar' },
  
  // SATELLITE ARTICLES (supporting cluster content)
  { slug: 'como-controlar-gastos-mensais', updatedAt: '2026-01-12', articleType: 'satellite' },
  { slug: 'controle-financeiro-iniciantes', updatedAt: '2026-01-03', articleType: 'satellite' },
  { slug: 'controle-financeiro-jogando', updatedAt: '2026-01-12', articleType: 'satellite' },
  { slug: 'organizacao-financeira', updatedAt: '2026-01-03', articleType: 'satellite' },
  
  // LONG-TAIL ARTICLES
  { slug: 'app-financeiro-gamificado', updatedAt: '2026-01-03', articleType: 'longtail' },
  { slug: 'controlar-gastos-jogando', updatedAt: '2026-01-03', articleType: 'longtail' },
  { slug: 'educacao-financeira-gamificada', updatedAt: '2026-01-03', articleType: 'longtail' },
  { slug: 'economizar-dinheiro-desafios', updatedAt: '2026-01-03', articleType: 'longtail' },
  { slug: 'erros-organizar-financas', updatedAt: '2026-01-03', articleType: 'longtail' },
  { slug: 'gamificacao-financas-pessoais', updatedAt: '2026-01-03', articleType: 'longtail' },
  { slug: 'como-economizar-dinheiro', updatedAt: '2026-01-03', articleType: 'longtail' },
  { slug: 'dicas-economia-mensal', updatedAt: '2026-01-03', articleType: 'longtail' },
  { slug: 'poupar-dinheiro-ganhando-pouco', updatedAt: '2026-01-03', articleType: 'longtail' },
  { slug: 'habitos-financeiros-saudaveis', updatedAt: '2026-01-03', articleType: 'longtail' },
  { slug: 'como-montar-orcamento-pessoal', updatedAt: '2026-01-03', articleType: 'longtail' },
];

/**
 * Get SEO priority based on article type
 */
function getArticlePriority(articleType: 'pillar' | 'satellite' | 'longtail'): string {
  switch (articleType) {
    case 'pillar':
      return '0.85';
    case 'satellite':
      return '0.75';
    case 'longtail':
    default:
      return '0.68';
  }
}

/**
 * Get change frequency based on article type
 */
function getArticleChangefreq(articleType: 'pillar' | 'satellite' | 'longtail'): string {
  switch (articleType) {
    case 'pillar':
      return 'weekly';
    case 'satellite':
    case 'longtail':
    default:
      return 'monthly';
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch additional published articles from database (auto-generated)
    const { data: dbArticles, error } = await supabase
      .from("blog_articles_generated")
      .select("slug, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error fetching articles:", error);
    }

    const today = new Date().toISOString().split("T")[0];

    // Track slugs to prevent duplicates
    const includedSlugs = new Set<string>();

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  
  <!-- 
    MONEYQUEST SITEMAP - SEO Policy
    
    INCLUDES ONLY:
    - Public indexable pages
    - Blog articles (pillar, satellite, long-tail)
    - Author pages
    
    EXCLUDES:
    - /login, /signup (noindex)
    - /dashboard, /settings, /profile (authenticated)
    - /onboarding, /premium (system/private)
    
    Last generated: ${today}
  -->
`;

    // Add static pages
    xml += `
  <!-- STATIC PUBLIC PAGES -->
`;
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${DOMAIN}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add blog articles from blogData.ts (static list)
    xml += `
  <!-- BLOG ARTICLES (from blogData.ts) -->
`;
    
    // Sort articles: pillar first, then satellite, then longtail
    const sortedArticles = [...blogArticles].sort((a, b) => {
      const typeOrder = { pillar: 0, satellite: 1, longtail: 2 };
      return typeOrder[a.articleType] - typeOrder[b.articleType];
    });

    for (const article of sortedArticles) {
      // Skip if already included
      if (includedSlugs.has(article.slug)) continue;
      includedSlugs.add(article.slug);

      const priority = getArticlePriority(article.articleType);
      const changefreq = getArticleChangefreq(article.articleType);
      
      // Use article's updatedAt or today (whichever is earlier)
      const lastmod = article.updatedAt <= today ? article.updatedAt : today;

      xml += `  <url>
    <loc>${DOMAIN}/blog/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
    }

    // Add database articles (auto-generated articles)
    if (dbArticles && dbArticles.length > 0) {
      xml += `
  <!-- DATABASE BLOG ARTICLES (Auto-generated) -->
`;
      for (const article of dbArticles) {
        // Skip if already included from static list
        if (includedSlugs.has(article.slug)) continue;
        includedSlugs.add(article.slug);

        // Ensure lastmod is never in the future
        let lastmod = today;
        if (article.published_at) {
          const publishedDate = new Date(article.published_at).toISOString().split("T")[0];
          lastmod = publishedDate <= today ? publishedDate : today;
        }
        
        xml += `  <url>
    <loc>${DOMAIN}/blog/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.68</priority>
  </url>
`;
      }
    }

    xml += `
</urlset>`;

    console.log(`Sitemap generated with ${includedSlugs.size} blog articles and ${staticPages.length} static pages`);

    return new Response(xml, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { status: 500, headers: corsHeaders }
    );
  }
});
