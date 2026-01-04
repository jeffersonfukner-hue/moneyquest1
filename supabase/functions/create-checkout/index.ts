import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR - No authorization header");
      throw new Error("Auth session missing!");
    }
    
    const token = authHeader.replace("Bearer ", "");
    if (!token || token === "null" || token === "undefined") {
      logStep("ERROR - Invalid token", { token: token?.substring(0, 20) });
      throw new Error("Invalid auth token");
    }
    
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError) {
      logStep("ERROR - Auth failed", { error: authError.message });
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    const user = data.user;
    
    if (!user?.email) {
      logStep("ERROR - No user or email", { userId: user?.id });
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { priceId, promotionCode } = await req.json();
    if (!priceId) {
      throw new Error("Price ID is required");
    }
    logStep("Price ID received", { priceId, promotionCode });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const origin = req.headers.get("origin") || "https://lovable.dev";
    
    // Build checkout session options
    const sessionOptions: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/premium-success`,
      cancel_url: `${origin}/premium?canceled=true`,
      metadata: {
        user_id: user.id,
      },
    };

    // Apply promotion code if provided
    if (promotionCode) {
      // Find the promotion code in Stripe
      const promotionCodes = await stripe.promotionCodes.list({
        code: promotionCode,
        active: true,
        limit: 1,
      });

      if (promotionCodes.data.length > 0) {
        sessionOptions.discounts = [{ promotion_code: promotionCodes.data[0].id }];
        logStep("Promotion code applied", { promotionCode, promotionCodeId: promotionCodes.data[0].id });
      } else {
        logStep("Promotion code not found or inactive", { promotionCode });
      }
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
