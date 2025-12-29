import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NarrativeRequest {
  value: string;
  category: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  userLevel: number;
  balanceStatus: 'positive' | 'neutral' | 'negative';
  eventType: 'expense' | 'income' | 'recurring' | 'alert';
  language: string;
}

const getSystemPrompt = (language: string) => {
  const languageInstructions: Record<string, string> = {
    'en-US': 'Respond in English.',
    'pt-BR': 'Responda em Português do Brasil.',
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
    const { value, category, impact, userLevel, balanceStatus, eventType, language } = await req.json() as NarrativeRequest;
    
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
