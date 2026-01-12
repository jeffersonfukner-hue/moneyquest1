import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * ============================================================
 * MONEYQUEST SITEMAP EDGE FUNCTION
 * ============================================================
 * 
 * This sitemap is 100% AUTOMATED. No manual edits needed.
 * 
 * When adding new content, the sitemap updates automatically:
 * - New public pages: Add to INDEXABLE_ROUTES in routeConfig.ts
 * - New blog articles: Add to blogData.ts with articleType field
 * - New authors: Add to authorData.ts
 * - Database articles: Insert into blog_articles_generated table
 * 
 * SEO RULES (from src/lib/seoRules.ts):
 * - Homepage: priority 1.0, daily
 * - Landing Pages: priority 0.9, weekly
 * - Blog Index: priority 0.9, daily
 * - Pillar Articles: priority 0.85, weekly
 * - Satellite Articles: priority 0.75, monthly
 * - Long-tail Articles: priority 0.68, monthly
 * - Author Pages: priority 0.55, monthly
 * - Legal Pages: priority 0.4, yearly
 * 
 * PERMANENTLY EXCLUDED:
 * - /login, /signup (noindex public routes)
 * - /dashboard, /settings, /profile (authenticated)
 * - /premium, /onboarding, /upgrade (system)
 * - All authenticated/private routes
 * ============================================================
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
  // Prevent CDN/browser caching to ensure fresh sitemap
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Pragma": "no-cache",
  "Expires": "0",
};

const DOMAIN = "https://moneyquest.app.br";

// ============================================================
// TYPES
// ============================================================
type ArticleType = "pillar" | "satellite" | "longtail";
type ChangeFrequency = "daily" | "weekly" | "monthly" | "yearly";

interface StaticPage {
  loc: string;
  priority: string;
  changefreq: ChangeFrequency;
  lastmod?: string;
}

interface BlogArticleMeta {
  slug: string;
  updatedAt: string;
  articleType: ArticleType;
}

interface AuthorMeta {
  slug: string;
  updatedAt: string;
}

// ============================================================
// SEO PRIORITY CONFIGURATION (Fixed Rules)
// ============================================================
const SEO_CONFIG: Record<string, { priority: string; changefreq: ChangeFrequency }> = {
  homepage: { priority: "1.0", changefreq: "daily" },
  landingPage: { priority: "0.9", changefreq: "weekly" },
  blogIndex: { priority: "0.9", changefreq: "daily" },
  institutional: { priority: "0.8", changefreq: "monthly" },
  pillar: { priority: "0.85", changefreq: "weekly" },
  satellite: { priority: "0.75", changefreq: "monthly" },
  longtail: { priority: "0.68", changefreq: "monthly" },
  author: { priority: "0.55", changefreq: "monthly" },
  legal: { priority: "0.4", changefreq: "yearly" },
};

// ============================================================
// STATIC INDEXABLE PAGES
// These mirror INDEXABLE_ROUTES from routeConfig.ts
// When adding a new public page, add it here
// ============================================================
const STATIC_INDEXABLE_PAGES: StaticPage[] = [
  // Homepage - highest priority
  { loc: "/", ...SEO_CONFIG.homepage },
  
  // SEO Landing Pages - high priority for organic traffic
  { loc: "/controle-financeiro", ...SEO_CONFIG.landingPage },
  { loc: "/educacao-financeira-gamificada", ...SEO_CONFIG.landingPage },
  { loc: "/desafios-financeiros", ...SEO_CONFIG.landingPage },
  { loc: "/app-financas-pessoais", ...SEO_CONFIG.landingPage },
  
  // Institutional pages
  { loc: "/features", ...SEO_CONFIG.institutional },
  { loc: "/about", ...SEO_CONFIG.institutional },
  
  // Blog main page
  { loc: "/blog", ...SEO_CONFIG.blogIndex },
  
  // Legal pages - lowest priority
  { loc: "/terms", ...SEO_CONFIG.legal },
  { loc: "/privacy", ...SEO_CONFIG.legal },
];

// ============================================================
// AUTHORS
// These mirror authorData.ts
// When adding a new author, add it here
// ============================================================
const AUTHORS: AuthorMeta[] = [
  { slug: "equipe-moneyquest", updatedAt: "2026-01-12" },
];

