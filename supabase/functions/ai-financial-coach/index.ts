import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_USER_MESSAGE_LENGTH = 2000;
const MAX_TRANSACTIONS = 100;
const MAX_CONVERSATION_HISTORY = 20;
const VALID_REQUEST_TYPES = ['spending_analysis', 'savings_tip', 'monthly_summary', 'goal_coaching', 'quick_insight', 'chat'] as const;
const VALID_LANGUAGES = ['pt-BR', 'en-US', 'es-ES', 'pt-PT'] as const;
const VALID_CURRENCIES = ['BRL', 'USD', 'EUR'] as const;

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
}

interface ProfileStats {
  level: number;
  level_title: string;
  xp: number;
  streak: number;
  total_income: number;
  total_expenses: number;
  financial_mood: string;
}

interface RequestBody {
  transactions: Transaction[];
  profile: ProfileStats;
  requestType: typeof VALID_REQUEST_TYPES[number];
  userMessage?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  language: string;
  currency: string;
}

// Input validation functions
function validateInput(body: unknown): { valid: true; data: RequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const data = body as Record<string, unknown>;

  // Validate requestType
  if (!data.requestType || !VALID_REQUEST_TYPES.includes(data.requestType as typeof VALID_REQUEST_TYPES[number])) {
    return { valid: false, error: `Invalid requestType. Must be one of: ${VALID_REQUEST_TYPES.join(', ')}` };
  }

  // Validate language
  const language = data.language || 'en-US';
  if (!VALID_LANGUAGES.includes(language as typeof VALID_LANGUAGES[number])) {
    return { valid: false, error: `Invalid language. Must be one of: ${VALID_LANGUAGES.join(', ')}` };
  }

  // Validate currency
  const currency = data.currency || 'USD';
  if (!VALID_CURRENCIES.includes(currency as typeof VALID_CURRENCIES[number])) {
    return { valid: false, error: `Invalid currency. Must be one of: ${VALID_CURRENCIES.join(', ')}` };
  }

  // Validate userMessage length
  if (data.userMessage && typeof data.userMessage === 'string' && data.userMessage.length > MAX_USER_MESSAGE_LENGTH) {
    return { valid: false, error: `userMessage exceeds maximum length of ${MAX_USER_MESSAGE_LENGTH} characters` };
  }

  // Validate transactions array
  if (!Array.isArray(data.transactions)) {
    return { valid: false, error: 'transactions must be an array' };
  }
  if (data.transactions.length > MAX_TRANSACTIONS) {
    return { valid: false, error: `transactions array exceeds maximum of ${MAX_TRANSACTIONS} items` };
  }

  // Validate conversationHistory
  if (data.conversationHistory && Array.isArray(data.conversationHistory) && data.conversationHistory.length > MAX_CONVERSATION_HISTORY) {
    return { valid: false, error: `conversationHistory exceeds maximum of ${MAX_CONVERSATION_HISTORY} messages` };
  }

  // Validate profile object
  if (!data.profile || typeof data.profile !== 'object') {
    return { valid: false, error: 'profile is required and must be an object' };
  }

  const profile = data.profile as Record<string, unknown>;
  if (typeof profile.level !== 'number' || profile.level < 1 || profile.level > 100) {
    return { valid: false, error: 'profile.level must be a number between 1 and 100' };
  }

  return { 
    valid: true, 
    data: {
      transactions: (data.transactions as Transaction[]).slice(0, MAX_TRANSACTIONS),
      profile: data.profile as ProfileStats,
      requestType: data.requestType as typeof VALID_REQUEST_TYPES[number],
      userMessage: data.userMessage ? String(data.userMessage).slice(0, MAX_USER_MESSAGE_LENGTH) : undefined,
      conversationHistory: (data.conversationHistory as Array<{ role: string; content: string }> || []).slice(0, MAX_CONVERSATION_HISTORY),
      language: language as string,
      currency: currency as string,
    }
  };
}

