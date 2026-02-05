 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   // Handle CORS preflight
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
 
     // Create Supabase client with service role for public access
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
     // Query ONLY safe public fields - NO seller_id, NO private info
     const { data, error } = await supabase
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
         created_at
       `)
       .eq("trace_code", traceCode)
       .eq("trace_status", "published")
       .single();
 
     if (error || !data) {
       return new Response(
         JSON.stringify({ 
           error: "not_found",
           message: "This trace record is not available or has been unpublished." 
         }),
         { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Parse location for safe display (only district/state, not exact address)
     let safeLocation = null;
     if (data.location) {
       // Extract only district/state level info, not full address
       const locationParts = data.location.split(',').map((p: string) => p.trim());
       // Take last 2 parts typically (district, state)
       safeLocation = locationParts.slice(-2).join(', ') || data.location;
     }
 
     // Return ONLY safe public data
     const publicData = {
       trace_code: data.trace_code,
       product_name: data.title,
       category: data.category,
       quantity: data.quantity,
       unit: data.unit,
       price: data.price,
       origin: safeLocation,
       inputs_summary: data.inputs_summary,
       test_report_urls: data.test_report_urls || [],
       listed_at: data.created_at,
       verified: true,
       platform: "AgriNext Gen"
     };
 
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