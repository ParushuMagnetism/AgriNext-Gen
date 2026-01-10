import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to compute content hash
async function computeHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let logUrl = "";
  let logSourceId: string | null = null;

  try {
    const { url, source_id, segment_key } = await req.json();
    logUrl = url || "";
    logSourceId = source_id || null;

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl connector not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Firecrawl fetching:", formattedUrl);

    // Call Firecrawl API - single page fetch only (no deep crawl)
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown", "html"],
        onlyMainContent: true,
        waitFor: 3000,
        timeout: 30000,
      }),
    });

    const latencyMs = Date.now() - startTime;
    const responseData = await response.json();

    // Log the fetch attempt
    await supabase.from("web_fetch_logs").insert({
      endpoint: "firecrawl-fetch",
      source_id: source_id || null,
      segment_key: segment_key || null,
      query: formattedUrl,
      success: response.ok,
      latency_ms: latencyMs,
      http_status: response.status,
      cache_hit: false,
      response_size: JSON.stringify(responseData).length,
      error: response.ok ? null : (responseData.error || "Unknown error").substring(0, 500),
    });

    if (!response.ok) {
      console.error("Firecrawl API error:", responseData);

      // Still insert into web_documents with fail status
      if (source_id) {
        await supabase.from("web_documents").insert({
          source_id,
          url: formattedUrl,
          status: "fail",
          error: (responseData.error || `HTTP ${response.status}`).substring(0, 500),
        });
      }

      return new Response(
        JSON.stringify({ success: false, error: responseData.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract content
    const extractedText = responseData.data?.markdown || "";
    const extractedJson = responseData.data || null;
    const contentHash = await computeHash(extractedText);

    // Store in web_documents
    if (source_id) {
      await supabase.from("web_documents").insert({
        source_id,
        url: formattedUrl,
        extracted_text: extractedText.substring(0, 100000), // Limit size
        extracted_json: extractedJson,
        content_hash: contentHash,
        status: "success",
      });
    }

    console.log(`Firecrawl fetch successful, content length: ${extractedText.length}, latency: ${latencyMs}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          extracted_text: extractedText,
          extracted_json: extractedJson,
          content_hash: contentHash,
          url: formattedUrl,
          latency_ms: latencyMs,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error("Error in firecrawl-fetch:", error);

    // Log error
    await supabase.from("web_fetch_logs").insert({
      endpoint: "firecrawl-fetch",
      source_id: logSourceId,
      query: logUrl,
      success: false,
      latency_ms: latencyMs,
      error: (error instanceof Error ? error.message : "Unknown error").substring(0, 500),
    });

    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Failed to fetch" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
