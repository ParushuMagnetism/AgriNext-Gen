import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Voice IDs for different languages (using multilingual voices)
const VOICE_MAP: Record<string, string> = {
  "en-IN": "pFZP5JQG7iQjIQuC4Bku", // Lily - clear English
  "hi-IN": "pFZP5JQG7iQjIQuC4Bku", // Lily - works with Hindi
  "kn-IN": "pFZP5JQG7iQjIQuC4Bku", // Lily - works with Kannada
};

const MAX_TEXT_LENGTH = 1200;
const TTS_TIMEOUT_MS = 10000;

interface TTSRequest {
  text: string;
  language_code: "en-IN" | "hi-IN" | "kn-IN";
  voice_role: "farmer" | "agent";
}

interface TTSResponse {
  audio_url: string | null;
  cache_hit: boolean;
  language_code: string;
  voice_role: string;
  created_at: string;
  fallback: "text_only" | null;
}

// Simple SHA256 hash using Web Crypto API
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Sanitize text for TTS
function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[*_~`#]/g, "") // Remove markdown
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .substring(0, MAX_TEXT_LENGTH);
}

// Log the TTS operation
async function logOperation(
  supabaseAdmin: any,
  userId: string | null,
  role: string,
  cacheHit: boolean,
  success: boolean,
  latencyMs: number,
  languageCode: string,
  error?: string
) {
  try {
    await supabaseAdmin.from("voice_ops_logs").insert({
      user_id: userId,
      role,
      op: "tts",
      language_code: languageCode,
      cache_hit: cacheHit,
      success,
      latency_ms: latencyMs,
      error: error?.substring(0, 500),
    });
  } catch (e) {
    console.error("Failed to log TTS operation:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  let languageCode = "en-IN";
  let cacheHit = false;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");

    if (!elevenlabsApiKey) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    userId = user.id;

    // Parse request
    const body: TTSRequest = await req.json();
    const { text, language_code = "en-IN", voice_role = "farmer" } = body;

    if (!text || typeof text !== "string") {
      throw new Error("Text is required");
    }

    languageCode = language_code;
    const sanitizedText = sanitizeText(text);

    if (!sanitizedText) {
      throw new Error("Text is empty after sanitization");
    }

    // Get voice ID
    const voiceId = VOICE_MAP[language_code] || VOICE_MAP["en-IN"];

    // Compute cache key
    const cacheKey = await sha256(
      `${sanitizedText}|${language_code}|${voice_role}|${voiceId}`
    );
    const textHash = await sha256(sanitizedText);

    // Check cache
    const { data: cached } = await supabaseAdmin
      .from("ai_audio_cache")
      .select("*")
      .eq("cache_key", cacheKey)
      .single();

    if (cached) {
      cacheHit = true;
      // Generate signed URL
      const { data: signedUrl } = await supabaseAdmin.storage
        .from("voice_media")
        .createSignedUrl(cached.storage_path, 300); // 5 min expiry

      const latencyMs = Date.now() - startTime;
      await logOperation(
        supabaseAdmin,
        userId,
        voice_role,
        true,
        true,
        latencyMs,
        language_code
      );

      const response: TTSResponse = {
        audio_url: signedUrl?.signedUrl || null,
        cache_hit: true,
        language_code,
        voice_role,
        created_at: cached.created_at,
        fallback: signedUrl?.signedUrl ? null : "text_only",
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call ElevenLabs API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

    try {
      const ttsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": elevenlabsApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: sanitizedText,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.3,
              use_speaker_boost: true,
              speed: 0.95,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        throw new Error(`ElevenLabs API error: ${ttsResponse.status} - ${errorText}`);
      }

      const audioBuffer = await ttsResponse.arrayBuffer();

      // Upload to storage
      const storagePath = `tts/${cacheKey}.mp3`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("voice_media")
        .upload(storagePath, audioBuffer, {
          contentType: "audio/mpeg",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Insert cache record
      await supabaseAdmin.from("ai_audio_cache").insert({
        cache_key: cacheKey,
        text_hash: textHash,
        language_code,
        voice_role,
        voice_id: voiceId,
        storage_path: storagePath,
      });

      // Generate signed URL
      const { data: signedUrl } = await supabaseAdmin.storage
        .from("voice_media")
        .createSignedUrl(storagePath, 300);

      const latencyMs = Date.now() - startTime;
      await logOperation(
        supabaseAdmin,
        userId,
        voice_role,
        false,
        true,
        latencyMs,
        language_code
      );

      const response: TTSResponse = {
        audio_url: signedUrl?.signedUrl || null,
        cache_hit: false,
        language_code,
        voice_role,
        created_at: new Date().toISOString(),
        fallback: signedUrl?.signedUrl ? null : "text_only",
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        throw new Error("TTS request timed out");
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error("TTS error:", error);

    const latencyMs = Date.now() - startTime;

    // Try to log the error
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      await logOperation(
        supabaseAdmin,
        userId,
        "unknown",
        cacheHit,
        false,
        latencyMs,
        languageCode,
        error.message
      );
    } catch (e) {
      console.error("Failed to log error:", e);
    }

    // Return fallback response
    const response: TTSResponse = {
      audio_url: null,
      cache_hit: false,
      language_code: languageCode,
      voice_role: "farmer",
      created_at: new Date().toISOString(),
      fallback: "text_only",
    };

    return new Response(JSON.stringify(response), {
      status: 200, // Return 200 with fallback to not break UI
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