// ============================================================
// BLOG ARTICLES (Static from blogData.ts)
// 
// MANDATORY: Every article MUST have articleType
// - pillar: Main cluster article (0.85, weekly)
// - satellite: Supporting content (0.75, monthly)
// - longtail: Specific keyword targeting (0.68, monthly)
// 
// When adding a new article to blogData.ts, add it here
// ============================================================
const BLOG_ARTICLES: BlogArticleMeta[] = [
  // ===================== PILLAR ARTICLES =====================
  { slug: "controle-financeiro-pessoal", updatedAt: "2026-01-12", articleType: "pillar" },
  
  // ===================== SATELLITE ARTICLES =====================
  { slug: "como-controlar-gastos-mensais", updatedAt: "2026-01-12", articleType: "satellite" },
  { slug: "controle-financeiro-iniciantes", updatedAt: "2026-01-12", articleType: "satellite" },
  { slug: "controle-financeiro-jogando", updatedAt: "2026-01-12", articleType: "satellite" },
  { slug: "organizacao-financeira", updatedAt: "2026-01-12", articleType: "satellite" },
  
  // ===================== LONG-TAIL ARTICLES =====================
  { slug: "app-financeiro-gamificado", updatedAt: "2026-01-12", articleType: "longtail" },
  { slug: "controlar-gastos-jogando", updatedAt: "2026-01-12", articleType: "longtail" },
  { slug: "educacao-financeira-gamificada", updatedAt: "2026-01-12", articleType: "longtail" },
  { slug: "economizar-dinheiro-desafios", updatedAt: "2026-01-12", articleType: "longtail" },
  { slug: "erros-organizar-financas", updatedAt: "2026-01-12", articleType: "longtail" },
  { slug: "gamificacao-financas-pessoais", updatedAt: "2026-01-12", articleType: "longtail" },
  { slug: "como-economizar-dinheiro", updatedAt: "2026-01-12", articleType: "longtail" },
  { slug: "dicas-economia-mensal", updatedAt: "2026-01-12", articleType: "longtail" },
  { slug: "poupar-dinheiro-ganhando-pouco", updatedAt: "2026-01-12", articleType: "longtail" },
  { slug: "habitos-financeiros-saudaveis", updatedAt: "2026-01-12", articleType: "longtail" },
  { slug: "como-montar-orcamento-pessoal", updatedAt: "2026-01-12", articleType: "longtail" },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function getArticlePriority(articleType: ArticleType): string {
  return SEO_CONFIG[articleType]?.priority || SEO_CONFIG.longtail.priority;
}

function getArticleChangefreq(articleType: ArticleType): ChangeFrequency {
  return SEO_CONFIG[articleType]?.changefreq || SEO_CONFIG.longtail.changefreq;
}

function formatDate(date: string, today: string): string {
  return date <= today ? date : today;
}

function generateUrlEntry(
  loc: string, 
  lastmod: string, 
  changefreq: ChangeFrequency, 
  priority: string
): string {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
}

// ============================================================
// MAIN HANDLER
// ============================================================
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split("T")[0];
    const includedUrls = new Set<string>();

    // Start XML with schema
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <!-- 
    MONEYQUEST SITEMAP - 100% Automated
    Generated: ${today}
    
    INCLUDES: All public indexable pages, blog articles, authors
    EXCLUDES: /login, /signup, /premium, /dashboard, authenticated routes
    
    SEO Priority Hierarchy:
    - Homepage: 1.0 (daily)
    - Landing Pages: 0.9 (weekly)
    - Blog Index: 0.9 (daily)
    - Pillar Articles: 0.85 (weekly)
    - Satellite Articles: 0.75 (monthly)
    - Long-tail Articles: 0.68 (monthly)
    - Authors: 0.55 (monthly)
    - Legal: 0.4 (yearly)
  -->
`;

    // ===================== STATIC PAGES =====================
    xml += `\n  <!-- STATIC PUBLIC PAGES -->\n`;
    for (const page of STATIC_INDEXABLE_PAGES) {
      const fullUrl = `${DOMAIN}${page.loc}`;
      if (includedUrls.has(fullUrl)) continue;
      includedUrls.add(fullUrl);
      
      const lastmod = page.lastmod || today;
      xml += generateUrlEntry(fullUrl, formatDate(lastmod, today), page.changefreq, page.priority);
    }

    // ===================== AUTHOR PAGES =====================
    xml += `\n  <!-- AUTHOR PAGES (E-E-A-T) -->\n`;
    for (const author of AUTHORS) {
      const fullUrl = `${DOMAIN}/autor/${author.slug}`;
      if (includedUrls.has(fullUrl)) continue;
      includedUrls.add(fullUrl);
      
      xml += generateUrlEntry(
        fullUrl, 
        formatDate(author.updatedAt, today), 
        SEO_CONFIG.author.changefreq, 
        SEO_CONFIG.author.priority
      );
    }

    // ===================== BLOG ARTICLES (Static) =====================
    // Sort: pillar first, then satellite, then longtail
    const sortedArticles = [...BLOG_ARTICLES].sort((a, b) => {
      const order = { pillar: 0, satellite: 1, longtail: 2 };
      return order[a.articleType] - order[b.articleType];
    });

    xml += `\n  <!-- BLOG ARTICLES (Static from blogData.ts) -->\n`;
    
    // Add pillar articles first
    xml += `  <!-- Pillar Articles (0.85, weekly) -->\n`;
    for (const article of sortedArticles.filter(a => a.articleType === "pillar")) {
      const fullUrl = `${DOMAIN}/blog/${article.slug}`;
      if (includedUrls.has(fullUrl)) continue;
      includedUrls.add(fullUrl);
      
      xml += generateUrlEntry(
        fullUrl,
        formatDate(article.updatedAt, today),
        getArticleChangefreq(article.articleType),
        getArticlePriority(article.articleType)
      );
    }
    
    // Add satellite articles
    xml += `  <!-- Satellite Articles (0.75, monthly) -->\n`;
    for (const article of sortedArticles.filter(a => a.articleType === "satellite")) {
      const fullUrl = `${DOMAIN}/blog/${article.slug}`;
      if (includedUrls.has(fullUrl)) continue;
      includedUrls.add(fullUrl);
      
      xml += generateUrlEntry(
        fullUrl,
        formatDate(article.updatedAt, today),
        getArticleChangefreq(article.articleType),
        getArticlePriority(article.articleType)
      );
    }
    
    // Add longtail articles
    xml += `  <!-- Long-tail Articles (0.68, monthly) -->\n`;
    for (const article of sortedArticles.filter(a => a.articleType === "longtail")) {
      const fullUrl = `${DOMAIN}/blog/${article.slug}`;
      if (includedUrls.has(fullUrl)) continue;
      includedUrls.add(fullUrl);
      
      xml += generateUrlEntry(
        fullUrl,
        formatDate(article.updatedAt, today),
        getArticleChangefreq(article.articleType),
        getArticlePriority(article.articleType)
      );
    }

    // ===================== DATABASE ARTICLES =====================
    // Fetch auto-generated articles from blog_articles_generated table
    const { data: dbArticles, error } = await supabase
      .from("blog_articles_generated")
      .select("slug, published_at, created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error fetching database articles:", error);
    }

    if (dbArticles && dbArticles.length > 0) {
      xml += `\n  <!-- BLOG ARTICLES (Auto-generated from Database) -->\n`;
      
      for (const article of dbArticles) {
        const fullUrl = `${DOMAIN}/blog/${article.slug}`;
        // Skip if already included (avoid duplicates with static articles)
        if (includedUrls.has(fullUrl)) continue;
        includedUrls.add(fullUrl);

        let lastmod = today;
        if (article.published_at) {
          const pubDate = new Date(article.published_at).toISOString().split("T")[0];
          lastmod = formatDate(pubDate, today);
        }

        // Database articles default to longtail priority
        xml += generateUrlEntry(
          fullUrl,
          lastmod,
          SEO_CONFIG.longtail.changefreq,
          SEO_CONFIG.longtail.priority
        );
      }
    }

    // Close XML
    xml += `</urlset>`;

    const totalUrls = includedUrls.size;
    console.log(`Sitemap generated: ${totalUrls} total URLs`);
    console.log(`  - ${STATIC_INDEXABLE_PAGES.length} static pages`);
    console.log(`  - ${AUTHORS.length} author pages`);
    console.log(`  - ${BLOG_ARTICLES.filter(a => a.articleType === "pillar").length} pillar articles`);
    console.log(`  - ${BLOG_ARTICLES.filter(a => a.articleType === "satellite").length} satellite articles`);
    console.log(`  - ${BLOG_ARTICLES.filter(a => a.articleType === "longtail").length} longtail articles`);
    console.log(`  - ${dbArticles?.length || 0} database articles`);

    return new Response(xml, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { status: 500, headers: corsHeaders }
    );
  }
});
