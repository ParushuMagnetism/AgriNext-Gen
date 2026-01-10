import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Parse price from text (handles ₹, Rs, commas, etc.)
function parsePrice(text: string | null | undefined): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[₹Rs.,\s]/gi, "").trim();
  const num = parseFloat(cleaned);
  // Validate: reject negative, zero, or absurdly high prices
  if (isNaN(num) || num <= 0 || num > 500000) return null;
  return num;
}

// Extract price data from markdown/text content
function extractPricesFromContent(
  content: string,
  district: string,
  crop: string,
  sourceUrl: string
): Array<{
  crop_name: string;
  market_name: string;
  district: string;
  state: string;
  min_price: number | null;
  max_price: number | null;
  modal_price: number;
  unit: string;
  source_url: string;
}> {
  const prices: Array<any> = [];
  
  // Look for price patterns in the content
  // Pattern 1: "Crop: Price" or "Crop - Price"
  const pricePatterns = [
    /(\w+(?:\s+\w+)?)\s*[:|-]\s*(?:₹|Rs\.?)\s*([\d,]+(?:\.\d{2})?)/gi,
    /(?:modal|price|rate)\s*[:|-]?\s*(?:₹|Rs\.?)\s*([\d,]+(?:\.\d{2})?)/gi,
  ];

  // Try to find a table structure with prices
  const lines = content.split('\n');
  let foundPrices = false;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Check if this line mentions our crop
    if (lowerLine.includes(crop.toLowerCase())) {
      // Try to extract prices from this line
      const numbers = line.match(/[\d,]+(?:\.\d{2})?/g);
      if (numbers && numbers.length > 0) {
        const parsedNumbers = numbers
          .map(n => parseFloat(n.replace(/,/g, '')))
          .filter(n => !isNaN(n) && n > 100 && n < 50000);
        
        if (parsedNumbers.length > 0) {
          // Sort to get min, max, modal
          parsedNumbers.sort((a, b) => a - b);
          const modal = parsedNumbers.length >= 3 
            ? parsedNumbers[Math.floor(parsedNumbers.length / 2)]
            : parsedNumbers[parsedNumbers.length - 1];
          
          prices.push({
            crop_name: crop,
            market_name: `${district} Regional Mandi`,
            district,
            state: "Karnataka",
            min_price: parsedNumbers[0] || null,
            max_price: parsedNumbers[parsedNumbers.length - 1] || null,
            modal_price: modal,
            unit: "quintal",
            source_url: sourceUrl,
          });
          foundPrices = true;
          break;
        }
      }
    }
  }

  // If no specific crop prices found, try generic extraction
  if (!foundPrices) {
    for (const pattern of pricePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const price = parsePrice(match[2] || match[1]);
        if (price && price > 100 && price < 50000) {
          prices.push({
            crop_name: crop,
            market_name: `${district} Regional Mandi`,
            district,
            state: "Karnataka",
            min_price: null,
            max_price: null,
            modal_price: price,
            unit: "quintal",
            source_url: sourceUrl,
          });
          break;
        }
      }
    }
  }

  return prices;
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
    const district = districtKey.replace(/_/g, " ").split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    const crop = cropKey.replace(/_/g, " ").split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    console.log(`Crawling segment prices for ${crop} in ${district}`);

    // 1. Get segment info and check TTL
    const { data: segment } = await supabase
      .from("farmer_segments")
      .select("*")
      .eq("segment_key", segment_key)
      .single();

    if (!force && segment?.last_crawled_at) {
      const lastCrawled = new Date(segment.last_crawled_at);
      const hoursSince = (Date.now() - lastCrawled.getTime()) / (1000 * 60 * 60);
      
      if (hoursSince < (segment.crawl_frequency_hours || 12)) {
        console.log(`Skipping segment ${segment_key}, crawled ${hoursSince.toFixed(1)}h ago`);
        
        // Log cache hit
        await supabase.from("web_fetch_logs").insert({
          endpoint: "crawl-segment-prices",
          segment_key,
          query: `${crop} in ${district}`,
          success: true,
          cache_hit: true,
          latency_ms: Date.now() - startTime,
        });

        return new Response(
          JSON.stringify({ success: true, cache_hit: true, message: "Skipped - within TTL" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 2. Find trusted sources for this segment (up to 2 for cross-validation)
    const { data: sources, error: sourcesError } = await supabase
      .from("trusted_sources")
      .select("*")
      .eq("category", "mandi")
      .eq("active", true)
      .or(`district.is.null,district.ilike.%${district}%`)
      .or(`crop_canonical.is.null,crop_canonical.ilike.%${crop}%`)
      .order("priority", { ascending: true })
      .limit(2);

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    }

    console.log(`Found ${sources?.length || 0} sources for segment`);

    // 3. Crawl each source and extract prices
    const crawlResults: Array<{
      source: string;
      success: boolean;
      prices_extracted: number;
      error?: string;
    }> = [];
    
    const allPrices: Array<any> = [];

    for (const source of sources || []) {
      try {
        // Call firecrawl-fetch
        const crawlResponse = await supabase.functions.invoke("firecrawl-fetch", {
          body: { 
            url: source.url, 
            source_id: source.id,
            segment_key,
          },
        });

        if (crawlResponse.data?.success) {
          const extractedText = crawlResponse.data.data?.extracted_text || "";
          
          // Extract prices from content
          const prices = extractPricesFromContent(
            extractedText,
            district,
            crop,
            source.url
          );

          allPrices.push(...prices);

          crawlResults.push({
            source: source.name,
            success: true,
            prices_extracted: prices.length,
          });

          // Update source last_crawled_at
          await supabase
            .from("trusted_sources")
            .update({ last_crawled_at: new Date().toISOString() })
            .eq("id", source.id);
        } else {
          crawlResults.push({
            source: source.name,
            success: false,
            prices_extracted: 0,
            error: crawlResponse.error?.message || crawlResponse.data?.error,
          });
        }
      } catch (err) {
        crawlResults.push({
          source: source.name,
          success: false,
          prices_extracted: 0,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // 4. Insert extracted prices into market_prices (history)
    let insertedPrices = 0;
    if (allPrices.length > 0) {
      const pricesToInsert = allPrices.map(p => ({
        ...p,
        date: new Date().toISOString().split('T')[0],
        fetched_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from("market_prices")
        .insert(pricesToInsert);

      if (!insertError) {
        insertedPrices = pricesToInsert.length;
      } else {
        console.warn("Failed to insert prices:", insertError.message);
      }

      // Also insert raw data for debugging
      for (const price of allPrices) {
        await supabase.from("market_prices_raw").insert({
          crop_name: price.crop_name,
          mandi_name: price.market_name,
          district: price.district,
          state: price.state,
          raw_json: price,
          source_url: price.source_url,
        });
      }
    }

    // 5. Run aggregation
    if (insertedPrices > 0 || allPrices.length > 0) {
      await supabase.functions.invoke("aggregate-market-prices", {
        body: { district, crop_name: crop },
      });
    }

    // 6. Update segment last_crawled_at
    await supabase
      .from("farmer_segments")
      .update({ last_crawled_at: new Date().toISOString() })
      .eq("segment_key", segment_key);

    const latencyMs = Date.now() - startTime;

    // 7. Log the crawl
    await supabase.from("web_fetch_logs").insert({
      endpoint: "crawl-segment-prices",
      segment_key,
      query: `${crop} in ${district}`,
      success: true,
      cache_hit: false,
      latency_ms: latencyMs,
    });

    console.log(`Segment ${segment_key} crawl complete in ${latencyMs}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        segment_key,
        district,
        crop,
        sources_crawled: crawlResults.length,
        prices_extracted: allPrices.length,
        prices_inserted: insertedPrices,
        crawl_results: crawlResults,
        latency_ms: latencyMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error("Error in crawl-segment-prices:", error);

    await supabase.from("web_fetch_logs").insert({
      endpoint: "crawl-segment-prices",
      success: false,
      latency_ms: latencyMs,
      error: (error instanceof Error ? error.message : "Unknown error").substring(0, 500),
    });

    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
