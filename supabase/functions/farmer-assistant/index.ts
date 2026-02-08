import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Router categories
type RouterCategory = 
  | "FARM_CONTEXT_ONLY"
  | "NEEDS_WEB_WEATHER"
  | "NEEDS_WEB_SCHEME"
  | "NEEDS_WEB_PEST_DISEASE"
  | "NEEDS_WEB_MARKET_INFO"
  | "NEEDS_WEB_GENERAL";

// TTL in milliseconds for different topics
const CACHE_TTL: Record<string, number> = {
  weather: 60 * 60 * 1000, // 1 hour
  market: 6 * 60 * 60 * 1000, // 6 hours
  scheme: 24 * 60 * 60 * 1000, // 24 hours
  pest_disease: 24 * 60 * 60 * 1000, // 24 hours
  general: 12 * 60 * 60 * 1000, // 12 hours
};

interface FarmerContext {
  full_name: string | null;
  village: string | null;
  district: string | null;
  farmlands: Array<{
    name: string;
    area: number;
    unit: string;
    soil_type: string | null;
  }>;
  crops: Array<{
    crop_name: string;
    variety: string | null;
    status: string;
    harvest_estimate: string | null;
    estimated_quantity: number | null;
    quantity_unit: string | null;
    farmland_name: string | null;
  }>;
  total_land: number;
  crops_by_status: Record<string, number>;
  next_harvest_in_days: number | null;
  ready_crops: string[];
  one_week_crops: string[];
}

interface WebContext {
  facts: string[];
  warnings: string[];
  sources: string[];
}

// Lightweight router - keyword + intent based
function routeMessage(message: string): RouterCategory {
  const lowerMsg = message.toLowerCase();
  
  // Weather keywords
  const weatherKeywords = ["weather", "rain", "forecast", "temperature", "humidity", "monsoon", "बारिश", "मौसम", "तापमान", "ಮಳೆ", "ಹವಾಮಾನ"];
  if (weatherKeywords.some(kw => lowerMsg.includes(kw))) {
    return "NEEDS_WEB_WEATHER";
  }
  
  // Government scheme keywords
  const schemeKeywords = ["scheme", "subsidy", "msp", "pm-kisan", "insurance", "government", "grant", "loan", "सब्सिडी", "योजना", "सरकारी", "ಸಬ್ಸಿಡಿ", "ಯೋಜನೆ", "ಸರ್ಕಾರಿ", "kisan", "fasal bima", "drip irrigation"];
  if (schemeKeywords.some(kw => lowerMsg.includes(kw))) {
    return "NEEDS_WEB_SCHEME";
  }
  
  // Pest/Disease keywords
  const pestKeywords = ["pest", "disease", "insect", "fungus", "virus", "blight", "rot", "wilt", "curling", "yellowing", "spots", "कीड़े", "रोग", "कीट", "ಕೀಟ", "ರೋಗ", "remedy", "treatment", "spray", "pesticide"];
  if (pestKeywords.some(kw => lowerMsg.includes(kw))) {
    return "NEEDS_WEB_PEST_DISEASE";
  }
  
  // Market info keywords
  const marketKeywords = ["price", "mandi", "market", "rate", "export", "import", "demand", "भाव", "दाम", "मंडी", "ಬೆಲೆ", "ಮಾರುಕಟ್ಟೆ", "selling", "buyer"];
  if (marketKeywords.some(kw => lowerMsg.includes(kw))) {
    return "NEEDS_WEB_MARKET_INFO";
  }
  
  // Farm context only keywords - harvest, transport, crop status, listings
  const farmContextKeywords = ["harvest", "when should i", "which crops", "my crop", "my farm", "transport", "listing", "कटाई", "फसल", "ಕೊಯ್ಲು", "ಬೆಳೆ", "ready", "status"];
  if (farmContextKeywords.some(kw => lowerMsg.includes(kw))) {
    return "FARM_CONTEXT_ONLY";
  }
  
  // If asking general questions that might benefit from web search
  const generalWebKeywords = ["how to", "what is", "best practice", "recommend", "tips", "कैसे करें", "ಹೇಗೆ"];
  if (generalWebKeywords.some(kw => lowerMsg.includes(kw))) {
    return "NEEDS_WEB_GENERAL";
  }
  
  // Default to farm context only
  return "FARM_CONTEXT_ONLY";
}

