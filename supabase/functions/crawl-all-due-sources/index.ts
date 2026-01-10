import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_SEGMENTS_PER_RUN = 20;
const MAX_SOURCES_PER_RUN = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const results = {
    segments_rebuilt: 0,
    segments_crawled: 0,
    sources_crawled: 0,
    errors: [] as string[],
  };

  try {
    console.log("Starting crawl-all-due-sources...");

    // 1. Rebuild farmer segments first
    try {
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
    const { data: dueSegments, error: segmentsError } = await supabase
      .from("farmer_segments")
      .select("*")
      .gt("active_farmer_count", 0)
      .order("last_crawled_at", { ascending: true, nullsFirst: true })
      .limit(MAX_SEGMENTS_PER_RUN);

    if (segmentsError) {
      results.errors.push(`Failed to fetch segments: ${segmentsError.message}`);
    } else {
      console.log(`Found ${dueSegments?.length || 0} segments to process`);

      // Filter to only due segments
      const now = Date.now();
      const segmentsToCrawl = (dueSegments || []).filter((s) => {
        if (!s.last_crawled_at) return true;
        const hoursSince = (now - new Date(s.last_crawled_at).getTime()) / (1000 * 60 * 60);
        return hoursSince >= (s.crawl_frequency_hours || 12);
      });

      console.log(`${segmentsToCrawl.length} segments are due for crawling`);

      // Crawl each due segment
      for (const segment of segmentsToCrawl.slice(0, MAX_SEGMENTS_PER_RUN)) {
        try {
          const crawlResponse = await supabase.functions.invoke("crawl-segment-prices", {
            body: { segment_key: segment.segment_key },
          });

          if (crawlResponse.data?.success) {
            results.segments_crawled++;
          } else {
            results.errors.push(`Segment ${segment.segment_key}: ${crawlResponse.data?.error || "Failed"}`);
          }
        } catch (err) {
          results.errors.push(`Segment ${segment.segment_key}: ${err instanceof Error ? err.message : "Unknown"}`);
        }

        // Small delay between segments to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // 3. Crawl advisory sources (daily)
    const { data: advisorySources } = await supabase
      .from("trusted_sources")
      .select("*")
      .eq("category", "advisory")
      .eq("active", true)
      .order("last_crawled_at", { ascending: true, nullsFirst: true })
      .limit(5);

    for (const source of advisorySources || []) {
      // Check if due
      if (source.last_crawled_at) {
        const hoursSince = (Date.now() - new Date(source.last_crawled_at).getTime()) / (1000 * 60 * 60);
        if (hoursSince < source.crawl_frequency_hours) continue;
      }

      try {
        const crawlResponse = await supabase.functions.invoke("crawl-source", {
          body: { source_id: source.id },
        });

        if (crawlResponse.data?.success) {
          results.sources_crawled++;
        }
      } catch (err) {
        results.errors.push(`Advisory source ${source.name}: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    // 4. Crawl scheme sources (weekly - only if last crawled > 7 days)
    const { data: schemeSources } = await supabase
      .from("trusted_sources")
      .select("*")
      .eq("category", "scheme")
      .eq("active", true)
      .order("last_crawled_at", { ascending: true, nullsFirst: true })
      .limit(3);

    for (const source of schemeSources || []) {
      // Check if due (weekly = 168 hours)
      if (source.last_crawled_at) {
        const hoursSince = (Date.now() - new Date(source.last_crawled_at).getTime()) / (1000 * 60 * 60);
        if (hoursSince < 168) continue;
      }

      try {
        const crawlResponse = await supabase.functions.invoke("crawl-source", {
          body: { source_id: source.id },
        });

        if (crawlResponse.data?.success) {
          results.sources_crawled++;
        }
      } catch (err) {
        results.errors.push(`Scheme source ${source.name}: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    console.log("Crawl-all complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        errors_count: results.errors.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in crawl-all-due-sources:", error);
    results.errors.push(error instanceof Error ? error.message : "Unknown error");
    
    return new Response(
      JSON.stringify({
        success: false,
        ...results,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
