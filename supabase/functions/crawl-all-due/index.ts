import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_SEGMENTS_PER_RUN = 20;
const DELAY_BETWEEN_CRAWLS_MS = 1500; // Rate limiting

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const results = {
    segments_rebuilt: 0,
    segments_crawled: 0,
    districts_crawled: 0,
    sources_crawled: 0,
    errors: [] as string[],
  };

  try {
    console.log("Starting crawl-all-due...");

    // 1. Rebuild farmer segments first
    try {
      console.log("Step 1: Rebuilding farmer segments...");
      const rebuildResponse = await supabase.functions.invoke("rebuild-farmer-segments", {
        body: {},
      });
      
      if (rebuildResponse.data?.success) {
        results.segments_rebuilt = rebuildResponse.data.segments_created || 0;
        console.log(`Rebuilt ${results.segments_rebuilt} farmer segments`);
      } else {
        results.errors.push(`Segment rebuild failed: ${rebuildResponse.data?.error || "Unknown"}`);
      }
    } catch (err) {
      results.errors.push(`Segment rebuild error: ${err instanceof Error ? err.message : "Unknown"}`);
    }

    // 2. Get due segments (active_farmer_count > 0 and past TTL)
    console.log("Step 2: Fetching due segments...");
    const { data: allSegments, error: segmentsError } = await supabase
      .from("farmer_segments")
      .select("*")
      .gt("active_farmer_count", 0)
      .order("last_crawled_at", { ascending: true, nullsFirst: true });

    if (segmentsError) {
      results.errors.push(`Failed to fetch segments: ${segmentsError.message}`);
    } else {
      // Filter to only due segments
      const now = Date.now();
      const dueSegments = (allSegments || []).filter((s) => {
        if (!s.last_crawled_at) return true;
        const hoursSince = (now - new Date(s.last_crawled_at).getTime()) / (1000 * 60 * 60);
        return hoursSince >= (s.crawl_frequency_hours || 12);
      });

      console.log(`Found ${dueSegments.length} segments due for crawling (max ${MAX_SEGMENTS_PER_RUN})`);

      // Crawl each due segment with rate limiting
      for (const segment of dueSegments.slice(0, MAX_SEGMENTS_PER_RUN)) {
        try {
          console.log(`Crawling segment: ${segment.segment_key}`);
          const crawlResponse = await supabase.functions.invoke("crawl-segment-prices", {
            body: { segment_key: segment.segment_key },
          });

          if (crawlResponse.data?.success) {
            results.segments_crawled++;
          } else if (!crawlResponse.data?.cache_hit) {
            results.errors.push(`Segment ${segment.segment_key}: ${crawlResponse.data?.error || "Failed"}`);
          }
        } catch (err) {
          results.errors.push(`Segment ${segment.segment_key}: ${err instanceof Error ? err.message : "Unknown"}`);
        }

        // Rate limiting delay
        await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_CRAWLS_MS));
      }
    }

    // 3. Crawl advisories per district (for districts with active farmers)
    console.log("Step 3: Crawling district advisories...");
    const activeDistricts = [...new Set((allSegments || [])
      .filter(s => s.active_farmer_count > 0)
      .map(s => s.district))];

    for (const district of activeDistricts.slice(0, 5)) { // Max 5 districts per run
      try {
        console.log(`Crawling advisories for: ${district}`);
        const advResponse = await supabase.functions.invoke("crawl-district-advisories", {
          body: { district },
        });

        if (advResponse.data?.success) {
          results.districts_crawled++;
        }
      } catch (err) {
        results.errors.push(`District ${district} advisories: ${err instanceof Error ? err.message : "Unknown"}`);
      }

      // Rate limiting delay
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_CRAWLS_MS));
    }

    // 4. Crawl scheme sources (weekly - only if last crawled > 7 days)
    console.log("Step 4: Checking scheme sources...");
    const { data: schemeSources } = await supabase
      .from("trusted_sources")
      .select("*")
      .eq("category", "scheme")
      .eq("active", true)
      .order("last_crawled_at", { ascending: true, nullsFirst: true })
      .limit(2);

    for (const source of schemeSources || []) {
      // Check if due (weekly = 168 hours)
      if (source.last_crawled_at) {
        const hoursSince = (Date.now() - new Date(source.last_crawled_at).getTime()) / (1000 * 60 * 60);
        if (hoursSince < 168) continue;
      }

      try {
        console.log(`Crawling scheme source: ${source.name}`);
        const crawlResponse = await supabase.functions.invoke("crawl-source", {
          body: { source_id: source.id },
        });

        if (crawlResponse.data?.success) {
          results.sources_crawled++;
        }
      } catch (err) {
        results.errors.push(`Scheme source ${source.name}: ${err instanceof Error ? err.message : "Unknown"}`);
      }

      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_CRAWLS_MS));
    }

    const latencyMs = Date.now() - startTime;

    // Log the full run
    await supabase.from("web_fetch_logs").insert({
      endpoint: "crawl-all-due",
      query: `segments: ${results.segments_crawled}, districts: ${results.districts_crawled}`,
      success: results.errors.length === 0,
      latency_ms: latencyMs,
      error: results.errors.length > 0 ? results.errors.slice(0, 3).join('; ').substring(0, 500) : null,
    });

    console.log(`Crawl-all-due complete in ${latencyMs}ms:`, results);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        errors_count: results.errors.length,
        latency_ms: latencyMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error("Error in crawl-all-due:", error);
    results.errors.push(error instanceof Error ? error.message : "Unknown error");
    
    await supabase.from("web_fetch_logs").insert({
      endpoint: "crawl-all-due",
      success: false,
      latency_ms: latencyMs,
      error: (error instanceof Error ? error.message : "Unknown error").substring(0, 500),
    });

    return new Response(
      JSON.stringify({
        success: false,
        ...results,
        error: error instanceof Error ? error.message : "Unknown error",
        latency_ms: latencyMs,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
