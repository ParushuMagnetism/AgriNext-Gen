import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extract advisory information from crawled content
function extractAdvisories(
  content: string,
  district: string,
  sourceUrl: string,
  sourceName: string
): Array<{
  state: string;
  district: string | null;
  crop_name: string | null;
  title: string;
  summary: string;
  recommended_actions: string | null;
  published_date: string | null;
  source_url: string;
}> {
  const advisories: Array<any> = [];
  
  // Split content into potential advisory sections
  const sections = content.split(/(?:\n#{1,3}\s|\n\*\*|---)/);
  
  // Common agricultural keywords
  const agriKeywords = [
    'crop', 'harvest', 'sowing', 'irrigation', 'fertilizer', 'pesticide',
    'weather', 'rainfall', 'disease', 'pest', 'farmer', 'advisory',
    'recommendation', 'action', 'alert', 'warning', 'notice'
  ];
  
  for (const section of sections) {
    const trimmed = section.trim();
    if (trimmed.length < 100) continue;
    
    // Check if section is agriculture-related
    const lowerSection = trimmed.toLowerCase();
    const isAgriRelated = agriKeywords.some(kw => lowerSection.includes(kw));
    
    if (isAgriRelated) {
      // Extract title (first line or first sentence)
      const lines = trimmed.split('\n');
      const title = lines[0].replace(/[#*]/g, '').trim().substring(0, 200);
      
      // Extract summary (first 500 chars of meaningful content)
      const summary = lines.slice(0, 5).join(' ')
        .replace(/[#*]/g, '')
        .trim()
        .substring(0, 1000);
      
      // Try to extract crop name
      const cropPatterns = [
        /(?:for|on|of)\s+(\w+(?:\s+\w+)?)\s+(?:crop|cultivation|farming)/i,
        /(\w+)\s+(?:growers?|farmers?|cultivation)/i,
      ];
      let cropName: string | null = null;
      for (const pattern of cropPatterns) {
        const match = summary.match(pattern);
        if (match) {
          cropName = match[1];
          break;
        }
      }
      
      // Try to extract recommended actions
      const actionPatterns = [
        /(?:recommended?|action|do|apply|use|spray|irrigate)[:\s]+([^.]+\.)/gi,
        /(?:farmers?\s+(?:should|must|are\s+advised))[:\s]+([^.]+\.)/gi,
      ];
      let actions: string[] = [];
      for (const pattern of actionPatterns) {
        let match;
        while ((match = pattern.exec(summary)) !== null) {
          actions.push(match[1].trim());
        }
      }
      
      // Try to extract date
      const datePatterns = [
        /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/,
        /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i,
      ];
      let publishedDate: string | null = null;
      for (const pattern of datePatterns) {
        const match = summary.match(pattern);
        if (match) {
          try {
            publishedDate = new Date(match[0]).toISOString().split('T')[0];
          } catch {
            // Invalid date, skip
          }
          break;
        }
      }
      
      if (title.length > 10) {
        advisories.push({
          state: "Karnataka",
          district: district || null,
          crop_name: cropName,
          title: title || `Advisory from ${sourceName}`,
          summary,
          recommended_actions: actions.length > 0 ? actions.join('; ') : null,
          published_date: publishedDate,
          source_url: sourceUrl,
        });
      }
    }
  }
  
  // If no structured advisories found, create one from the whole content
  if (advisories.length === 0 && content.length > 200) {
    advisories.push({
      state: "Karnataka",
      district: district || null,
      crop_name: null,
      title: `Advisory from ${sourceName}`,
      summary: content.substring(0, 1000),
      recommended_actions: null,
      published_date: null,
      source_url: sourceUrl,
    });
  }
  
  return advisories.slice(0, 5); // Max 5 advisories per source
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
    const { district, force = false } = await req.json();

    if (!district) {
      return new Response(
        JSON.stringify({ success: false, error: "district is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Crawling advisories for district: ${district}`);

    // 1. Find advisory sources for this district
    const { data: sources, error: sourcesError } = await supabase
      .from("trusted_sources")
      .select("*")
      .eq("category", "advisory")
      .eq("active", true)
      .or(`district.is.null,district.ilike.%${district}%`)
      .order("priority", { ascending: true })
      .limit(3);

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    }

    console.log(`Found ${sources?.length || 0} advisory sources`);

    const crawlResults: Array<{
      source: string;
      success: boolean;
      advisories_extracted: number;
      error?: string;
    }> = [];

    let totalAdvisories = 0;

    for (const source of sources || []) {
      // Check TTL (default 24h for advisories)
      const ttlHours = source.crawl_frequency_hours || 24;
      
      if (!force && source.last_crawled_at) {
        const hoursSince = (Date.now() - new Date(source.last_crawled_at).getTime()) / (1000 * 60 * 60);
        if (hoursSince < ttlHours) {
          console.log(`Skipping ${source.name}, crawled ${hoursSince.toFixed(1)}h ago`);
          crawlResults.push({
            source: source.name,
            success: true,
            advisories_extracted: 0,
            error: "Skipped - within TTL",
          });
          continue;
        }
      }

      try {
        // Call firecrawl-fetch
        const crawlResponse = await supabase.functions.invoke("firecrawl-fetch", {
          body: { 
            url: source.url, 
            source_id: source.id,
          },
        });

        if (crawlResponse.data?.success) {
          const extractedText = crawlResponse.data.data?.extracted_text || "";
          
          // Extract advisories from content
          const advisories = extractAdvisories(
            extractedText,
            district,
            source.url,
            source.name
          );

          // Insert advisories
          for (const advisory of advisories) {
            const { error: insertError } = await supabase
              .from("agri_advisories")
              .insert(advisory);
            
            if (!insertError) {
              totalAdvisories++;
            }
          }

          crawlResults.push({
            source: source.name,
            success: true,
            advisories_extracted: advisories.length,
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
            advisories_extracted: 0,
            error: crawlResponse.error?.message || crawlResponse.data?.error,
          });
        }
      } catch (err) {
        crawlResults.push({
          source: source.name,
          success: false,
          advisories_extracted: 0,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const latencyMs = Date.now() - startTime;

    // Log the crawl
    await supabase.from("web_fetch_logs").insert({
      endpoint: "crawl-district-advisories",
      query: district,
      success: true,
      cache_hit: false,
      latency_ms: latencyMs,
    });

    console.log(`District ${district} advisories crawl complete: ${totalAdvisories} advisories in ${latencyMs}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        district,
        sources_crawled: crawlResults.length,
        advisories_created: totalAdvisories,
        crawl_results: crawlResults,
        latency_ms: latencyMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error("Error in crawl-district-advisories:", error);

    await supabase.from("web_fetch_logs").insert({
      endpoint: "crawl-district-advisories",
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
