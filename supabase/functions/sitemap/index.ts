import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

const DOMAIN = "https://moneyquest.app.br";

// Static pages with their priorities and change frequencies
const staticPages = [
  // Homepage - highest priority
  { loc: "/", priority: "1.0", changefreq: "daily" },
  
  // SEO Landing Pages - high priority for organic traffic
  { loc: "/controle-financeiro", priority: "0.9", changefreq: "weekly" },
  { loc: "/educacao-financeira-gamificada", priority: "0.9", changefreq: "weekly" },
  { loc: "/desafios-financeiros", priority: "0.9", changefreq: "weekly" },
  { loc: "/app-financas-pessoais", priority: "0.9", changefreq: "weekly" },
  
  // Premium page
  { loc: "/premium", priority: "0.9", changefreq: "weekly" },
  
  // Features & Info
  { loc: "/features", priority: "0.8", changefreq: "weekly" },
  { loc: "/about", priority: "0.8", changefreq: "monthly" },
  
  // Blog main page
  { loc: "/blog", priority: "0.9", changefreq: "daily" },
  
  // Author pages
  { loc: "/autor/equipe-moneyquest", priority: "0.6", changefreq: "monthly" },
  
  // Legal pages
  { loc: "/terms", priority: "0.4", changefreq: "yearly" },
  { loc: "/privacy", priority: "0.4", changefreq: "yearly" },
];

// Static blog articles from blogData.ts
const staticBlogArticles = [
  "app-financeiro-gamificado",
  "controlar-gastos-jogando",
  "educacao-financeira-gamificada",
  "economizar-dinheiro-desafios",
  "controle-financeiro-iniciantes",
  "erros-organizar-financas",
  "gamificacao-financas-pessoais",
  "como-economizar-dinheiro",
  "organizacao-financeira",
  "dicas-economia-mensal",
  "poupar-dinheiro-ganhando-pouco",
  "habitos-financeiros-saudaveis",
  "como-montar-orcamento-pessoal",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch published articles from database
    const { data: dbArticles, error } = await supabase
      .from("blog_articles_generated")
      .select("slug, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error fetching articles:", error);
    }

    const today = new Date().toISOString().split("T")[0];

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  
  <!-- PUBLIC PAGES - Auto-generated -->
`;

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${DOMAIN}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    xml += `
  <!-- STATIC BLOG ARTICLES -->
`;

    // Add static blog articles
    for (const slug of staticBlogArticles) {
      xml += `  <url>
    <loc>${DOMAIN}/blog/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }

    // Add database articles
    if (dbArticles && dbArticles.length > 0) {
      xml += `
  <!-- DATABASE BLOG ARTICLES (Auto-generated) -->
`;
      for (const article of dbArticles) {
        const lastmod = article.published_at 
          ? new Date(article.published_at).toISOString().split("T")[0]
          : today;
        
        xml += `  <url>
    <loc>${DOMAIN}/blog/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    xml += `
</urlset>`;

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