// Get topic from router category for caching
function getTopic(category: RouterCategory): string {
  switch (category) {
    case "NEEDS_WEB_WEATHER": return "weather";
    case "NEEDS_WEB_SCHEME": return "scheme";
    case "NEEDS_WEB_PEST_DISEASE": return "pest_disease";
    case "NEEDS_WEB_MARKET_INFO": return "market";
    case "NEEDS_WEB_GENERAL": return "general";
    default: return "general";
  }
}

// Fetch farmer context from Supabase
async function fetchFarmerContext(supabase: any, userId: string): Promise<FarmerContext> {
  const context: FarmerContext = {
    full_name: null,
    village: null,
    district: null,
    farmlands: [],
    crops: [],
    total_land: 0,
    crops_by_status: {},
    next_harvest_in_days: null,
    ready_crops: [],
    one_week_crops: [],
  };

  try {
    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, village, district")
      .eq("id", userId)
      .maybeSingle();
    
    if (profile) {
      context.full_name = profile.full_name;
      context.village = profile.village;
      context.district = profile.district;
    }

    // Fetch farmlands (top 3)
    const { data: farmlands } = await supabase
      .from("farmlands")
      .select("id, name, area, area_unit, soil_type")
      .eq("farmer_id", userId)
      .limit(3);
    
    if (farmlands && farmlands.length > 0) {
      context.farmlands = farmlands.map((f: any) => ({
        name: f.name,
        area: f.area,
        unit: f.area_unit,
        soil_type: f.soil_type,
      }));
      context.total_land = farmlands.reduce((sum: number, f: any) => sum + (f.area || 0), 0);
    }

    // Fetch active crops (up to 10, not harvested)
    const { data: crops } = await supabase
      .from("crops")
      .select(`
        crop_name,
        variety,
        status,
        harvest_estimate,
        estimated_quantity,
        quantity_unit,
        land_id,
        farmlands!left(name)
      `)
      .eq("farmer_id", userId)
      .neq("status", "harvested")
      .order("harvest_estimate", { ascending: true, nullsFirst: false })
      .limit(10);
    
    if (crops && crops.length > 0) {
      context.crops = crops.map((c: any) => ({
        crop_name: c.crop_name,
        variety: c.variety,
        status: c.status,
        harvest_estimate: c.harvest_estimate,
        estimated_quantity: c.estimated_quantity,
        quantity_unit: c.quantity_unit,
        farmland_name: c.farmlands?.name || null,
      }));

      // Compute derived fields
      context.crops_by_status = crops.reduce((acc: Record<string, number>, c: any) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {});

      context.ready_crops = crops
        .filter((c: any) => c.status === "ready")
        .map((c: any) => c.crop_name);
      
      context.one_week_crops = crops
        .filter((c: any) => c.status === "one_week")
        .map((c: any) => c.crop_name);

      // Calculate next harvest in days
      const nextHarvest = crops.find((c: any) => c.harvest_estimate);
      if (nextHarvest?.harvest_estimate) {
        const harvestDate = new Date(nextHarvest.harvest_estimate);
        const today = new Date();
        const diffDays = Math.ceil((harvestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        context.next_harvest_in_days = diffDays > 0 ? diffDays : 0;
      }
    }
  } catch (error) {
    console.error("Error fetching farmer context:", error);
  }

  return context;
}

// Check cache for fresh web context
async function checkCache(
  supabase: any,
  topic: string,
  locationKey: string,
  cropKey: string | null
): Promise<WebContext | null> {
  try {
    const cacheKey = `${topic}:${locationKey}:${cropKey || "all"}`;
    const ttl = CACHE_TTL[topic] || CACHE_TTL.general;
    const cutoff = new Date(Date.now() - ttl).toISOString();

    const { data } = await supabase
      .from("web_cache")
      .select("data, fetched_at")
      .eq("cache_key", cacheKey)
      .gt("fetched_at", cutoff)
      .maybeSingle();

    if (data) {
      console.log(`Cache hit for ${cacheKey}`);
      return data.data as WebContext;
    }
  } catch (error) {
    console.error("Cache check error:", error);
  }
  return null;
}

// Update cache with new web context
async function updateCache(
  supabase: any,
  topic: string,
  locationKey: string,
  cropKey: string | null,
  webContext: WebContext
): Promise<void> {
  try {
    const cacheKey = `${topic}:${locationKey}:${cropKey || "all"}`;
    
    await supabase
      .from("web_cache")
      .upsert({
        cache_key: cacheKey,
        topic,
        location_key: locationKey,
        crop_key: cropKey,
        data: webContext,
        fetched_at: new Date().toISOString(),
      }, { onConflict: "cache_key" });
    
    console.log(`Cache updated for ${cacheKey}`);
  } catch (error) {
    console.error("Cache update error:", error);
  }
}

// Call Perplexity API with timeout
async function callPerplexity(
  query: string,
  language: string
): Promise<WebContext | null> {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  
  if (!PERPLEXITY_API_KEY) {
    console.warn("PERPLEXITY_API_KEY not configured, skipping web search");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const langInstruction = language === "hi-IN" 
      ? "Respond in Hindi." 
      : language === "kn-IN" 
        ? "Respond in Kannada." 
        : "Respond in English.";

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant for Indian farmers. ${langInstruction} Provide:
- Maximum 5 bullet point facts
- Any safety warnings if applicable
- Be concise and practical
Format your response as JSON with keys: facts (array of strings), warnings (array of strings)`
          },
          { role: "user", content: query }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error("Perplexity API error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    // Try to parse JSON from response
    let facts: string[] = [];
    let warnings: string[] = [];

    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        facts = parsed.facts || [];
        warnings = parsed.warnings || [];
      } else {
        // Fallback: treat entire response as facts
        facts = content.split("\n").filter((line: string) => line.trim()).slice(0, 5);
      }
    } catch {
      // Fallback: treat entire response as a single fact
      facts = [content.substring(0, 500)];
    }

    return {
      facts: facts.slice(0, 5),
      warnings: warnings.slice(0, 3),
      sources: citations.slice(0, 3),
    };
  } catch (error: unknown) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Perplexity request timed out");
    } else {
      console.error("Perplexity error:", error);
    }
    return null;
  }
}

// Build web query based on context and message
function buildWebQuery(
  message: string,
  category: RouterCategory,
  farmerContext: FarmerContext
): string {
  const location = farmerContext.district || farmerContext.village || "Karnataka India";
  const cropNames = farmerContext.crops.map(c => c.crop_name).slice(0, 3);
  
  let query = message;
  
  // Add location context
  if (!message.toLowerCase().includes(location.toLowerCase())) {
    query = `${query} in ${location}`;
  }
  
  // Add crop context for relevant categories
  if (category === "NEEDS_WEB_PEST_DISEASE" || category === "NEEDS_WEB_MARKET_INFO") {
    if (cropNames.length > 0 && !cropNames.some(c => message.toLowerCase().includes(c.toLowerCase()))) {
      query = `${query} for ${cropNames[0]}`;
    }
  }
  
  // Add context based on category
  switch (category) {
    case "NEEDS_WEB_WEATHER":
      query = `weather forecast ${location} agriculture farming`;
      break;
    case "NEEDS_WEB_SCHEME":
      query = `${message} government scheme India farmer`;
      break;
    case "NEEDS_WEB_MARKET_INFO":
      query = `${message} mandi price India`;
      break;
  }
  
  return query;
}

// Log the assistant interaction
async function logInteraction(
  supabase: any,
  userId: string,
  userMessage: string,
  routerCategory: RouterCategory,
  usedWeb: boolean,
  webQuery: string | null,
  farmerContext: FarmerContext,
  webContext: WebContext | null,
  aiResponse: string,
  model: string
): Promise<void> {
  try {
    // Trim context summaries to reduce storage
    const farmerContextSummary = {
      has_profile: !!farmerContext.full_name,
      location: farmerContext.district || farmerContext.village,
      farmlands_count: farmerContext.farmlands.length,
      crops_count: farmerContext.crops.length,
      ready_crops: farmerContext.ready_crops.length,
    };

    const webContextSummary = webContext ? {
      facts_count: webContext.facts.length,
      has_warnings: webContext.warnings.length > 0,
      sources_count: webContext.sources.length,
    } : null;

    await supabase
      .from("ai_farmer_logs")
      .insert({
        user_id: userId,
        user_message: userMessage,
        router_category: routerCategory,
        used_web: usedWeb,
        web_query: webQuery,
        farmer_context_summary: farmerContextSummary,
        web_context_summary: webContextSummary,
        ai_response: aiResponse,
        model: model,
      });
  } catch (error) {
    console.error("Error logging interaction:", error);
  }
}

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // User client for RLS-safe queries
    const supabaseUser = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    // Service client for cache and logging (bypasses RLS)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has farmer role
    const { data: roleData } = await supabaseUser
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

    console.log("=== Farmer Assistant Request ===");
    console.log("Farmer:", user.id);
    console.log("Message:", message);
    console.log("Language:", language);

    // Step 1: Route the message
    const routerCategory = routeMessage(message);
    console.log("Router category:", routerCategory);

    // Step 2: Fetch farmer context (RLS-safe using user's auth)
    const farmerContext = await fetchFarmerContext(supabaseUser, user.id);
    console.log("Farmer context loaded:", {
      has_profile: !!farmerContext.full_name,
      farmlands: farmerContext.farmlands.length,
      crops: farmerContext.crops.length,
    });

    // Step 3: Fetch web context if needed
    let webContext: WebContext | null = null;
    let webQuery: string | null = null;
    const usedWeb = routerCategory.startsWith("NEEDS_WEB_");

    if (usedWeb) {
      const topic = getTopic(routerCategory);
      const locationKey = farmerContext.district || farmerContext.village || "india";
      const cropKey = farmerContext.crops[0]?.crop_name || null;

      // Check cache first
      webContext = await checkCache(supabaseService, topic, locationKey, cropKey);

      if (!webContext) {
        // Build and execute web query
        webQuery = buildWebQuery(message, routerCategory, farmerContext);
        console.log("Web query:", webQuery);
        
        webContext = await callPerplexity(webQuery, language || "en-IN");
        
        if (webContext) {
          // Update cache
          await updateCache(supabaseService, topic, locationKey, cropKey, webContext);
        }
      }
      
      console.log("Web context:", webContext ? "loaded" : "not available");
    }

    // Step 4: Build system prompt with context
    const langInstructions = {
      "en-IN": "Respond in English.",
      "hi-IN": "Respond in Hindi (हिंदी में जवाब दें).",
      "kn-IN": "Respond in Kannada (ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ).",
    };

    const systemPrompt = `You are Krishi Mitra, a helpful AI assistant for Indian farmers.

${langInstructions[language as keyof typeof langInstructions] || langInstructions["en-IN"]}

## FARMER CONTEXT (Primary Truth - Never Invent Data Not Present Here):
${JSON.stringify(farmerContext, null, 2)}

${webContext ? `## WEB CONTEXT (Supplementary Public Information):
Facts: ${webContext.facts.join("; ")}
${webContext.warnings.length > 0 ? `Warnings: ${webContext.warnings.join("; ")}` : ""}
${webContext.sources.length > 0 ? `Sources: ${webContext.sources.join(", ")}` : ""}` : ""}

## CRITICAL RULES:
1. FARMER_CONTEXT is the primary truth for farmer-specific details (crops, land, location).
2. Never invent farmer-specific data not present in FARMER_CONTEXT.
3. If user asks about something needing missing details (crop name, symptoms), ask a clarifying question.
4. For pesticide/chemical advice:
   - DO NOT give exact dosage recommendations
   - Give safe general steps
   - ALWAYS advise consulting local agriculture officer or reading label instructions
5. Keep responses concise with numbered steps when applicable.
6. Add a brief "why this works" (1-2 lines) for recommendations.
7. If WEB_CONTEXT exists, you may mention sources briefly.
8. This is advisory only - no automated actions.

## HELPFUL CONTEXT:
- Ready to harvest crops: ${farmerContext.ready_crops.join(", ") || "None currently"}
- Crops ready within a week: ${farmerContext.one_week_crops.join(", ") || "None currently"}
- Next harvest in: ${farmerContext.next_harvest_in_days !== null ? `${farmerContext.next_harvest_in_days} days` : "Unknown"}
- Total land: ${farmerContext.total_land} ${farmerContext.farmlands[0]?.unit || "acres"}`;

    // Step 5: Call Gemini
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
        max_tokens: 600,
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

    console.log("AI response generated, length:", reply.length);

    // Step 6: Log the interaction (using service role to bypass RLS)
    await logInteraction(
      supabaseService,
      user.id,
      message,
      routerCategory,
      usedWeb && webContext !== null,
      webQuery,
      farmerContext,
      webContext,
      reply,
      "google/gemini-2.5-flash"
    );

    return new Response(
      JSON.stringify({ 
        reply,
        metadata: {
          personalized: true,
          webVerified: usedWeb && webContext !== null,
        }
      }),
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
