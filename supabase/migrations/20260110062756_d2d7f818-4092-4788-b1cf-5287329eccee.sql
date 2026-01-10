-- Voice Features: ai_audio_cache, agent_voice_notes, voice_ops_logs + voice_media bucket

-- 1) Create voice_media storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice_media', 'voice_media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for voice_media bucket
CREATE POLICY "Service role can manage voice_media"
ON storage.objects FOR ALL
USING (bucket_id = 'voice_media')
WITH CHECK (bucket_id = 'voice_media');

CREATE POLICY "Authenticated users can read voice_media"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice_media' AND auth.role() = 'authenticated');

-- 2) Create ai_audio_cache table for TTS caching
CREATE TABLE IF NOT EXISTS public.ai_audio_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  text_hash text NOT NULL,
  language_code text NOT NULL,
  voice_role text NOT NULL,
  voice_id text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for ai_audio_cache
CREATE INDEX IF NOT EXISTS idx_ai_audio_cache_cache_key ON public.ai_audio_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_audio_cache_created_at ON public.ai_audio_cache(created_at DESC);

-- RLS for ai_audio_cache (no direct client write, optional read for metadata)
ALTER TABLE public.ai_audio_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client insert on ai_audio_cache"
ON public.ai_audio_cache FOR INSERT
WITH CHECK (false);

CREATE POLICY "No client update on ai_audio_cache"
ON public.ai_audio_cache FOR UPDATE
USING (false);

CREATE POLICY "No client delete on ai_audio_cache"
ON public.ai_audio_cache FOR DELETE
USING (false);

CREATE POLICY "Authenticated can read ai_audio_cache"
ON public.ai_audio_cache FOR SELECT
USING (auth.role() = 'authenticated');

-- 3) Create agent_voice_notes table
CREATE TABLE IF NOT EXISTS public.agent_voice_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  farmer_id uuid,
  crop_id uuid,
  task_id uuid,
  note_text text,
  audio_path text,
  language_code text NOT NULL DEFAULT 'en-IN',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for agent_voice_notes
CREATE INDEX IF NOT EXISTS idx_agent_voice_notes_agent_created ON public.agent_voice_notes(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_voice_notes_farmer_created ON public.agent_voice_notes(farmer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_voice_notes_task ON public.agent_voice_notes(task_id);

-- RLS for agent_voice_notes
ALTER TABLE public.agent_voice_notes ENABLE ROW LEVEL SECURITY;

-- Agent can CRUD their own notes
CREATE POLICY "Agent can insert own voice notes"
ON public.agent_voice_notes FOR INSERT
WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agent can view own voice notes"
ON public.agent_voice_notes FOR SELECT
USING (auth.uid() = agent_id);

CREATE POLICY "Agent can update own voice notes"
ON public.agent_voice_notes FOR UPDATE
USING (auth.uid() = agent_id);

CREATE POLICY "Agent can delete own voice notes"
ON public.agent_voice_notes FOR DELETE
USING (auth.uid() = agent_id);

-- Farmer can read notes where they are the farmer_id
CREATE POLICY "Farmer can view notes about them"
ON public.agent_voice_notes FOR SELECT
USING (auth.uid() = farmer_id);

-- Admin can view all notes
CREATE POLICY "Admin can view all agent voice notes"
ON public.agent_voice_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- 4) Create voice_ops_logs table
CREATE TABLE IF NOT EXISTS public.voice_ops_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  role text,
  op text NOT NULL,
  language_code text,
  cache_hit boolean,
  success boolean NOT NULL DEFAULT true,
  latency_ms int,
  error text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for voice_ops_logs
CREATE INDEX IF NOT EXISTS idx_voice_ops_logs_user_created ON public.voice_ops_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_ops_logs_op_created ON public.voice_ops_logs(op, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_ops_logs_success ON public.voice_ops_logs(success, created_at DESC);

-- RLS for voice_ops_logs (no client access)
ALTER TABLE public.voice_ops_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client insert on voice_ops_logs"
ON public.voice_ops_logs FOR INSERT
WITH CHECK (false);

CREATE POLICY "No client read on voice_ops_logs"
ON public.voice_ops_logs FOR SELECT
USING (false);

CREATE POLICY "No client update on voice_ops_logs"
ON public.voice_ops_logs FOR UPDATE
USING (false);

CREATE POLICY "No client delete on voice_ops_logs"
ON public.voice_ops_logs FOR DELETE
USING (false);