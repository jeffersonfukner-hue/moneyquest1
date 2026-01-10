import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_VALUE_LENGTH = 100;
const MAX_CATEGORY_LENGTH = 100;
const VALID_IMPACTS = ['low', 'medium', 'high', 'critical'] as const;
const VALID_BALANCE_STATUSES = ['positive', 'neutral', 'negative'] as const;
const VALID_EVENT_TYPES = ['expense', 'income', 'recurring', 'alert'] as const;
const VALID_LANGUAGES = ['pt-BR', 'en-US', 'es-ES', 'pt-PT'] as const;

interface NarrativeRequest {
  value: string;
  category: string;
  impact: typeof VALID_IMPACTS[number];
  userLevel: number;
  balanceStatus: typeof VALID_BALANCE_STATUSES[number];
  eventType: typeof VALID_EVENT_TYPES[number];
  language: string;
}

// Input validation function
function validateInput(body: unknown): { valid: true; data: NarrativeRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const data = body as Record<string, unknown>;

  // Validate value
  if (!data.value || typeof data.value !== 'string') {
    return { valid: false, error: 'value is required and must be a string' };
  }
  if (data.value.length > MAX_VALUE_LENGTH) {
    return { valid: false, error: `value exceeds maximum length of ${MAX_VALUE_LENGTH} characters` };
  }

  // Validate category
  if (!data.category || typeof data.category !== 'string') {
    return { valid: false, error: 'category is required and must be a string' };
  }
  if (data.category.length > MAX_CATEGORY_LENGTH) {
    return { valid: false, error: `category exceeds maximum length of ${MAX_CATEGORY_LENGTH} characters` };
  }

  // Validate impact
  if (!data.impact || !VALID_IMPACTS.includes(data.impact as typeof VALID_IMPACTS[number])) {
    return { valid: false, error: `Invalid impact. Must be one of: ${VALID_IMPACTS.join(', ')}` };
  }

  // Validate balanceStatus
  if (!data.balanceStatus || !VALID_BALANCE_STATUSES.includes(data.balanceStatus as typeof VALID_BALANCE_STATUSES[number])) {
    return { valid: false, error: `Invalid balanceStatus. Must be one of: ${VALID_BALANCE_STATUSES.join(', ')}` };
  }

  // Validate eventType
  if (!data.eventType || !VALID_EVENT_TYPES.includes(data.eventType as typeof VALID_EVENT_TYPES[number])) {
    return { valid: false, error: `Invalid eventType. Must be one of: ${VALID_EVENT_TYPES.join(', ')}` };
  }

  // Validate language
  const language = data.language || 'en-US';
  if (!VALID_LANGUAGES.includes(language as typeof VALID_LANGUAGES[number])) {
    return { valid: false, error: `Invalid language. Must be one of: ${VALID_LANGUAGES.join(', ')}` };
  }

  // Validate userLevel
  const userLevel = typeof data.userLevel === 'number' ? data.userLevel : 1;
  if (userLevel < 1 || userLevel > 100) {
    return { valid: false, error: 'userLevel must be between 1 and 100' };
  }

  return {
    valid: true,
    data: {
      value: String(data.value).slice(0, MAX_VALUE_LENGTH),
      category: String(data.category).slice(0, MAX_CATEGORY_LENGTH),
      impact: data.impact as typeof VALID_IMPACTS[number],
      userLevel,
      balanceStatus: data.balanceStatus as typeof VALID_BALANCE_STATUSES[number],
      eventType: data.eventType as typeof VALID_EVENT_TYPES[number],
      language: language as string,
    }
  };
}

const getSystemPrompt = (language: string) => {
  const languageInstructions: Record<string, string> = {
    'en-US': 'Respond in English.',
    'pt-BR': 'Responda em Português do Brasil.',
    'pt-PT': 'Responda em Português Europeu.',
    'es-ES': 'Responde en Español.'
  };

  return `You are the narrative engine of a gamified personal finance app called MoneyQuest.

Your role is to transform financial events into short RPG-style narrative messages.

The tone must be immersive, motivating, and never judgmental.

${languageInstructions[language] || 'Respond in English.'}

RULES:
1. Never repeat the same opening event twice in a row.
2. Never shame or blame the user.
3. Always close with motivation, learning, or strategic advice.
4. Use RPG vocabulary (quest, mana, inventory, level, bars, event, NPC).
5. Keep the message between 3 and 6 short lines.
6. If balance_status is negative, subtly warn about risk without fear.
7. If category is subscription, imply a continuous effect.
8. If category is investment, imply long-term growth.
9. Emergencies protect essential bars but affect global mana.

OPENING EVENTS (choose one randomly):
- A mystical ambush
- A sneaky merchant
- An unexpected spell
- A city trap
- A random map event
- A dubious NPC
- A portal of expenses
- A real-world distraction

IMPACT TEXT:
- low: caused light damage
- medium: drained part of your mana
- high: delivered a heavy blow
- critical: landed a critical hit

CATEGORY EFFECTS:
- food: Food bar
- transport: Transport bar
- housing: Shelter bar
- fun: Joy bar
- impulse: Global Financial Mana
- subscription: Global Financial Mana (ongoing effect)
- investment: Growth bar (positive effect!)
- emergency: All essential bars protected, mana affected

STATUS PHRASES (choose one):
- Your main bars remain intact.
- Essential resources are still protected.
- No vital bar was compromised.

BALANCE FEEDBACK:
- positive: Your financial mana remains stable.
- neutral: Your balance is holding steady.
- negative: Your global financial mana has been reduced.

MOTIVATIONAL CLOSINGS (choose one):
- Stay focused on the main quest.
- Every run has challenges — you're still in the game.
- Strategic decisions strengthen the next level.
- Learning unlocked.
- Adjust now to avoid early game over.

For INCOME events, use positive language:
- A treasure chest appeared!
- A generous NPC rewarded you!
- Your quest rewards have arrived!
- Gold flows into your inventory!

OUTPUT FORMAT:
Generate a short narrative (3-6 lines) using the structure:
Opening event + value impact
Bars / category feedback
Balance feedback
Motivational closing

IMPORTANT: Output ONLY the narrative text, no JSON, no markdown, no explanations.`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Auth error: Missing or invalid authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false } 
      }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error('Auth error:', claimsError?.message || 'Auth session missing!');
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }), {
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
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { value, category, impact, userLevel, balanceStatus, eventType, language } = validation.data;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const userPrompt = `Generate a narrative for this financial event:
- Value: ${value}
- Category: ${category}
- Impact: ${impact}
- User Level: ${userLevel}
- Balance Status: ${balanceStatus}
- Event Type: ${eventType}

Create an immersive RPG-style message for this ${eventType}.`;

    console.log(`Narrative request: user=${userId}, eventType=${eventType}, impact=${impact}, language=${language}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: getSystemPrompt(language) },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const narrative = data.choices?.[0]?.message?.content?.trim() || '';

    return new Response(JSON.stringify({ narrative }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Narrative engine error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
