import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Parse price from text (handles ₹, Rs, commas, etc.)
function parsePrice(text: string | null | undefined): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[₹Rs.,\s]/gi, "");
  const num = parseFloat(cleaned);
  if (isNaN(num) || num < 0 || num > 1000000) return null;
  return num;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { source_id, force = false } = await req.json();

    if (!source_id) {
      return new Response(
        JSON.stringify({ success: false, error: "source_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Load trusted_sources row
    const { data: source, error: sourceError } = await supabase
      .from("trusted_sources")
      .select("*")
      .eq("id", source_id)
      .single();

    if (sourceError || !source) {
      return new Response(
        JSON.stringify({ success: false, error: "Source not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!source.active) {
      return new Response(
        JSON.stringify({ success: false, error: "Source is inactive" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check TTL (skip if recently crawled)
    if (!force && source.last_crawled_at) {
      const lastCrawled = new Date(source.last_crawled_at);
      const hoursSince = (Date.now() - lastCrawled.getTime()) / (1000 * 60 * 60);
      
      if (hoursSince < source.crawl_frequency_hours) {
        console.log(`Skipping ${source.name}, crawled ${hoursSince.toFixed(1)}h ago`);
        return new Response(
          JSON.stringify({ success: true, cache_hit: true, message: "Skipped - within TTL" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 3. Call firecrawl-fetch
    console.log(`Crawling source: ${source.name} (${source.url})`);
    
    const fetchResponse = await supabase.functions.invoke("firecrawl-fetch", {
      body: { url: source.url, source_id: source.id },
    });

    if (fetchResponse.error || !fetchResponse.data?.success) {
      const errorMsg = fetchResponse.error?.message || fetchResponse.data?.error || "Fetch failed";
      console.error(`Firecrawl fetch failed for ${source.name}:`, errorMsg);
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { extracted_text, extracted_json, content_hash } = fetchResponse.data.data;

    // 4. Check if content changed (compare hash with last successful doc)
    const { data: lastDoc } = await supabase
      .from("web_documents")
      .select("content_hash")
      .eq("source_id", source_id)
      .eq("status", "success")
      .order("fetched_at", { ascending: false })
      .limit(2); // Get last 2 to compare with previous

    const previousHash = lastDoc && lastDoc.length > 1 ? lastDoc[1].content_hash : null;
    
    if (!force && previousHash && previousHash === content_hash) {
      console.log(`Content unchanged for ${source.name}, skipping normalization`);
      
      // Update last_crawled_at anyway
      await supabase
        .from("trusted_sources")
        .update({ last_crawled_at: new Date().toISOString() })
        .eq("id", source_id);

      return new Response(
        JSON.stringify({ success: true, unchanged: true, message: "Content unchanged" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Normalize into clean tables based on category
    let normalized = 0;

    switch (source.category) {
      case "mandi":
        // For mandi prices, we would parse tables from extracted content
        // This is a simplified version - real implementation would use AI or regex
        console.log(`Mandi source crawled: ${source.name}`);
        // TODO: Parse mandi price tables and insert into market_prices
        break;

      case "advisory":
        // Parse advisories
        if (extracted_text && extracted_text.length > 100) {
          await supabase.from("agri_advisories").insert({
            state: source.state || "Karnataka",
            district: source.district,
            crop_name: source.crop_canonical,
            title: `Advisory from ${source.name}`,
            summary: extracted_text.substring(0, 1000),
            source_url: source.url,
          });
          normalized++;
        }
        break;

      case "scheme":
        // Parse schemes
        if (extracted_text && extracted_text.length > 100) {
          await supabase.from("schemes_catalog").insert({
            state: source.state || "Karnataka",
            scheme_name: `Scheme from ${source.name}`,
            eligibility: extracted_text.substring(0, 500),
            benefits: extracted_text.substring(500, 1000),
            official_link: source.url,
          });
          normalized++;
        }
        break;

      case "calendar":
        console.log(`Crop calendar source crawled: ${source.name}`);
        break;

      case "input_price":
        console.log(`Input price source crawled: ${source.name}`);
        break;

      case "news":
        console.log(`News source crawled: ${source.name}`);
        break;
    }

    // 6. Update last_crawled_at
    await supabase
      .from("trusted_sources")
      .update({ last_crawled_at: new Date().toISOString() })
      .eq("id", source_id);

    console.log(`Source ${source.name} crawled successfully, normalized: ${normalized}`);

    return new Response(
      JSON.stringify({
        success: true,
        source: source.name,
        category: source.category,
        content_length: extracted_text?.length || 0,
        normalized_records: normalized,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in crawl-source:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
