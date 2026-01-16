-- PHASE 0: Create crop-media storage bucket (PRIVATE)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'crop-media',
  'crop-media',
  false,
  4194304, -- 4MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for crop-media bucket
-- Farmers can upload to their own folder
CREATE POLICY "Farmers can upload crop media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'crop-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Farmers can read their own files
CREATE POLICY "Farmers can read own crop media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'crop-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Farmers can delete their own files
CREATE POLICY "Farmers can delete own crop media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'crop-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can read all crop media
CREATE POLICY "Admins can read all crop media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'crop-media' 
  AND public.has_role(auth.uid(), 'admin')
);

-- PHASE 1A: Alter crops table with new columns
ALTER TABLE public.crops 
ADD COLUMN IF NOT EXISTS growth_stage text DEFAULT 'seedling',
ADD COLUMN IF NOT EXISTS health_status text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS last_observed_issue_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS last_photo_at timestamptz NULL;

-- Add check constraints via trigger (to avoid immutable issues)
CREATE OR REPLACE FUNCTION public.validate_crop_growth_stage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.growth_stage NOT IN ('seedling', 'vegetative', 'flowering', 'fruiting', 'harvesting') THEN
    RAISE EXCEPTION 'Invalid growth_stage: %', NEW.growth_stage;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_crop_health_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.health_status NOT IN ('normal', 'watch', 'diseased') THEN
    RAISE EXCEPTION 'Invalid health_status: %', NEW.health_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS validate_crop_growth_stage_trigger ON public.crops;
CREATE TRIGGER validate_crop_growth_stage_trigger
  BEFORE INSERT OR UPDATE ON public.crops
  FOR EACH ROW EXECUTE FUNCTION public.validate_crop_growth_stage();

DROP TRIGGER IF EXISTS validate_crop_health_status_trigger ON public.crops;
CREATE TRIGGER validate_crop_health_status_trigger
  BEFORE INSERT OR UPDATE ON public.crops
  FOR EACH ROW EXECUTE FUNCTION public.validate_crop_health_status();

-- PHASE 1B: Create crop_media table
CREATE TABLE IF NOT EXISTS public.crop_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  owner_farmer_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  uploader_role text NOT NULL DEFAULT 'farmer',
  captured_at timestamptz DEFAULT now(),
  file_path text NOT NULL,
  mime_type text NOT NULL,
  caption text NULL,
  tags text[] NULL,
  created_at timestamptz DEFAULT now()
);

-- Validation trigger for uploader_role
CREATE OR REPLACE FUNCTION public.validate_crop_media_uploader_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.uploader_role NOT IN ('farmer', 'agent', 'admin') THEN
    RAISE EXCEPTION 'Invalid uploader_role: %', NEW.uploader_role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_crop_media_uploader_role_trigger
  BEFORE INSERT OR UPDATE ON public.crop_media
  FOR EACH ROW EXECUTE FUNCTION public.validate_crop_media_uploader_role();

-- Indexes for crop_media
CREATE INDEX IF NOT EXISTS idx_crop_media_crop_captured ON public.crop_media(crop_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_crop_media_owner_created ON public.crop_media(owner_farmer_id, created_at DESC);

-- RLS for crop_media
ALTER TABLE public.crop_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own crop media"
ON public.crop_media FOR SELECT
USING (auth.uid() = owner_farmer_id);

CREATE POLICY "Farmers can insert own crop media"
ON public.crop_media FOR INSERT
WITH CHECK (auth.uid() = owner_farmer_id AND public.has_role(auth.uid(), 'farmer'));

CREATE POLICY "Farmers can update own crop media"
ON public.crop_media FOR UPDATE
USING (auth.uid() = owner_farmer_id);

CREATE POLICY "Farmers can delete own crop media"
ON public.crop_media FOR DELETE
USING (auth.uid() = owner_farmer_id);

CREATE POLICY "Admins can manage all crop media"
ON public.crop_media FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- PHASE 1C: Create crop_activity_logs table
CREATE TABLE IF NOT EXISTS public.crop_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  owner_farmer_id uuid NOT NULL,
  created_by uuid NOT NULL,
  creator_role text NOT NULL DEFAULT 'farmer',
  activity_type text NOT NULL,
  activity_at timestamptz DEFAULT now(),
  notes text NULL,
  severity text NULL,
  media_id uuid NULL REFERENCES public.crop_media(id) ON DELETE SET NULL,
  meta jsonb NULL,
  consent_captured boolean DEFAULT false,
  consent_note text NULL,
  consent_at timestamptz NULL,
  created_at timestamptz DEFAULT now()
);

