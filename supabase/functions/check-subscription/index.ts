import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Safe timestamp to ISO conversion - handles various formats from Stripe API
const safeTimestampToISO = (timestamp: unknown): string | null => {
  try {
    if (timestamp === null || timestamp === undefined) return null;
    if (typeof timestamp === 'number') {
      return new Date(timestamp * 1000).toISOString();
    }
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date.toISOString();
    }
    return null;
  } catch {
    return null;
  }
};

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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Fetch current profile to check premium_override and trial status
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("premium_override, trial_start_date, trial_end_date, has_used_trial, subscription_plan")
      .eq("id", user.id)
      .single();

    if (profileError) {
      logStep("WARNING", { message: "Failed to fetch profile", error: profileError.message });
    }

    const premiumOverride = profile?.premium_override || 'none';
    const trialEndDate = profile?.trial_end_date ? new Date(profile.trial_end_date) : null;
    const hasUsedTrial = profile?.has_used_trial ?? false;
    const now = new Date();
    
    // Check if trial has expired
    const trialExpired = trialEndDate && trialEndDate < now;
    const wasInTrial = hasUsedTrial && profile?.subscription_plan === 'PREMIUM';
    
    logStep("Current status", { premiumOverride, trialEndDate, trialExpired, hasUsedTrial, wasInTrial });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, checking trial status");
      
      // Build update data - always update stripe_subscription_status
      const updateData: Record<string, any> = { 
        stripe_subscription_status: 'inactive',
        stripe_customer_id: null,
        stripe_subscription_id: null
      };

      // Determine subscription plan based on trial and override
      if (premiumOverride === 'none') {
        // If trial is still active, keep as PREMIUM
        if (trialEndDate && trialEndDate > now) {
          logStep("Trial still active - keeping PREMIUM");
          // Don't change subscription_plan, keep it as PREMIUM
        } else if (trialExpired && wasInTrial) {
          // Trial expired - downgrade to FREE
          updateData.subscription_plan = "FREE";
          logStep("Trial expired - downgrading to FREE");
        } else {
          updateData.subscription_plan = "FREE";
          logStep("No trial or subscription - setting plan to FREE");
        }
      } else {
        logStep("Override active - preserving current subscription_plan", { premiumOverride });
      }

      await supabaseClient
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      // Determine effective plan for response
      let effectivePlan = "FREE";
      if (premiumOverride === 'force_on') {
        effectivePlan = "PREMIUM";
      } else if (trialEndDate && trialEndDate > now) {
        effectivePlan = "PREMIUM";
      }
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan: effectivePlan,
        override: premiumOverride,
        is_trial: trialEndDate && trialEndDate > now,
        trial_end_date: trialEndDate?.toISOString() || null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd = null;
    let stripeSubscriptionId = null;
    let subscriptionStart = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      logStep("Raw subscription data", { 
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        start_type: typeof subscription.current_period_start,
        end_type: typeof subscription.current_period_end
      });
      
      subscriptionEnd = safeTimestampToISO(subscription.current_period_end);
      subscriptionStart = safeTimestampToISO(subscription.current_period_start);
      stripeSubscriptionId = subscription.id;
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
    } else {
      logStep("No active subscription found");
    }

    // Build update data - always update stripe_subscription_status
    const updateData: Record<string, any> = {
      stripe_subscription_status: hasActiveSub ? 'active' : 'inactive',
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSubscriptionId,
      subscription_started_at: subscriptionStart,
      subscription_expires_at: subscriptionEnd,
    };

    // Determine subscription plan based on override, Stripe status, and trial
    if (premiumOverride === 'none') {
      if (hasActiveSub) {
        updateData.subscription_plan = "PREMIUM";
        logStep("Active Stripe subscription - setting PREMIUM");
      } else if (trialEndDate && trialEndDate > now) {
        // Trial still active, keep PREMIUM
        logStep("Trial still active - keeping PREMIUM");
        // Don't set plan in updateData to preserve current
      } else if (trialExpired) {
        // Trial expired and no Stripe subscription - downgrade
        updateData.subscription_plan = "FREE";
        logStep("Trial expired, no Stripe sub - downgrading to FREE");
      } else {
        updateData.subscription_plan = "FREE";
        logStep("No active subscription or trial - setting FREE");
      }
    } else {
      logStep("Override active - preserving current subscription_plan", { premiumOverride });
    }

    await supabaseClient
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    // Determine effective plan based on override
    let effectivePlan = hasActiveSub ? "PREMIUM" : "FREE";
    if (premiumOverride === 'force_on') effectivePlan = "PREMIUM";
    if (premiumOverride === 'force_off') effectivePlan = "FREE";

    // Check if user is in trial (has trial, no Stripe sub)
    const isInTrial = !hasActiveSub && trialEndDate && trialEndDate > now;

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan: effectivePlan,
      subscription_end: subscriptionEnd,
      customer_id: customerId,
      subscription_id: stripeSubscriptionId,
      override: premiumOverride,
      is_trial: isInTrial,
      trial_end_date: isInTrial ? trialEndDate?.toISOString() : null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
