import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_AUDIO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB max audio file size
const MAX_NOTE_LENGTH = 2000; // Max characters for note text

interface SaveNoteRequest {
  farmer_id?: string | null;
  task_id?: string | null;
  crop_id?: string | null;
  language_code: "en-IN" | "hi-IN" | "kn-IN";
  note_text?: string | null;
  audio_base64?: string | null;
}

interface SaveNoteResponse {
  success: boolean;
  note_id?: string;
  audio_path?: string | null;
  error?: string;
}

// Log the operation
async function logOperation(
  supabaseAdmin: any,
  userId: string,
  success: boolean,
  latencyMs: number,
  languageCode: string,
  error?: string
) {
  try {
    await supabaseAdmin.from("voice_ops_logs").insert({
      user_id: userId,
      role: "agent",
      op: "save_agent_note",
      language_code: languageCode,
      cache_hit: false,
      success,
      latency_ms: latencyMs,
      error: error?.substring(0, 500),
    });
  } catch (e) {
    console.error("Failed to log operation:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  let languageCode = "en-IN";

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

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

    // Verify user is an agent
    const { data: userRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "agent")
      .single();

    if (!userRole) {
      throw new Error("Access denied: Agent role required");
    }

    // Parse request
    const body: SaveNoteRequest = await req.json();
    const {
      farmer_id,
      task_id,
      crop_id,
      language_code = "en-IN",
      note_text,
      audio_base64,
    } = body;

    languageCode = language_code;

    // Validate inputs
    if (!note_text && !audio_base64) {
      throw new Error("Either note_text or audio_base64 is required");
    }

    // Sanitize note text
    const sanitizedNoteText = note_text
      ? note_text.substring(0, MAX_NOTE_LENGTH).trim()
      : null;

    let audioPath: string | null = null;

    // Handle audio upload if provided
    if (audio_base64) {
      // Validate base64 audio size
      const estimatedSize = (audio_base64.length * 3) / 4;
      if (estimatedSize > MAX_AUDIO_SIZE_BYTES) {
        throw new Error("Audio file too large (max 5MB)");
      }

      try {
        const audioBuffer = base64Decode(audio_base64);
        const noteId = crypto.randomUUID();
        audioPath = `agent-notes/${userId}/${noteId}.webm`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("voice_media")
          .upload(audioPath, audioBuffer, {
            contentType: "audio/webm",
            upsert: false,
          });

        if (uploadError) {
          console.error("Audio upload error:", uploadError);
          // Don't fail the whole operation, just log and continue without audio
          audioPath = null;
        }
      } catch (decodeError) {
        console.error("Audio decode error:", decodeError);
        audioPath = null;
      }
    }

    // Insert the voice note
    const { data: insertedNote, error: insertError } = await supabaseAdmin
      .from("agent_voice_notes")
      .insert({
        agent_id: userId,
        farmer_id: farmer_id || null,
        task_id: task_id || null,
        crop_id: crop_id || null,
        note_text: sanitizedNoteText,
        audio_path: audioPath,
        language_code,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save note: ${insertError.message}`);
    }

    const latencyMs = Date.now() - startTime;
    await logOperation(supabaseAdmin, userId, true, latencyMs, language_code);

    const response: SaveNoteResponse = {
      success: true,
      note_id: insertedNote.id,
      audio_path: audioPath,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Save note error:", error);

    const latencyMs = Date.now() - startTime;

    // Try to log the error
    if (userId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        await logOperation(
          supabaseAdmin,
          userId,
          false,
          latencyMs,
          languageCode,
          error.message
        );
      } catch (e) {
        console.error("Failed to log error:", e);
      }
    }

    const response: SaveNoteResponse = {
      success: false,
      error: error.message,
    };

    return new Response(JSON.stringify(response), {
      status: error.message.includes("Unauthorized") || error.message.includes("Access denied")
        ? 403
        : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
