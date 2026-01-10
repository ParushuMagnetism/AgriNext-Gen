import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Calculate median of an array
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Calculate coefficient of variation
function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance) / mean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { district, crop_name, hours_lookback = 12 } = await req.json();

    if (!district || !crop_name) {
      return new Response(
        JSON.stringify({ success: false, error: "district and crop_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Aggregating prices for ${crop_name} in ${district} (last ${hours_lookback}h)`);

    // 1. Get recent market_prices for this district + crop
    const lookbackTime = new Date(Date.now() - hours_lookback * 60 * 60 * 1000).toISOString();

    const { data: prices, error: pricesError } = await supabase
      .from("market_prices")
      .select("id, modal_price, min_price, max_price, market_name, date, source_url, fetched_at")
      .eq("district", district)
      .ilike("crop_name", crop_name)
      .gte("fetched_at", lookbackTime)
      .order("fetched_at", { ascending: false })
      .limit(50);

    if (pricesError) {
      throw new Error(`Failed to fetch prices: ${pricesError.message}`);
    }

    if (!prices || prices.length === 0) {
      console.log(`No recent prices found for ${crop_name} in ${district}`);
      return new Response(
        JSON.stringify({ success: true, message: "No prices to aggregate", aggregated: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Calculate aggregate metrics
    const modalPrices = prices.map((p) => p.modal_price).filter((p) => p != null) as number[];
    const sourceUrls = [...new Set(prices.map((p) => p.source_url).filter(Boolean))];
    const marketNames = [...new Set(prices.map((p) => p.market_name))];

    const aggregatedModalPrice = median(modalPrices);
    const cv = coefficientOfVariation(modalPrices);
    const sourcesCount = sourceUrls.length;

    // 3. Determine confidence based on sources and variance
    let confidence: "low" | "medium" | "high";
    
    if (sourcesCount >= 2 && cv <= 0.10) {
      // Multiple sources with <10% variance = high confidence
      confidence = "high";
    } else if (sourcesCount === 1 && cv <= 0.15) {
      // Single source with low variance = medium confidence
      confidence = "medium";
    } else if (sourcesCount >= 2 && cv > 0.10) {
      // Multiple sources but conflicting = low confidence
      confidence = "low";
    } else {
      confidence = "medium";
    }

    console.log(`Aggregated: ₹${aggregatedModalPrice}, confidence: ${confidence}, sources: ${sourcesCount}, CV: ${(cv * 100).toFixed(1)}%`);

    // 4. Upsert into market_prices_agg
    const aggData = {
      crop_name,
      district,
      state: "Karnataka",
      modal_price: aggregatedModalPrice,
      unit: "quintal",
      confidence,
      sources_count: sourcesCount,
      sources_used: marketNames,
      fetched_at: new Date().toISOString(),
    };

    // Try upsert first (requires unique constraint on district,crop_name)
    const { error: upsertError } = await supabase
      .from("market_prices_agg")
      .upsert(aggData, { 
        onConflict: "district,crop_name",
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.log("Upsert failed, trying delete + insert:", upsertError.message);
      
      // Fallback: delete existing and insert new
      await supabase
        .from("market_prices_agg")
        .delete()
        .eq("district", district)
        .eq("crop_name", crop_name);
      
      const { error: insertError } = await supabase
        .from("market_prices_agg")
        .insert(aggData);
      
      if (insertError) {
        console.warn("Insert also failed:", insertError.message);
      }
    }

    const latencyMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        aggregated: true,
        data: {
          crop_name,
          district,
          modal_price: aggregatedModalPrice,
          confidence,
          sources_count: sourcesCount,
          sources_used: marketNames,
          coefficient_of_variation: cv,
          prices_analyzed: prices.length,
        },
        latency_ms: latencyMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in aggregate-market-prices:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
