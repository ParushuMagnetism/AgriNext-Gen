-- Phase 0: Create storage bucket for soil reports (PRIVATE)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'soil-reports',
  'soil-reports',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for soil-reports bucket
-- Farmers can upload to their own folder
CREATE POLICY "Farmers can upload soil reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'soil-reports' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Farmers can read their own files
CREATE POLICY "Farmers can read own soil reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'soil-reports' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Farmers can delete their own files
CREATE POLICY "Farmers can delete own soil reports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'soil-reports' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can read all soil reports
CREATE POLICY "Admins can read all soil reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'soil-reports' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Agents can upload for assigned farmers (will be enforced via edge function/app logic)
CREATE POLICY "Agents can upload soil reports for farmers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'soil-reports' 
  AND has_role(auth.uid(), 'agent'::app_role)
);

-- Agents can read reports for farmers they uploaded
CREATE POLICY "Agents can read soil reports they uploaded"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'soil-reports' 
  AND has_role(auth.uid(), 'agent'::app_role)
);

-- Phase 1: Create soil_test_reports table
CREATE TABLE public.soil_test_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmland_id uuid NOT NULL REFERENCES public.farmlands(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  source_role text NOT NULL DEFAULT 'farmer' CHECK (source_role IN ('farmer', 'agent', 'lab')),
  report_date date NOT NULL,
  lab_name text,
  report_file_path text NOT NULL,
  report_file_type text NOT NULL CHECK (report_file_type IN ('image', 'pdf')),
  report_mime_type text,
  notes text,
  extracted_data jsonb,
  -- ML-ready numeric fields
  ph numeric,
  ec numeric,
  organic_carbon numeric,
  nitrogen numeric,
  phosphorus numeric,
  potassium numeric,
  -- Agent consent fields (Phase 3)
  consent_captured boolean DEFAULT false,
  consent_note text,
  consent_at timestamptz,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX idx_soil_reports_farmland_date ON public.soil_test_reports(farmland_id, report_date DESC);
CREATE INDEX idx_soil_reports_farmer_created ON public.soil_test_reports(farmer_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.soil_test_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Farmers can view their own reports
CREATE POLICY "Farmers can view own soil reports"
ON public.soil_test_reports FOR SELECT
USING (auth.uid() = farmer_id);

-- Farmers can insert their own reports
CREATE POLICY "Farmers can insert own soil reports"
ON public.soil_test_reports FOR INSERT
WITH CHECK (
  auth.uid() = farmer_id 
  AND has_role(auth.uid(), 'farmer'::app_role)
  AND source_role = 'farmer'
);

-- Farmers can update their own reports
CREATE POLICY "Farmers can update own soil reports"
ON public.soil_test_reports FOR UPDATE
USING (auth.uid() = farmer_id);

-- Farmers can delete their own reports
CREATE POLICY "Farmers can delete own soil reports"
ON public.soil_test_reports FOR DELETE
USING (auth.uid() = farmer_id);

-- Admins have full access
CREATE POLICY "Admins can manage all soil reports"
ON public.soil_test_reports FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Agents can insert reports for assigned farmers
CREATE POLICY "Agents can insert soil reports for farmers"
ON public.soil_test_reports FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'agent'::app_role)
  AND source_role = 'agent'
  AND uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM agent_data 
    WHERE agent_data.agent_id = auth.uid() 
    AND agent_data.farmer_id = soil_test_reports.farmer_id
  )
);

-- Agents can view reports they uploaded
CREATE POLICY "Agents can view reports they uploaded"
ON public.soil_test_reports FOR SELECT
USING (
  has_role(auth.uid(), 'agent'::app_role)
  AND uploaded_by = auth.uid()
);

-- Create view for latest soil report per farmland (for reminders)
CREATE OR REPLACE VIEW public.farmland_soil_latest AS
SELECT DISTINCT ON (farmland_id)
  farmland_id,
  id as latest_report_id,
  report_date as last_test_date,
  ph,
  nitrogen,
  phosphorus,
  potassium,
  organic_carbon,
  ec,
  created_at
FROM public.soil_test_reports
ORDER BY farmland_id, report_date DESC;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_soil_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_soil_reports_timestamp
BEFORE UPDATE ON public.soil_test_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_soil_reports_updated_at();