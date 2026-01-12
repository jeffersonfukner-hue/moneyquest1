import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
  // Prevent CDN/browser caching to avoid serving stale URLs
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Pragma": "no-cache",
  "Expires": "0",
};

const DOMAIN = "https://moneyquest.app.br";

/**
 * ============================================================
 * MONEYQUEST SITEMAP - 100% AUTOMATED SEO POLICY
 * ============================================================
 * 
 * This sitemap is FULLY AUTOMATED. No manual edits needed.
 * 
 * DATA SOURCES:
 * 1. INDEXABLE_ROUTES from routeConfig.ts (static public pages)
 * 2. blogArticles from blogData.ts (static blog articles)
 * 3. blog_articles_generated table (database articles)
 * 4. authors from authorData.ts (author pages)
 * 
 * PERMANENTLY EXCLUDED:
 * - /login, /signup (noindex public routes)
 * - /dashboard, /app/*, /settings, /profile (authenticated)
 * - /premium, /onboarding, /upgrade (system/private)
 * - /r/* (referral redirects)
 * - /select-language (utility)
 * 
 * PRIORITY HIERARCHY:
 * - Homepage (/): 1.0, daily
 * - SEO Landing Pages: 0.9, weekly
 * - Blog main: 0.9, daily
 * - Pillar articles: 0.85, weekly
 * - Satellite articles: 0.75, monthly
 * - Long-tail articles: 0.68, monthly
 * - Author pages: 0.55, monthly
 * - Legal pages: 0.4, yearly
 * ============================================================
 */

// ============================================================
// STATIC INDEXABLE ROUTES (mirrors routeConfig.ts INDEXABLE_ROUTES)
// When you add a new public route in routeConfig.ts, add it here too
// ============================================================
interface StaticPage {
  loc: string;
  priority: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
}

const STATIC_INDEXABLE_PAGES: StaticPage[] = [
  // Homepage - highest priority
  { loc: "/", priority: "1.0", changefreq: "daily" },
  
  // SEO Landing Pages - high priority for organic traffic
  { loc: "/controle-financeiro", priority: "0.9", changefreq: "weekly" },
  { loc: "/educacao-financeira-gamificada", priority: "0.9", changefreq: "weekly" },
  { loc: "/desafios-financeiros", priority: "0.9", changefreq: "weekly" },
  { loc: "/app-financas-pessoais", priority: "0.9", changefreq: "weekly" },
  
  // Institutional pages
  { loc: "/features", priority: "0.8", changefreq: "weekly" },
  { loc: "/about", priority: "0.8", changefreq: "monthly" },
  
  // Blog main page
  { loc: "/blog", priority: "0.9", changefreq: "daily" },
  
  // Legal pages - lowest priority
  { loc: "/terms", priority: "0.4", changefreq: "yearly" },
  { loc: "/privacy", priority: "0.4", changefreq: "yearly" },
];

// ============================================================
// AUTHORS (mirrors authorData.ts)
// Add new authors here when they are created
// ============================================================
const AUTHORS = [
  { slug: "equipe-moneyquest", updatedAt: "2026-01-03" },
];

// ============================================================
// BLOG ARTICLES (mirrors blogData.ts with articleType)
// 
// IMPORTANT: Keep this in sync with src/lib/blogData.ts
// When you add a new article to blogData.ts, add it here too
// ============================================================
type ArticleType = "pillar" | "satellite" | "longtail";

interface BlogArticleMeta {
  slug: string;
  updatedAt: string;
  articleType: ArticleType;
}

const BLOG_ARTICLES: BlogArticleMeta[] = [
  // ===================== PILLAR ARTICLES =====================
  // Main cluster centers - highest blog priority (0.85, weekly)
  { slug: "controle-financeiro-pessoal", updatedAt: "2026-01-11", articleType: "pillar" },
  
  // ===================== SATELLITE ARTICLES =====================
  // Supporting cluster content - medium priority (0.75, monthly)
  { slug: "como-controlar-gastos-mensais", updatedAt: "2026-01-12", articleType: "satellite" },
  { slug: "controle-financeiro-iniciantes", updatedAt: "2026-01-03", articleType: "satellite" },
  { slug: "controle-financeiro-jogando", updatedAt: "2026-01-12", articleType: "satellite" },
  { slug: "organizacao-financeira", updatedAt: "2026-01-03", articleType: "satellite" },
  
  // ===================== LONG-TAIL ARTICLES =====================
  // Specific keyword targeting - lower priority (0.68, monthly)
  { slug: "app-financeiro-gamificado", updatedAt: "2026-01-03", articleType: "longtail" },
  { slug: "controlar-gastos-jogando", updatedAt: "2026-01-03", articleType: "longtail" },
  { slug: "educacao-financeira-gamificada", updatedAt: "2026-01-03", articleType: "longtail" },
  { slug: "economizar-dinheiro-desafios", updatedAt: "2026-01-03", articleType: "longtail" },
  { slug: "erros-organizar-financas", updatedAt: "2026-01-03", articleType: "longtail" },
  { slug: "gamificacao-financas-pessoais", updatedAt: "2026-01-03", articleType: "longtail" },
  { slug: "como-economizar-dinheiro", updatedAt: "2026-01-03", articleType: "longtail" },
  { slug: "dicas-economia-mensal", updatedAt: "2026-01-03", articleType: "longtail" },
  { slug: "poupar-dinheiro-ganhando-pouco", updatedAt: "2026-01-03", articleType: "longtail" },
  { slug: "habitos-financeiros-saudaveis", updatedAt: "2026-01-03", articleType: "longtail" },
  { slug: "como-montar-orcamento-pessoal", updatedAt: "2026-01-03", articleType: "longtail" },
];

