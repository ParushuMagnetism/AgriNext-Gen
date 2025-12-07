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
    // Validate user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has agent role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!roleData || roleData.role !== "agent") {
      return new Response(
        JSON.stringify({ error: "Access denied. Agent role required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Agent:", user.id, "AI request type:", type);

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "visit_prioritization") {
      systemPrompt = `You are an agriculture field operations planner helping field agents prioritize their farm visits.
Your goal is to maximize impact by helping agents visit the most critical farms first.

Consider these factors in order of priority:
1. Crops that are READY to harvest (highest priority - immediate action needed)
2. Crops that are ONE_WEEK away from harvest (need verification)
3. Farms with pending transport requests (logistics coordination needed)
4. Farms that haven't been visited recently
5. Geographic clustering (minimize travel time between farms)

Return a numbered list with:
- Farmer name and village
- Crop info (if applicable)
- Clear reason for this priority
- Suggested action for the agent

Keep responses concise and actionable.`;
      
      userPrompt = `Here are today's tasks for the field agent:\n\n${JSON.stringify(context.tasks, null, 2)}\n\nPlease prioritize these visits and explain your reasoning.`;
    } 
    else if (type === "cluster_summary") {
      systemPrompt = `You are an agriculture advisor analyzing field operations data for a cluster/region.
Provide actionable insights for field agents and supervisors.

Your analysis should include:
1. SUMMARY: Brief overview of the cluster's current state
2. RISKS: Potential issues that need attention (crop delays, transport bottlenecks, etc.)
3. OPPORTUNITIES: Positive trends or actions that can improve outcomes
4. RECOMMENDED ACTIONS: Specific tasks for the agent team

Use simple language that field agents can understand. Be concise but thorough.`;
      
      userPrompt = `Analyze this cluster data:\n\n${JSON.stringify(context.clusterData, null, 2)}\n\nProvide a summary with risks and recommendations.`;
    }
    else {
      throw new Error("Unknown AI request type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI service error");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "Unable to generate insights.";

    console.log("AI response for agent", user.id, "generated successfully");

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in agent-ai:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
