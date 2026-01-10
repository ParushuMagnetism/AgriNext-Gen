import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { segment_key, force = false } = await req.json();

    if (!segment_key) {
      return new Response(
        JSON.stringify({ success: false, error: "segment_key is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse segment key: "karnataka:<district>:<crop>"
    const parts = segment_key.split(":");
    if (parts.length !== 3) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid segment_key format. Expected: karnataka:<district>:<crop>" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const [, districtKey, cropKey] = parts;
    const district = districtKey.replace(/_/g, " ");
    const crop = cropKey.replace(/_/g, " ");

    console.log(`Crawling segment prices for ${crop} in ${district}`);

    // 1. Get segment info
    const { data: segment } = await supabase
      .from("farmer_segments")
      .select("*")
      .eq("segment_key", segment_key)
      .single();

    // Check TTL
    if (!force && segment?.last_crawled_at) {
      const lastCrawled = new Date(segment.last_crawled_at);
      const hoursSince = (Date.now() - lastCrawled.getTime()) / (1000 * 60 * 60);
      
      if (hoursSince < (segment.crawl_frequency_hours || 12)) {
        console.log(`Skipping segment ${segment_key}, crawled ${hoursSince.toFixed(1)}h ago`);
        return new Response(
          JSON.stringify({ success: true, cache_hit: true, message: "Skipped - within TTL" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 2. Find trusted sources for this segment
    const { data: sources, error: sourcesError } = await supabase
      .from("trusted_sources")
      .select("*")
      .eq("category", "mandi")
      .eq("active", true)
      .or(`district.is.null,district.ilike.%${district}%`)
      .or(`crop_canonical.is.null,crop_canonical.ilike.%${crop}%`)
      .order("priority", { ascending: true })
      .limit(2); // Max 2 sources for cross-validation

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    }

    console.log(`Found ${sources?.length || 0} sources for segment`);

    // 3. Crawl each source
    const crawlResults = [];
    
    for (const source of sources || []) {
      try {
        const crawlResponse = await supabase.functions.invoke("crawl-source", {
          body: { source_id: source.id, force },
        });

        crawlResults.push({
          source: source.name,
          success: crawlResponse.data?.success || false,
          error: crawlResponse.error?.message || crawlResponse.data?.error,
        });
      } catch (err) {
        crawlResults.push({
          source: source.name,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // 4. Run aggregation
    const aggResponse = await supabase.functions.invoke("aggregate-market-prices", {
      body: { district, crop_name: crop },
    });

    // 5. Update segment last_crawled_at
    await supabase
      .from("farmer_segments")
      .update({ last_crawled_at: new Date().toISOString() })
      .eq("segment_key", segment_key);

    console.log(`Segment ${segment_key} crawl complete`);

    return new Response(
      JSON.stringify({
        success: true,
        segment_key,
        district,
        crop,
        sources_crawled: crawlResults.length,
        crawl_results: crawlResults,
        aggregation: aggResponse.data,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in crawl-segment-prices:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
