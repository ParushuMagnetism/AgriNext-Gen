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

    // Verify user has farmer role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!roleData || roleData.role !== "farmer") {
      return new Response(
        JSON.stringify({ error: "Access denied. Farmer role required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Farmer:", user.id, "Message:", message, "Language hint:", language);

    const systemPrompt = `You are a helpful agricultural assistant for Indian farmers. You help with:
- Crop management and farming techniques
- Weather and seasonal advice
- Market prices and selling tips
- Pest and disease identification
- Government schemes and subsidies
- General farming queries

CRITICAL LANGUAGE RULES:
1. Detect the language of the user's message (Hindi, Kannada, or English)
2. ALWAYS respond in the SAME language the user used
3. If the user writes in Hindi (using Devanagari script or romanized), respond in Hindi
4. If the user writes in Kannada (using Kannada script or romanized), respond in Kannada
5. If the user writes in English, respond in English
6. Keep responses concise, practical, and farmer-friendly
7. Use simple language that rural farmers can understand
8. If you're unsure about the language, respond in the language hint provided: ${language || 'auto-detect'}

Examples:
- "मेरी फसल में कीड़े लग गए हैं" → Respond in Hindi
- "ನನ್ನ ಬೆಳೆಯಲ್ಲಿ ಕೀಟಗಳು ಬಂದಿವೆ" → Respond in Kannada
- "My crops have pests" → Respond in English
- "mere fasal mein keede lag gaye" → Respond in Hindi (romanized)
- "nanna beleyli keetalu bandive" → Respond in Kannada (romanized)`;

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
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
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
    const reply = data.choices?.[0]?.message?.content || "I couldn't process your request. Please try again.";

    console.log("AI response for farmer", user.id, ":", reply.substring(0, 100) + "...");

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in farmer-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
