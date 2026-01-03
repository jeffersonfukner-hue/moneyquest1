import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RECEIPT-OCR] ${step}${detailsStr}`);
};

interface ParsedItem {
  name: string;
  amount: number;
  quantity?: number;
}

interface ParsedReceipt {
  storeName?: string;
  date?: string;
  total?: number;
  items: ParsedItem[];
  suggestedCategory?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Authentication failed");
    }

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    // Check if user is premium
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("subscription_plan, premium_override")
      .eq("id", userId)
      .single();

    if (profileError) {
      throw new Error("Failed to fetch profile");
    }

    const isPremium = profile.subscription_plan === "PREMIUM" || 
                      profile.premium_override === "force_on";

    if (!isPremium) {
      logStep("User not premium, blocking access");
      return new Response(
        JSON.stringify({ error: "Premium subscription required", code: "PREMIUM_REQUIRED" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Get image data from request
    const { imageBase64, mimeType } = await req.json();
    
    if (!imageBase64) {
      throw new Error("No image data provided");
    }

    logStep("Image received", { mimeType, size: imageBase64.length });

    // Call Lovable AI (Gemini) to analyze the receipt
    const aiResponse = await fetch("https://api.lovable.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a receipt/invoice OCR parser. Analyze this receipt image and extract:

1. Store/merchant name
2. Date of purchase (format: YYYY-MM-DD)
3. Total amount
4. Individual items with their names and prices
5. Suggest a category (one of: Mercado, Alimentação, Transporte, Compras, Saúde, Lazer, Educação, Serviços, Outros)

Respond ONLY with valid JSON in this exact format:
{
  "storeName": "Store Name",
  "date": "2024-01-15",
  "total": 123.45,
  "items": [
    {"name": "Item Name", "amount": 12.50, "quantity": 1}
  ],
  "suggestedCategory": "Mercado"
}

If you can't read something clearly, make your best guess. If the receipt is in Portuguese, keep item names in Portuguese.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("AI API error", { status: aiResponse.status, error: errorText });
      throw new Error(`AI API failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    logStep("AI response received");

    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    let parsed: ParsedReceipt;
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      logStep("Failed to parse AI response", { content, error: parseError });
      // Return a basic structure if parsing fails
      parsed = {
        items: [],
        suggestedCategory: "Outros"
      };
    }

    logStep("Receipt parsed successfully", { 
      storeName: parsed.storeName, 
      itemCount: parsed.items?.length || 0,
      total: parsed.total 
    });

    // Track OCR usage
    await supabaseClient.from("ab_test_events").insert({
      user_id: userId,
      test_name: "premium_features",
      variant: "ocr_usage",
      event_type: "ocr_scan_completed",
      metadata: { 
        itemCount: parsed.items?.length || 0,
        storeName: parsed.storeName,
        total: parsed.total
      }
    });

    return new Response(
      JSON.stringify({ success: true, data: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
