import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
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
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeKey || !webhookSecret) {
    logStep("ERROR", { message: "Missing Stripe keys" });
    return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      logStep("ERROR", { message: "No signature provided" });
      return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("ERROR", { message: "Signature verification failed", error: errorMessage });
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }

    logStep("Event received", { type: event.type, id: event.id });

    // Helper function to update user subscription status - respects admin override
    const updateUserSubscription = async (
      customerEmail: string,
      stripeIsActive: boolean,
      subscriptionData?: {
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        subscriptionStartedAt?: string;
        subscriptionExpiresAt?: string;
      }
    ) => {
      // Find user by email
      const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers();
      if (userError) {
        logStep("ERROR", { message: "Failed to list users", error: userError.message });
        return;
      }

      const user = users.users.find(u => u.email === customerEmail);
      if (!user) {
        logStep("WARNING", { message: "User not found for email", email: customerEmail });
        return;
      }

      // Fetch current profile to check premium_override
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("premium_override")
        .eq("id", user.id)
        .single();

      if (profileError) {
        logStep("WARNING", { message: "Failed to fetch profile override", error: profileError.message });
      }

      const premiumOverride = profile?.premium_override || 'none';
      logStep("Current override status", { userId: user.id, premiumOverride });

      // Always update stripe_subscription_status
      const updateData: Record<string, any> = {
        stripe_subscription_status: stripeIsActive ? 'active' : 'inactive',
        updated_at: new Date().toISOString(),
      };

      if (stripeIsActive && subscriptionData) {
        updateData.stripe_customer_id = subscriptionData.stripeCustomerId;
        updateData.stripe_subscription_id = subscriptionData.stripeSubscriptionId;
        updateData.subscription_started_at = subscriptionData.subscriptionStartedAt;
        updateData.subscription_expires_at = subscriptionData.subscriptionExpiresAt;
      } else if (!stripeIsActive) {
        updateData.subscription_expires_at = null;
        updateData.stripe_subscription_id = null;
      }

      // Only update subscription_plan if no admin override
      if (premiumOverride === 'none') {
        updateData.subscription_plan = stripeIsActive ? "PREMIUM" : "FREE";
        logStep("No override - updating subscription_plan", { plan: updateData.subscription_plan });
      } else {
        logStep("Override active - preserving current subscription_plan", { premiumOverride });
      }

      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (updateError) {
        logStep("ERROR", { message: "Failed to update profile", error: updateError.message });
      } else {
        logStep("SUCCESS", { 
          message: `Stripe status updated to ${stripeIsActive ? 'active' : 'inactive'}`,
          userId: user.id,
          email: customerEmail,
          overrideActive: premiumOverride !== 'none'
        });
      }
    };

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout.session.completed", { sessionId: session.id });
        
        if (session.mode === "subscription" && session.customer_email) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          await updateUserSubscription(session.customer_email, true, {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription.id,
            subscriptionStartedAt: safeTimestampToISO(subscription.current_period_start) ?? undefined,
            subscriptionExpiresAt: safeTimestampToISO(subscription.current_period_end) ?? undefined,
          });
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing customer.subscription.created", { subscriptionId: subscription.id });
        
        // Get customer email
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        if (customer.email) {
          await updateUserSubscription(customer.email, true, {
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            subscriptionStartedAt: safeTimestampToISO(subscription.current_period_start) ?? undefined,
            subscriptionExpiresAt: safeTimestampToISO(subscription.current_period_end) ?? undefined,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing customer.subscription.updated", { 
          subscriptionId: subscription.id, 
          status: subscription.status 
        });
        
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        if (customer.email) {
          const isActive = subscription.status === "active" || subscription.status === "trialing";
          
          await updateUserSubscription(customer.email, isActive, isActive ? {
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            subscriptionStartedAt: safeTimestampToISO(subscription.current_period_start) ?? undefined,
            subscriptionExpiresAt: safeTimestampToISO(subscription.current_period_end) ?? undefined,
          } : undefined);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing customer.subscription.deleted", { subscriptionId: subscription.id });
        
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        if (customer.email) {
          await updateUserSubscription(customer.email, false);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing invoice.payment_failed", { invoiceId: invoice.id });
        
        if (invoice.customer_email) {
          await updateUserSubscription(invoice.customer_email, false);
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