// ============================================================
// PRIORITY & CHANGEFREQ HELPERS
// ============================================================
function getArticlePriority(articleType: ArticleType): string {
  switch (articleType) {
    case "pillar": return "0.85";
    case "satellite": return "0.75";
    case "longtail":
    default: return "0.68";
  }
}

function getArticleChangefreq(articleType: ArticleType): "weekly" | "monthly" {
  return articleType === "pillar" ? "weekly" : "monthly";
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

    // Start XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <!-- 
    MONEYQUEST SITEMAP - Auto-generated
    Generated: ${today}
    
    INCLUDES: Public indexable pages only
    EXCLUDES: /login, /signup, /premium, /dashboard, authenticated routes
  -->
`;

    // ===================== STATIC PAGES =====================
    xml += `\n  <!-- STATIC PUBLIC PAGES -->\n`;
    for (const page of STATIC_INDEXABLE_PAGES) {
      const fullUrl = `${DOMAIN}${page.loc}`;
      if (includedUrls.has(fullUrl)) continue;
      includedUrls.add(fullUrl);

      xml += `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
    }

    // ===================== AUTHOR PAGES =====================
    xml += `\n  <!-- AUTHOR PAGES -->\n`;
    for (const author of AUTHORS) {
      const fullUrl = `${DOMAIN}/autor/${author.slug}`;
      if (includedUrls.has(fullUrl)) continue;
      includedUrls.add(fullUrl);

      const lastmod = author.updatedAt <= today ? author.updatedAt : today;
      xml += `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.55</priority>
  </url>\n`;
    }

    // ===================== BLOG ARTICLES (from blogData.ts) =====================
    // Sort: pillar first, then satellite, then longtail
    const sortedArticles = [...BLOG_ARTICLES].sort((a, b) => {
      const order = { pillar: 0, satellite: 1, longtail: 2 };
      return order[a.articleType] - order[b.articleType];
    });

    xml += `\n  <!-- BLOG ARTICLES (Static from blogData.ts) -->\n`;
    for (const article of sortedArticles) {
      const fullUrl = `${DOMAIN}/blog/${article.slug}`;
      if (includedUrls.has(fullUrl)) continue;
      includedUrls.add(fullUrl);

      const priority = getArticlePriority(article.articleType);
      const changefreq = getArticleChangefreq(article.articleType);
      const lastmod = article.updatedAt <= today ? article.updatedAt : today;

      xml += `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
    }

    // ===================== DATABASE ARTICLES =====================
    // Fetch auto-generated articles from blog_articles_generated table
    const { data: dbArticles, error } = await supabase
      .from("blog_articles_generated")
      .select("slug, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error fetching database articles:", error);
    }

    if (dbArticles && dbArticles.length > 0) {
      xml += `\n  <!-- BLOG ARTICLES (Auto-generated from Database) -->\n`;
      
      for (const article of dbArticles) {
        const fullUrl = `${DOMAIN}/blog/${article.slug}`;
        // Skip if already included (avoid duplicates)
        if (includedUrls.has(fullUrl)) continue;
        includedUrls.add(fullUrl);

        let lastmod = today;
        if (article.published_at) {
          const pubDate = new Date(article.published_at).toISOString().split("T")[0];
          lastmod = pubDate <= today ? pubDate : today;
        }

        // Database articles default to longtail priority
        xml += `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.68</priority>
  </url>\n`;
      }
    }

    // Close XML
    xml += `</urlset>`;

    const totalUrls = includedUrls.size;
    console.log(`Sitemap generated: ${totalUrls} URLs (${STATIC_INDEXABLE_PAGES.length} static, ${AUTHORS.length} authors, ${BLOG_ARTICLES.length} static articles, ${dbArticles?.length || 0} db articles)`);

    return new Response(xml, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { status: 500, headers: corsHeaders }
    );
  }
});
