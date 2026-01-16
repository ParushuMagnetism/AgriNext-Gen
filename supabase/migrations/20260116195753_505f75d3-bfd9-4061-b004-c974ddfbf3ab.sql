-- =====================================================
-- PHASE 0: Enhanced Data Model for Mandi Price Sync
-- =====================================================

-- 1) Create district_neighbors table for nearby price comparison
CREATE TABLE IF NOT EXISTS public.district_neighbors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district text NOT NULL,
  neighbor_district text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(district, neighbor_district)
);

-- Add indexes for district_neighbors
CREATE INDEX IF NOT EXISTS idx_district_neighbors_district ON public.district_neighbors(district);

-- Enable RLS
ALTER TABLE public.district_neighbors ENABLE ROW LEVEL SECURITY;

-- RLS: Readable by authenticated, writable by admin
CREATE POLICY "Authenticated can read district_neighbors"
  ON public.district_neighbors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage district_neighbors"
  ON public.district_neighbors FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) Add missing columns to market_prices_raw
ALTER TABLE public.market_prices_raw 
ADD COLUMN IF NOT EXISTS crop_canonical text,
ADD COLUMN IF NOT EXISTS unit text DEFAULT 'quintal',
ADD COLUMN IF NOT EXISTS min_price numeric,
ADD COLUMN IF NOT EXISTS max_price numeric,
ADD COLUMN IF NOT EXISTS modal_price numeric,
ADD COLUMN IF NOT EXISTS source_name text,
ADD COLUMN IF NOT EXISTS reliability_score integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS content_hash text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'success',
ADD COLUMN IF NOT EXISTS error text;

-- Add indexes for market_prices_raw
CREATE INDEX IF NOT EXISTS idx_market_prices_raw_segment 
  ON public.market_prices_raw(state, district, crop_canonical, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_prices_raw_content_hash 
  ON public.market_prices_raw(content_hash);
CREATE INDEX IF NOT EXISTS idx_market_prices_raw_status 
  ON public.market_prices_raw(status, fetched_at DESC);

-- 3) Add missing columns to market_prices_agg
ALTER TABLE public.market_prices_agg
ADD COLUMN IF NOT EXISTS min_price numeric,
ADD COLUMN IF NOT EXISTS max_price numeric,
ADD COLUMN IF NOT EXISTS freshness_minutes integer;

-- Add index for faster agg queries
CREATE INDEX IF NOT EXISTS idx_market_prices_agg_district_crop 
  ON public.market_prices_agg(district, crop_name, fetched_at DESC);

-- 4) Add function_name column to web_fetch_logs if missing
ALTER TABLE public.web_fetch_logs
ADD COLUMN IF NOT EXISTS function_name text,
ADD COLUMN IF NOT EXISTS request_json jsonb,
ADD COLUMN IF NOT EXISTS response_meta jsonb;

-- 5) Seed Karnataka district neighbors (common adjacencies)
INSERT INTO public.district_neighbors (district, neighbor_district) VALUES
  ('Bengaluru Urban', 'Bengaluru Rural'),
  ('Bengaluru Urban', 'Ramanagara'),
  ('Bengaluru Rural', 'Bengaluru Urban'),
  ('Bengaluru Rural', 'Kolar'),
  ('Bengaluru Rural', 'Tumkur'),
  ('Mysuru', 'Mandya'),
  ('Mysuru', 'Chamarajanagar'),
  ('Mysuru', 'Hassan'),
  ('Mandya', 'Mysuru'),
  ('Mandya', 'Bengaluru Rural'),
  ('Mandya', 'Hassan'),
  ('Hassan', 'Mysuru'),
  ('Hassan', 'Mandya'),
  ('Hassan', 'Chikmagalur'),
  ('Tumkur', 'Bengaluru Rural'),
  ('Tumkur', 'Chitradurga'),
  ('Tumkur', 'Hassan'),
  ('Bellary', 'Davanagere'),
  ('Bellary', 'Koppal'),
  ('Bellary', 'Raichur'),
  ('Dharwad', 'Belgaum'),
  ('Dharwad', 'Gadag'),
  ('Dharwad', 'Haveri'),
  ('Belgaum', 'Dharwad'),
  ('Belgaum', 'Bagalkot'),
  ('Davangere', 'Chitradurga'),
  ('Davangere', 'Shimoga'),
  ('Davangere', 'Haveri'),
  ('Shimoga', 'Davangere'),
  ('Shimoga', 'Chikmagalur'),
  ('Shimoga', 'Uttara Kannada'),
  ('Gulbarga', 'Bidar'),
  ('Gulbarga', 'Raichur'),
  ('Gulbarga', 'Yadgir'),
  ('Raichur', 'Gulbarga'),
  ('Raichur', 'Bellary'),
  ('Raichur', 'Koppal'),
  ('Koppal', 'Raichur'),
  ('Koppal', 'Bellary'),
  ('Koppal', 'Gadag'),
  ('Gadag', 'Dharwad'),
  ('Gadag', 'Koppal'),
  ('Gadag', 'Haveri'),
  ('Haveri', 'Dharwad'),
  ('Haveri', 'Gadag'),
  ('Haveri', 'Davangere'),
  ('Chikmagalur', 'Hassan'),
  ('Chikmagalur', 'Shimoga'),
  ('Chikmagalur', 'Uttara Kannada')
ON CONFLICT (district, neighbor_district) DO NOTHING;