const getSystemPrompt = (language: string, currency: string) => {
  const languageInstructions = {
    'pt-BR': 'Responda sempre em português brasileiro.',
    'pt-PT': 'Responda sempre em português europeu.',
    'en-US': 'Always respond in English.',
    'es-ES': 'Responde siempre en español.',
  };

  return `You are MoneyQuest's friendly AI Financial Coach! 🎮💰

You help users understand their spending, save money, and achieve their financial goals in a fun, gamified way.

Your personality:
- Encouraging and positive, like a supportive coach
- Use gaming metaphors (XP, levels, quests, achievements, power-ups)
- Celebrate wins, no matter how small
- Give actionable, practical advice
- Keep responses concise but helpful (2-4 paragraphs max)
- Use relevant emojis sparingly to add personality

${languageInstructions[language as keyof typeof languageInstructions] || 'Always respond in English.'}

Currency context: Format all money values in ${currency} (e.g., ${currency === 'BRL' ? 'R$100,00' : currency === 'EUR' ? '€100.00' : '$100.00'}).

Remember: You're not just a financial advisor, you're a quest companion helping them level up their financial life!`;
};

const buildContextMessage = (
  transactions: Transaction[],
  profile: ProfileStats,
  requestType: string,
  currency: string
): string => {
  const recentTransactions = transactions.slice(0, 20);
  const expensesByCategory: Record<string, number> = {};
  let totalExpenses = 0;
  let totalIncome = 0;

  recentTransactions.forEach(t => {
    if (t.type === 'EXPENSE') {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      totalExpenses += t.amount;
    } else {
      totalIncome += t.amount;
    }
  });

  const categoryBreakdown = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => `${cat}: ${amount.toFixed(2)}`)
    .join(', ');

  const context = `
User Profile:
- Level: ${profile.level} (${profile.level_title})
- XP: ${profile.xp}
- Current Streak: ${profile.streak} days
- Financial Mood: ${profile.financial_mood}
- Total Income: ${profile.total_income.toFixed(2)} ${currency}
- Total Expenses: ${profile.total_expenses.toFixed(2)} ${currency}

Recent Transactions (last ${recentTransactions.length}):
- Total Income: ${totalIncome.toFixed(2)} ${currency}
- Total Expenses: ${totalExpenses.toFixed(2)} ${currency}
- Spending by Category: ${categoryBreakdown || 'No expenses yet'}
`;

  const prompts: Record<string, string> = {
    spending_analysis: `Analyze this user's spending patterns. Identify their top spending categories, any concerning patterns, and give 2-3 actionable suggestions to optimize their spending. Be encouraging about what they're doing well!`,
    savings_tip: `Based on this user's spending habits, give them ONE powerful, personalized savings tip they can implement right away. Make it specific to their actual spending patterns, not generic advice.`,
    monthly_summary: `Give this user a monthly financial summary. Celebrate their wins (streak, XP gained, good habits), note areas for improvement, and set them up with motivation for the next month. Make it feel like a game progress report!`,
    goal_coaching: `Act as their financial coach. Based on their current financial mood and habits, give them personalized encouragement and a specific "quest" they can work on to improve their finances. Make it achievable and motivating!`,
    quick_insight: `Give this user ONE quick, interesting insight about their finances. It could be a pattern you noticed, a fun fact about their progress, or a mini-tip. Keep it brief but impactful!`,
    chat: `Respond to the user's question as their helpful financial coach, using the context of their financial data above.`,
  };

  return `${context}\n\n${prompts[requestType] || prompts.chat}`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'unauthorized', message: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error('Auth error:', claimsError?.message || 'No sub claim');
      return new Response(JSON.stringify({ error: 'unauthorized', message: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;

    // Parse and validate input
    const rawBody = await req.json();
    const validation = validateInput(rawBody);
    
    if (!validation.valid) {
      console.error('Validation error:', validation.error);
      return new Response(JSON.stringify({ error: 'validation_error', message: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      transactions, 
      profile, 
      requestType, 
      userMessage,
      conversationHistory = [],
      language = 'en-US',
      currency = 'USD'
    } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = getSystemPrompt(language, currency);
    const contextMessage = buildContextMessage(transactions, profile, requestType, currency);

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { 
        role: "user", 
        content: userMessage 
          ? `${contextMessage}\n\nUser's question: ${userMessage}` 
          : contextMessage 
      },
    ];

    console.log(`AI Coach request: user=${userId}, type=${requestType}, language=${language}, transactions=${transactions.length}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limit", message: "Too many requests. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required", message: "AI credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "ai_error", message: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Financial Coach error:", error);
    return new Response(JSON.stringify({ 
      error: "server_error", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
