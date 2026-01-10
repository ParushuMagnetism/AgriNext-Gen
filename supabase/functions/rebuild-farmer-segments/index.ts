import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Starting farmer segments rebuild...");

    // 1. Get all active crops with farmer profiles (district must be set)
    const { data: activeCrops, error: cropsError } = await supabase
      .from("crops")
      .select(`
        id,
        crop_name,
        farmer_id,
        profiles!inner(id, district)
      `)
      .neq("status", "harvested");

    if (cropsError) {
      throw new Error(`Failed to fetch crops: ${cropsError.message}`);
    }

    console.log(`Found ${activeCrops?.length || 0} active crops`);

    // 2. Get crop aliases for normalization
    const { data: aliases } = await supabase
      .from("crop_aliases")
      .select("canonical_name, alias");

    const aliasMap = new Map<string, string>();
    aliases?.forEach((a) => {
      aliasMap.set(a.alias.toLowerCase().trim(), a.canonical_name);
    });

    // Helper to normalize crop name
    const normalizeCropName = (name: string): string => {
      const lower = name.toLowerCase().trim();
      // Check alias map first
      if (aliasMap.has(lower)) {
        return aliasMap.get(lower)!;
      }
      // Title case the original if no alias found
      return name.trim().split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    // 3. Aggregate by district + crop
    const segmentCounts = new Map<string, { district: string; crop: string; count: number; farmerIds: Set<string> }>();

    for (const crop of activeCrops || []) {
      const profile = crop.profiles as any;
      const district = profile?.district;

      if (!district) continue;

      const canonicalCrop = normalizeCropName(crop.crop_name);
      const districtKey = district.toLowerCase().replace(/\s+/g, "_");
      const cropKey = canonicalCrop.toLowerCase().replace(/\s+/g, "_");
      const segmentKey = `karnataka:${districtKey}:${cropKey}`;

      const existing = segmentCounts.get(segmentKey);
      if (existing) {
        existing.farmerIds.add(crop.farmer_id);
        existing.count = existing.farmerIds.size;
      } else {
        segmentCounts.set(segmentKey, {
          district,
          crop: canonicalCrop,
          count: 1,
          farmerIds: new Set([crop.farmer_id]),
        });
      }
    }

    console.log(`Generated ${segmentCounts.size} segments`);

    // 4. Upsert segments into farmer_segments table
    const segmentsToUpsert = Array.from(segmentCounts.entries()).map(([key, data]) => ({
      segment_key: key,
      state: "Karnataka",
      district: data.district,
      crop_canonical: data.crop,
      active_farmer_count: data.count,
      crawl_frequency_hours: 12,
      updated_at: new Date().toISOString(),
    }));

    if (segmentsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from("farmer_segments")
        .upsert(segmentsToUpsert, { onConflict: "segment_key" });

      if (upsertError) {
        throw new Error(`Failed to upsert segments: ${upsertError.message}`);
      }
    }

    // 5. Mark segments with 0 active farmers (for segments that no longer have active crops)
    const activeSegmentKeys = Array.from(segmentCounts.keys());
    
    if (activeSegmentKeys.length > 0) {
      // Set active_farmer_count to 0 for segments not in our list
      const { error: updateError } = await supabase
        .from("farmer_segments")
        .update({ active_farmer_count: 0, updated_at: new Date().toISOString() })
        .not("segment_key", "in", `(${activeSegmentKeys.map(k => `'${k}'`).join(",")})`);
      
      if (updateError) {
        console.warn("Warning: Failed to zero out inactive segments:", updateError.message);
      }
    }

    const latencyMs = Date.now() - startTime;

    // 6. Log the rebuild operation
    await supabase.from("web_fetch_logs").insert({
      endpoint: "rebuild-farmer-segments",
      query: `segments: ${segmentsToUpsert.length}`,
      success: true,
      latency_ms: latencyMs,
      cache_hit: false,
    });

    console.log(`Farmer segments rebuild complete in ${latencyMs}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        segments_created: segmentsToUpsert.length,
        latency_ms: latencyMs,
        segments: segmentsToUpsert.map((s) => ({
          key: s.segment_key,
          district: s.district,
          crop: s.crop_canonical,
          farmers: s.active_farmer_count,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error("Error rebuilding farmer segments:", error);
    
    // Log the failure
    await supabase.from("web_fetch_logs").insert({
      endpoint: "rebuild-farmer-segments",
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
