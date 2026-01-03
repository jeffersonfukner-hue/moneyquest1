import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Keywords pool for SEO articles
const KEYWORDS_POOL = [
  "como fazer um orçamento mensal simples",
  "dicas para economizar dinheiro todo mês",
  "como sair das dívidas passo a passo",
  "planejamento financeiro para iniciantes",
  "como controlar impulsos de compra",
  "reserva de emergência quanto guardar",
  "como organizar as finanças do casal",
  "aplicativos para controle de gastos",
  "como economizar ganhando pouco",
  "metas financeiras como definir",
  "como parar de gastar dinheiro à toa",
  "educação financeira para jovens",
  "como fazer dinheiro render mais",
  "hábitos financeiros saudáveis",
  "como economizar nas compras do mês",
  "finanças pessoais para autônomos",
  "como guardar dinheiro mesmo devendo",
  "desafio das 52 semanas funciona",
  "como reduzir gastos fixos mensais",
  "investimentos para iniciantes com pouco dinheiro"
];

const CATEGORIES = [
  'controle-financeiro',
  'educacao-financeira',
  'gamificacao',
  'economia-dia-a-dia',
  'desafios-financeiros',
  'habitos-financeiros'
];

const EXISTING_ARTICLE_SLUGS = [
  'app-financeiro-gamificado',
  'controlar-gastos-jogando',
  'gamificacao-financas-pessoais',
  'controle-financeiro-iniciantes',
  'educacao-financeira-gamificada',
  'desafio-52-semanas',
  'como-montar-orcamento-pessoal-do-zero'
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function selectCategory(keyword: string): string {
  const keywordLower = keyword.toLowerCase();
  
  if (keywordLower.includes('orçamento') || keywordLower.includes('controle') || keywordLower.includes('gastos')) {
    return 'controle-financeiro';
  }
  if (keywordLower.includes('educação') || keywordLower.includes('iniciante') || keywordLower.includes('aprender')) {
    return 'educacao-financeira';
  }
  if (keywordLower.includes('jogo') || keywordLower.includes('desafio') || keywordLower.includes('gamific')) {
    return 'gamificacao';
  }
  if (keywordLower.includes('economizar') || keywordLower.includes('compras') || keywordLower.includes('desconto')) {
    return 'economia-dia-a-dia';
  }
  if (keywordLower.includes('desafio') || keywordLower.includes('meta')) {
    return 'desafios-financeiros';
  }
  if (keywordLower.includes('hábito') || keywordLower.includes('rotina')) {
    return 'habitos-financeiros';
  }
  
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}

function getRelatedSlugs(): string[] {
  const shuffled = [...EXISTING_ARTICLE_SLUGS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 2);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Starting blog article generation...");
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get already used keywords
    const { data: existingArticles } = await supabase
      .from('blog_articles_generated')
      .select('keyword');
    
    const usedKeywords = new Set(existingArticles?.map(a => a.keyword) || []);
    
    // Select a keyword that hasn't been used
    const availableKeywords = KEYWORDS_POOL.filter(k => !usedKeywords.has(k));
    
    if (availableKeywords.length === 0) {
      console.log("⚠️ All keywords have been used. Recycling...");
      availableKeywords.push(...KEYWORDS_POOL);
    }

    const selectedKeyword = availableKeywords[Math.floor(Math.random() * availableKeywords.length)];
    const category = selectCategory(selectedKeyword);
    const relatedSlugs = getRelatedSlugs();
    
    console.log(`📝 Selected keyword: "${selectedKeyword}"`);
    console.log(`📂 Category: ${category}`);

    const systemPrompt = `Você é um redator SEO especialista em finanças pessoais e gamificação financeira.
Seu objetivo é criar artigos otimizados para o blog do MoneyQuest (https://moneyquest.app.br).

REGRAS OBRIGATÓRIAS:
1. Escreva em português brasileiro
2. Mínimo de 1.200 palavras
3. Use linguagem simples e acessível para iniciantes
4. Inclua exemplos práticos do dia a dia
5. Mencione a gamificação como diferencial
6. Referencie o MoneyQuest naturalmente (não forçado)
7. Use estrutura com H1, H2, H3
8. Inclua listas e subtítulos escaneáveis
9. Termine com CTA para o MoneyQuest

ESTRUTURA DO ARTIGO:
- 1 H1 com a keyword principal
- 4-6 seções H2
- Subseções H3 quando apropriado
- Pelo menos 2 listas com bullets
- Uma seção prática "Como aplicar hoje"
- Conclusão com CTA

LINKS INTERNOS (usar em markdown):
- [controle financeiro](/controle-financeiro)
- [desafios financeiros](/desafios-financeiros)
- [app de finanças pessoais](/app-financas-pessoais)
- [educação financeira](/educacao-financeira-gamificada)

CTA FINAL:
"Quer transformar sua vida financeira em um jogo? Conheça o [MoneyQuest](https://moneyquest.app.br) e comece agora."`;

    const userPrompt = `Crie um artigo SEO completo sobre: "${selectedKeyword}"

Categoria: ${category}
Artigos relacionados para linkar internamente: ${relatedSlugs.join(', ')}

Retorne EXATAMENTE neste formato JSON (sem markdown, sem backticks):
{
  "title": "Título do artigo (máx 60 chars)",
  "metaTitle": "Meta title SEO (máx 60 chars)",
  "metaDescription": "Meta description (máx 160 chars)",
  "excerpt": "Resumo curto do artigo (1-2 frases)",
  "content": "Conteúdo completo em Markdown",
  "readTime": 8
}`;

    console.log("🤖 Calling Lovable AI Gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content;
    
    if (!rawContent) {
      throw new Error("No content returned from AI");
    }

    console.log("📄 Raw AI response received, parsing...");

    // Clean and parse JSON
    let articleData;
    try {
      // Remove markdown code blocks if present
      let cleanJson = rawContent.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.slice(7);
      }
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.slice(3);
      }
      if (cleanJson.endsWith('```')) {
        cleanJson = cleanJson.slice(0, -3);
      }
      cleanJson = cleanJson.trim();
      
      articleData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Raw content:", rawContent.substring(0, 500));
      throw new Error("Failed to parse article data from AI");
    }

    const slug = slugify(selectedKeyword);
    const today = new Date().toISOString().split('T')[0];

    const articleRecord = {
      slug,
      title: articleData.title,
      meta_title: articleData.metaTitle,
      meta_description: articleData.metaDescription,
      category,
      excerpt: articleData.excerpt,
      content: articleData.content,
      keyword: selectedKeyword,
      read_time: articleData.readTime || 8,
      related_slugs: relatedSlugs,
      internal_links: [
        { text: 'controle financeiro', url: '/controle-financeiro' },
        { text: 'desafios financeiros', url: '/desafios-financeiros' }
      ],
      published_at: today,
      status: 'published'
    };

    console.log("💾 Saving article to database...");

    const { data: savedArticle, error: saveError } = await supabase
      .from('blog_articles_generated')
      .insert(articleRecord)
      .select()
      .single();

    if (saveError) {
      console.error("Failed to save article:", saveError);
      throw new Error(`Database error: ${saveError.message}`);
    }

    console.log("✅ Article published successfully!");
    console.log(`📝 Title: ${savedArticle.title}`);
    console.log(`🔗 Slug: ${savedArticle.slug}`);

    return new Response(JSON.stringify({
      success: true,
      article: {
        id: savedArticle.id,
        slug: savedArticle.slug,
        title: savedArticle.title,
        keyword: savedArticle.keyword,
        category: savedArticle.category,
        publishedAt: savedArticle.published_at
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Error generating article:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
