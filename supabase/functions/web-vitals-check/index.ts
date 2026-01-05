import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Google's Core Web Vitals thresholds
const thresholds = {
  LCP: { good: 2500, poor: 4000, unit: 'ms', label: 'Largest Contentful Paint' },
  FCP: { good: 1800, poor: 3000, unit: 'ms', label: 'First Contentful Paint' },
  CLS: { good: 0.1, poor: 0.25, unit: '', label: 'Cumulative Layout Shift' },
  INP: { good: 200, poor: 500, unit: 'ms', label: 'Interaction to Next Paint' },
  TTFB: { good: 800, poor: 1800, unit: 'ms', label: 'Time to First Byte' },
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[web-vitals-check] Starting scheduled check...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get averages from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: vitalsData, error: vitalsError } = await supabase
      .from("web_vitals_logs")
      .select("metric_name, metric_value")
      .gte("created_at", twentyFourHoursAgo);

    if (vitalsError) {
      console.error("[web-vitals-check] Error fetching vitals:", vitalsError);
      throw vitalsError;
    }

    if (!vitalsData || vitalsData.length < 10) {
      console.log("[web-vitals-check] Insufficient samples:", vitalsData?.length || 0);
      return new Response(
        JSON.stringify({ 
          success: true, 
          checked: false, 
          reason: "Insufficient samples",
          sample_count: vitalsData?.length || 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate averages per metric
    const metrics: Record<string, { sum: number; count: number }> = {};
    
    for (const row of vitalsData) {
      if (!metrics[row.metric_name]) {
        metrics[row.metric_name] = { sum: 0, count: 0 };
      }
      metrics[row.metric_name].sum += Number(row.metric_value);
      metrics[row.metric_name].count += 1;
    }

    const averages: Record<string, number> = {};
    for (const [name, data] of Object.entries(metrics)) {
      averages[name] = data.sum / data.count;
    }

    console.log("[web-vitals-check] Calculated averages:", averages);

    const alertsCreated: string[] = [];

    // Check each metric against thresholds
    for (const [metricName, threshold] of Object.entries(thresholds)) {
      const avgValue = averages[metricName];
      
      if (avgValue !== undefined && avgValue > threshold.good) {
        const severity = avgValue > threshold.poor ? "error" : "warning";
        const formattedValue = metricName === "CLS" 
          ? avgValue.toFixed(3) 
          : `${Math.round(avgValue)}ms`;
        const formattedThreshold = metricName === "CLS" 
          ? threshold.good.toString() 
          : `${threshold.good}ms`;

        // Check if a similar alert was already created in the last 6 hours
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
        
        const { data: existingAlerts } = await supabase
          .from("admin_notifications")
          .select("id")
          .eq("notification_type", "web_vitals_alert")
          .gte("created_at", sixHoursAgo)
          .like("title", `%${metricName}%`)
          .limit(1);

        if (existingAlerts && existingAlerts.length > 0) {
          console.log(`[web-vitals-check] Skipping ${metricName} - recent alert exists`);
          continue;
        }

        // Create alert
        const { error: insertError } = await supabase
          .from("admin_notifications")
          .insert({
            notification_type: "web_vitals_alert",
            title: `${metricName} Performance Alert`,
            message: `Average ${metricName} is ${formattedValue} (threshold: ${formattedThreshold}). ${threshold.label} is ${severity === "error" ? "critically" : ""} above recommended levels.`,
            severity,
            metadata: {
              metric: metricName,
              value: avgValue,
              threshold: threshold.good,
              sample_count: metrics[metricName].count,
            },
          });

        if (insertError) {
          console.error(`[web-vitals-check] Error creating ${metricName} alert:`, insertError);
        } else {
          alertsCreated.push(metricName);
          console.log(`[web-vitals-check] Created ${severity} alert for ${metricName}`);
        }
      }
    }

    console.log("[web-vitals-check] Check complete. Alerts created:", alertsCreated);

    return new Response(
      JSON.stringify({
        success: true,
        checked: true,
        sample_count: vitalsData.length,
        alerts_created: alertsCreated,
        averages,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[web-vitals-check] Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
