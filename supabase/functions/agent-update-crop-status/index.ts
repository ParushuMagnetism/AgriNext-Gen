import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { crop_id, status, estimated_quantity } = await req.json();
    if (!crop_id || !status) {
      return new Response(JSON.stringify({ error: "crop_id and status are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedStatuses = new Set(["growing", "one_week", "ready", "harvested"]);
    if (!allowedStatuses.has(status)) {
      return new Response(JSON.stringify({ error: "Invalid crop status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!roleData || (roleData.role !== "agent" && roleData.role !== "admin")) {
      return new Response(JSON.stringify({ error: "Only agent/admin can update crop status" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: crop, error: cropError } = await supabaseAdmin
      .from("crops")
      .select("id, farmer_id")
      .eq("id", crop_id)
      .maybeSingle();

    if (cropError || !crop) {
      return new Response(JSON.stringify({ error: "Crop not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (roleData.role === "agent") {
      const { data: assignment } = await supabaseAdmin
        .from("agent_farmer_assignments")
        .select("agent_id")
        .eq("agent_id", user.id)
        .eq("farmer_id", crop.farmer_id)
        .eq("active", true)
        .maybeSingle();

      if (!assignment) {
        return new Response(JSON.stringify({ error: "You are not assigned to this farmer" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const updateData: Record<string, unknown> = { status };
    if (typeof estimated_quantity === "number") {
      updateData.estimated_quantity = estimated_quantity;
    }

    const { error: updateError } = await supabaseAdmin
      .from("crops")
      .update(updateData)
      .eq("id", crop_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, crop_id, status }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[agent-update-crop-status] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
