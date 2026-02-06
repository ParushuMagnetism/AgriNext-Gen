
-- 1) Add crop_id to listings (nullable FK to crops)
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS crop_id UUID NULL REFERENCES public.crops(id) ON DELETE SET NULL;

-- 2) Add trace_settings JSONB to listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS trace_settings JSONB NOT NULL DEFAULT '{
    "show_origin_level": "district",
    "show_crop_details": true,
    "show_crop_timeline": true,
    "show_stage_photos": false,
    "show_input_photos": false,
    "show_soil_report": false
  }'::jsonb;

-- 3) Create trace_attachments table
CREATE TABLE IF NOT EXISTS public.trace_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL,
  owner_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  tag TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  captured_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trace_attachments_owner ON public.trace_attachments(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_trace_attachments_tag ON public.trace_attachments(tag);
CREATE INDEX IF NOT EXISTS idx_trace_attachments_visibility ON public.trace_attachments(visibility);

-- RLS
ALTER TABLE public.trace_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attachments"
  ON public.trace_attachments FOR SELECT
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can insert own attachments"
  ON public.trace_attachments FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own attachments"
  ON public.trace_attachments FOR UPDATE
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete own attachments"
  ON public.trace_attachments FOR DELETE
  USING (auth.uid() = uploaded_by);

-- 4) Create storage bucket for traceability media
INSERT INTO storage.buckets (id, name, public)
VALUES ('traceability-media', 'traceability-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for traceability-media
CREATE POLICY "Authenticated users can upload traceability media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'traceability-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view own traceability media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'traceability-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own traceability media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'traceability-media' AND auth.uid()::text = (storage.foldername(name))[1]);
