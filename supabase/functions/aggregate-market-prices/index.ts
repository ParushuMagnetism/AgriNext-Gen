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

// Calculate variance
function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { district, crop_name, hours_lookback = 6 } = await req.json();

    if (!district || !crop_name) {
      return new Response(
        JSON.stringify({ success: false, error: "district and crop_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Aggregating prices for ${crop_name} in ${district}`);

    // 1. Get recent market_prices for this district + crop
    const lookbackTime = new Date(Date.now() - hours_lookback * 60 * 60 * 1000).toISOString();

    const { data: prices, error: pricesError } = await supabase
      .from("market_prices")
      .select("id, modal_price, min_price, max_price, market_name, date, source_url")
      .eq("district", district)
      .ilike("crop_name", crop_name)
      .gte("date", lookbackTime.split("T")[0])
      .order("date", { ascending: false })
      .limit(20);

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
    const sources = [...new Set(prices.map((p) => p.market_name))];

    const aggregatedModalPrice = median(modalPrices);
    const priceVariance = variance(modalPrices);
    const sourcesCount = sources.length;

    // 3. Determine confidence
    let confidence: "low" | "medium" | "high";
    const coefficientOfVariation = priceVariance > 0 ? Math.sqrt(priceVariance) / aggregatedModalPrice : 0;

    if (sourcesCount >= 2 && coefficientOfVariation < 0.1) {
      confidence = "high";
    } else if (sourcesCount >= 1 && coefficientOfVariation < 0.25) {
      confidence = "medium";
    } else {
      confidence = "low";
    }

    console.log(`Aggregated: ₹${aggregatedModalPrice}, confidence: ${confidence}, sources: ${sourcesCount}`);

    // 4. Upsert into market_prices_agg
    const { error: upsertError } = await supabase
      .from("market_prices_agg")
      .upsert(
        {
          crop_name,
          district,
          state: "Karnataka",
          modal_price: aggregatedModalPrice,
          unit: "quintal",
          confidence,
          sources_count: sourcesCount,
          sources_used: sources,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "district,crop_name" }
      );

    // Note: If upsert fails due to no unique constraint, we'll insert instead
    if (upsertError) {
      // Try insert instead
      await supabase.from("market_prices_agg").insert({
        crop_name,
        district,
        state: "Karnataka",
        modal_price: aggregatedModalPrice,
        unit: "quintal",
        confidence,
        sources_count: sourcesCount,
        sources_used: sources,
        fetched_at: new Date().toISOString(),
      });
    }

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
          sources_used: sources,
        },
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
