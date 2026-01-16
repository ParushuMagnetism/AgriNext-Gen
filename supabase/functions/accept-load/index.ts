import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client with service role for atomic operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify transporter role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "logistics")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Only transporters can accept loads" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { transport_request_id, vehicle_id } = await req.json();
    
    if (!transport_request_id) {
      return new Response(
        JSON.stringify({ error: "transport_request_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[accept-load] User ${user.id} attempting to accept request ${transport_request_id}`);

    // ATOMIC OPERATION: Update transport_requests only if status is 'requested'
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from("transport_requests")
      .update({
        status: "assigned",
        transporter_id: user.id,
        vehicle_id: vehicle_id || null,
        assigned_at: new Date().toISOString(),
      })
      .eq("id", transport_request_id)
      .eq("status", "requested")  // Critical: only update if still 'requested'
      .select()
      .single();

    if (updateError || !updatedRequest) {
      console.log(`[accept-load] Failed to update request - may already be assigned`);
      return new Response(
        JSON.stringify({ 
          error: "Load already accepted or not available",
          code: "ALREADY_ASSIGNED" 
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[accept-load] Request ${transport_request_id} assigned to ${user.id}`);

    // Create trip record
    const { data: trip, error: tripError } = await supabaseAdmin
      .from("trips")
      .insert({
        transport_request_id,
        transporter_id: user.id,
        status: "assigned",
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (tripError) {
      console.error(`[accept-load] Failed to create trip:`, tripError);
      // Rollback the transport_request update
      await supabaseAdmin
        .from("transport_requests")
        .update({
          status: "requested",
          transporter_id: null,
          vehicle_id: null,
          assigned_at: null,
        })
        .eq("id", transport_request_id);
      
      return new Response(
        JSON.stringify({ error: "Failed to create trip record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update transport_request with trip_id
    await supabaseAdmin
      .from("transport_requests")
      .update({ assigned_trip_id: trip.id })
      .eq("id", transport_request_id);

    // Create status event
    await supabaseAdmin
      .from("transport_status_events")
      .insert({
        transport_request_id,
        trip_id: trip.id,
        actor_id: user.id,
        actor_role: "transporter",
        old_status: "requested",
        new_status: "assigned",
        note: "Load accepted by transporter",
      });

    // Create notification for farmer
    await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: updatedRequest.farmer_id,
        title: "Transport Assigned",
        message: "A transporter has accepted your pickup request and will contact you soon.",
        type: "transport",
      });

    console.log(`[accept-load] Successfully created trip ${trip.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        trip_id: trip.id,
        message: "Load accepted successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[accept-load] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