-- Validation triggers for crop_activity_logs
CREATE OR REPLACE FUNCTION public.validate_activity_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.activity_type NOT IN ('photo', 'fertilizer', 'spray', 'irrigation', 'weeding', 'disease', 'growth_update', 'harvest_update', 'note', 'other') THEN
    RAISE EXCEPTION 'Invalid activity_type: %', NEW.activity_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_activity_severity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.severity IS NOT NULL AND NEW.severity NOT IN ('low', 'medium', 'high') THEN
    RAISE EXCEPTION 'Invalid severity: %', NEW.severity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_activity_creator_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.creator_role NOT IN ('farmer', 'agent', 'admin') THEN
    RAISE EXCEPTION 'Invalid creator_role: %', NEW.creator_role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_activity_type_trigger
  BEFORE INSERT OR UPDATE ON public.crop_activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.validate_activity_type();

CREATE TRIGGER validate_activity_severity_trigger
  BEFORE INSERT OR UPDATE ON public.crop_activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.validate_activity_severity();

CREATE TRIGGER validate_activity_creator_role_trigger
  BEFORE INSERT OR UPDATE ON public.crop_activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.validate_activity_creator_role();

-- Indexes for crop_activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_crop_activity ON public.crop_activity_logs(crop_id, activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_owner_created ON public.crop_activity_logs(owner_farmer_id, created_at DESC);

-- RLS for crop_activity_logs
ALTER TABLE public.crop_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own activity logs"
ON public.crop_activity_logs FOR SELECT
USING (auth.uid() = owner_farmer_id);

CREATE POLICY "Farmers can insert own activity logs"
ON public.crop_activity_logs FOR INSERT
WITH CHECK (auth.uid() = owner_farmer_id AND public.has_role(auth.uid(), 'farmer'));

CREATE POLICY "Farmers can update own activity logs"
ON public.crop_activity_logs FOR UPDATE
USING (auth.uid() = owner_farmer_id);

CREATE POLICY "Farmers can delete own activity logs"
ON public.crop_activity_logs FOR DELETE
USING (auth.uid() = owner_farmer_id);

CREATE POLICY "Admins can manage all activity logs"
ON public.crop_activity_logs FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- PHASE 1D: Create agent_farmer_assignments table
CREATE TABLE IF NOT EXISTS public.agent_farmer_assignments (
  agent_id uuid NOT NULL,
  farmer_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (agent_id, farmer_id)
);

-- RLS for agent_farmer_assignments
ALTER TABLE public.agent_farmer_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own assignments"
ON public.agent_farmer_assignments FOR SELECT
USING (auth.uid() = agent_id);

CREATE POLICY "Admins can manage assignments"
ON public.agent_farmer_assignments FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- PHASE 1E: Agent RLS policies for crop_media and crop_activity_logs
CREATE POLICY "Agents can insert crop media for assigned farmers"
ON public.crop_media FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'agent') 
  AND uploader_role = 'agent'
  AND uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.agent_farmer_assignments 
    WHERE agent_id = auth.uid() AND farmer_id = owner_farmer_id
  )
);

CREATE POLICY "Agents can view crop media for assigned farmers"
ON public.crop_media FOR SELECT
USING (
  public.has_role(auth.uid(), 'agent')
  AND EXISTS (
    SELECT 1 FROM public.agent_farmer_assignments 
    WHERE agent_id = auth.uid() AND farmer_id = owner_farmer_id
  )
);

CREATE POLICY "Agents can insert activity logs for assigned farmers"
ON public.crop_activity_logs FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'agent')
  AND creator_role = 'agent'
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.agent_farmer_assignments 
    WHERE agent_id = auth.uid() AND farmer_id = owner_farmer_id
  )
);

CREATE POLICY "Agents can view activity logs for assigned farmers"
ON public.crop_activity_logs FOR SELECT
USING (
  public.has_role(auth.uid(), 'agent')
  AND EXISTS (
    SELECT 1 FROM public.agent_farmer_assignments 
    WHERE agent_id = auth.uid() AND farmer_id = owner_farmer_id
  )
);

-- Storage policy for agents to upload crop media
CREATE POLICY "Agents can upload crop media for assigned farmers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'crop-media'
  AND public.has_role(auth.uid(), 'agent')
  AND EXISTS (
    SELECT 1 FROM public.agent_farmer_assignments 
    WHERE agent_id = auth.uid() AND farmer_id = (storage.foldername(name))[1]::uuid
  )
);

CREATE POLICY "Agents can read crop media for assigned farmers"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'crop-media'
  AND public.has_role(auth.uid(), 'agent')
  AND EXISTS (
    SELECT 1 FROM public.agent_farmer_assignments 
    WHERE agent_id = auth.uid() AND farmer_id = (storage.foldername(name))[1]::uuid
  )
);

-- PHASE 1F: Trigger to auto-update last_photo_at on crops
CREATE OR REPLACE FUNCTION public.update_crop_last_photo_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.crops 
  SET last_photo_at = NEW.captured_at 
  WHERE id = NEW.crop_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_crop_last_photo_trigger
  AFTER INSERT ON public.crop_media
  FOR EACH ROW EXECUTE FUNCTION public.update_crop_last_photo_at();