import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  assigned: ["en_route", "cancelled"],
  en_route: ["arrived", "cancelled"],
  arrived: ["picked_up", "cancelled", "issue"],
  picked_up: ["in_transit", "issue"],
  in_transit: ["delivered", "issue"],
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
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

    // Parse request body
    const { 
      trip_id, 
      new_status, 
      note,
      proof_paths,
      issue_code,
      issue_notes,
      actual_weight_kg
    } = await req.json();
    
    if (!trip_id || !new_status) {
      return new Response(
        JSON.stringify({ error: "trip_id and new_status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[update-trip-status] User ${user.id} updating trip ${trip_id} to ${new_status}`);

    // Fetch trip and verify ownership
    const { data: trip, error: tripError } = await supabaseAdmin
      .from("trips")
      .select("*, transport_requests(farmer_id)")
      .eq("id", trip_id)
      .single();

    if (tripError || !trip) {
      return new Response(
        JSON.stringify({ error: "Trip not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify transporter owns this trip
    if (trip.transporter_id !== user.id) {
      // Check if admin
      const { data: adminRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!adminRole) {
        return new Response(
          JSON.stringify({ error: "You don't have permission to update this trip" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const currentStatus = trip.status;

    // Validate status transition
    const allowedNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStatuses.includes(new_status)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid status transition from '${currentStatus}' to '${new_status}'`,
          allowed: allowedNextStatuses
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build update object for trips table
    const tripUpdate: Record<string, any> = {
      status: new_status,
      updated_at: new Date().toISOString(),
    };

    // Set appropriate timestamp based on status
    const timestampField = `${new_status}_at`;
    if (["en_route", "arrived", "picked_up", "in_transit", "delivered", "cancelled"].includes(new_status)) {
      tripUpdate[timestampField] = new Date().toISOString();
    }

    // Handle proof uploads
    if (proof_paths && Array.isArray(proof_paths) && proof_paths.length > 0) {
      if (new_status === "picked_up" || currentStatus === "picked_up") {
        const existingProofs = trip.pickup_proofs || [];
        tripUpdate.pickup_proofs = [...existingProofs, ...proof_paths];
      } else if (new_status === "delivered") {
        const existingProofs = trip.delivery_proofs || [];
        tripUpdate.delivery_proofs = [...existingProofs, ...proof_paths];
      }
    }

    // Handle issue reporting
    if (new_status === "issue") {
      tripUpdate.issue_code = issue_code || "other";
      tripUpdate.issue_notes = issue_notes || note || null;
    }

    // Handle actual weight
    if (actual_weight_kg !== undefined) {
      tripUpdate.actual_weight_kg = actual_weight_kg;
    }

    // Update trips table
    const { error: updateError } = await supabaseAdmin
      .from("trips")
      .update(tripUpdate)
      .eq("id", trip_id);

    if (updateError) {
      console.error("[update-trip-status] Trip update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update trip status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map trip status to transport_request status
    const statusMapping: Record<string, string> = {
      assigned: "assigned",
      en_route: "en_route",
      arrived: "en_route",
      picked_up: "picked_up",
      in_transit: "picked_up",
      delivered: "delivered",
      cancelled: "cancelled",
      issue: "picked_up", // Keep as picked_up, issue is tracked in trip
    };

    const requestStatus = statusMapping[new_status] || new_status;

    // Update transport_requests status
    const requestUpdate: Record<string, any> = {
      status: requestStatus,
    };

    if (new_status === "delivered") {
      requestUpdate.completed_at = new Date().toISOString();
    }

    if (new_status === "cancelled") {
      requestUpdate.cancellation_reason = note || "Cancelled by transporter";
    }

    await supabaseAdmin
      .from("transport_requests")
      .update(requestUpdate)
      .eq("id", trip.transport_request_id);

    // Insert status event
    await supabaseAdmin
      .from("transport_status_events")
      .insert({
        transport_request_id: trip.transport_request_id,
        trip_id,
        actor_id: user.id,
        actor_role: "transporter",
        old_status: currentStatus,
        new_status,
        note: note || null,
      });

    // Create notifications for key events
    const farmerId = trip.transport_requests?.farmer_id;
    if (farmerId) {
      let notificationTitle = "";
      let notificationMessage = "";

      switch (new_status) {
        case "en_route":
          notificationTitle = "Transporter On The Way";
          notificationMessage = "The transporter is now heading to your location for pickup.";
          break;
        case "picked_up":
          notificationTitle = "Crop Picked Up";
          notificationMessage = "Your crop has been picked up and is being transported.";
          break;
        case "delivered":
          notificationTitle = "Delivery Complete";
          notificationMessage = "Your crop has been successfully delivered to the destination.";
          break;
        case "issue":
          notificationTitle = "Transport Issue Reported";
          notificationMessage = `An issue was reported: ${issue_code || "See details"}`;
          break;
      }

      if (notificationTitle) {
        await supabaseAdmin
          .from("notifications")
          .insert({
            user_id: farmerId,
            title: notificationTitle,
            message: notificationMessage,
            type: "transport",
          });
      }
    }

    console.log(`[update-trip-status] Successfully updated trip ${trip_id} to ${new_status}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        trip_id,
        old_status: currentStatus,
        new_status,
        message: `Trip status updated to ${new_status}`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[update-trip-status] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
