import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const traceCode = url.searchParams.get("trace_code");

    if (!traceCode) {
      return new Response(
        JSON.stringify({ error: "trace_code parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1) Fetch listing with safe fields
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select(`
        trace_code,
        trace_status,
        title,
        category,
        quantity,
        unit,
        price,
        location,
        inputs_summary,
        test_report_urls,
        created_at,
        crop_id,
        trace_settings
      `)
      .eq("trace_code", traceCode)
      .eq("trace_status", "published")
      .single();

    if (listingError || !listing) {
      return new Response(
        JSON.stringify({ 
          error: "not_found",
          message: "This trace record is not available or has been unpublished." 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const settings = listing.trace_settings || {};

    // 2) Parse safe location
    let safeLocation = null;
    if (listing.location) {
      const parts = listing.location.split(',').map((p: string) => p.trim());
      if (settings.show_origin_level === 'district_village') {
        safeLocation = parts.slice(-3).join(', ') || listing.location;
      } else {
        safeLocation = parts.slice(-2).join(', ') || listing.location;
      }
    }

    // 3) Fetch crop details if linked and allowed
    let cropDetails = null;
    let cropTimeline = null;
    if (listing.crop_id) {
      if (settings.show_crop_details) {
        const { data: crop } = await supabase
          .from("crops")
          .select("crop_name, variety, sowing_date, harvest_estimate, status, growth_stage, land_id")
          .eq("id", listing.crop_id)
          .single();

        if (crop) {
          cropDetails = {
            crop_name: crop.crop_name,
            variety: crop.variety,
            sowing_date: crop.sowing_date,
            harvest_date: crop.harvest_estimate,
            status: crop.status,
            growth_stage: crop.growth_stage,
          };

          // Fetch farmland origin at safe level
          if (crop.land_id) {
            const { data: farmland } = await supabase
              .from("farmlands")
              .select("district, village")
              .eq("id", crop.land_id)
              .single();

            if (farmland) {
              cropDetails.origin_district = farmland.district;
              if (settings.show_origin_level === 'district_village') {
                cropDetails.origin_village = farmland.village;
              }
            }
          }
        }
      }

      // Crop timeline (activity logs)
      if (settings.show_crop_timeline) {
        const { data: activities } = await supabase
          .from("crop_activity_logs")
          .select("activity_type, activity_at, notes")
          .eq("crop_id", listing.crop_id)
          .order("activity_at", { ascending: true })
          .limit(20);

        if (activities && activities.length > 0) {
          cropTimeline = activities.map((a: any) => ({
            type: a.activity_type,
            date: a.activity_at,
            notes: a.notes,
          }));
        }
      }
    }

    // 4) Fetch public evidence attachments
    const evidence: Record<string, any[]> = {};

    // Find the listing ID to query attachments
    const { data: listingIdRow } = await supabase
      .from("listings")
      .select("id")
      .eq("trace_code", traceCode)
      .single();

    if (listingIdRow) {
      const listingId = listingIdRow.id;

      if (settings.show_stage_photos) {
        const { data: stagePhotos } = await supabase
          .from("trace_attachments")
          .select("file_url, file_type, captured_at, notes")
          .eq("owner_type", "listing")
          .eq("owner_id", listingId)
          .eq("tag", "stage_photo")
          .eq("visibility", "public_on_qr")
          .order("captured_at", { ascending: true })
          .limit(10);

        if (stagePhotos && stagePhotos.length > 0) {
          evidence.stage_photos = stagePhotos.map((p: any) => ({
            url: `${supabaseUrl}/storage/v1/object/public/traceability-media/${p.file_url}`,
            date: p.captured_at,
            notes: p.notes,
          }));
        }
      }

      if (settings.show_input_photos) {
        const { data: inputPhotos } = await supabase
          .from("trace_attachments")
          .select("file_url, file_type, captured_at, notes")
          .eq("owner_type", "listing")
          .eq("owner_id", listingId)
          .eq("tag", "input_proof")
          .eq("visibility", "public_on_qr")
          .order("captured_at", { ascending: true })
          .limit(10);

        if (inputPhotos && inputPhotos.length > 0) {
          evidence.input_photos = inputPhotos.map((p: any) => ({
            url: `${supabaseUrl}/storage/v1/object/public/traceability-media/${p.file_url}`,
            date: p.captured_at,
            notes: p.notes,
          }));
        }
      }

      if (settings.show_soil_report) {
        const { data: soilReports } = await supabase
          .from("trace_attachments")
          .select("file_url, file_type, captured_at, notes")
          .eq("owner_type", "listing")
          .eq("owner_id", listingId)
          .eq("tag", "soil_report")
          .eq("visibility", "public_on_qr")
          .order("captured_at", { ascending: true })
          .limit(5);

        if (soilReports && soilReports.length > 0) {
          evidence.soil_reports = soilReports.map((p: any) => ({
            url: `${supabaseUrl}/storage/v1/object/public/traceability-media/${p.file_url}`,
            type: p.file_type,
            date: p.captured_at,
            notes: p.notes,
          }));
        }
      }
    }

    // 5) Build response
    const publicData: any = {
      trace_code: listing.trace_code,
      product_name: listing.title,
      category: listing.category,
      quantity: listing.quantity,
      unit: listing.unit,
      price: listing.price,
      origin: safeLocation,
      inputs_summary: listing.inputs_summary,
      test_report_urls: listing.test_report_urls || [],
      listed_at: listing.created_at,
      verified: true,
      platform: "AgriNext Gen",
    };

    if (cropDetails) {
      publicData.crop = cropDetails;
    }

    if (cropTimeline) {
      publicData.crop_timeline = cropTimeline;
    }

    if (Object.keys(evidence).length > 0) {
      publicData.evidence = evidence;
    }

    return new Response(
      JSON.stringify(publicData),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Error in public-listing-trace:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
