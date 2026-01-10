-- ========================================================
-- PART A: FARMER LOCATION CAPTURE & DISTRICT NORMALIZATION
-- ========================================================

-- 1. Add new columns to profiles (if not already present)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS taluk text,
ADD COLUMN IF NOT EXISTS pincode text,
ADD COLUMN IF NOT EXISTS district_source text CHECK (district_source IN ('user', 'pincode', 'agent', 'unknown')),
ADD COLUMN IF NOT EXISTS district_confidence text CHECK (district_confidence IN ('high', 'medium', 'low'));

-- 2. Create Karnataka Districts lookup table
CREATE TABLE IF NOT EXISTS public.karnataka_districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.karnataka_districts ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read districts
CREATE POLICY "Anyone can read karnataka_districts"
  ON public.karnataka_districts
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admin can insert/update/delete districts
CREATE POLICY "Admin can manage karnataka_districts"
  ON public.karnataka_districts
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3. Seed all 31 Karnataka districts (canonical names)
INSERT INTO public.karnataka_districts (district) VALUES
  ('Bagalkot'),
  ('Ballari'),
  ('Belagavi'),
  ('Bengaluru Rural'),
  ('Bengaluru Urban'),
  ('Bidar'),
  ('Chamarajanagar'),
  ('Chikkaballapura'),
  ('Chikkamagaluru'),
  ('Chitradurga'),
  ('Dakshina Kannada'),
  ('Davanagere'),
  ('Dharwad'),
  ('Gadag'),
  ('Hassan'),
  ('Haveri'),
  ('Kalaburagi'),
  ('Kodagu'),
  ('Kolar'),
  ('Koppal'),
  ('Mandya'),
  ('Mysuru'),
  ('Raichur'),
  ('Ramanagara'),
  ('Shivamogga'),
  ('Tumakuru'),
  ('Udupi'),
  ('Uttara Kannada'),
  ('Vijayapura'),
  ('Yadgir')
ON CONFLICT (district) DO NOTHING;

-- 4. Create helper function to normalize district names
CREATE OR REPLACE FUNCTION public.normalize_district(input_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized text;
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Try exact match (case-insensitive, trimmed)
  SELECT district INTO normalized
  FROM karnataka_districts
  WHERE lower(trim(district)) = lower(trim(input_text))
  LIMIT 1;
  
  IF normalized IS NOT NULL THEN
    RETURN normalized;
  END IF;
  
  -- Try fuzzy match (contains)
  SELECT district INTO normalized
  FROM karnataka_districts
  WHERE lower(trim(district)) LIKE '%' || lower(trim(input_text)) || '%'
     OR lower(trim(input_text)) LIKE '%' || lower(trim(district)) || '%'
  LIMIT 1;
  
  RETURN normalized; -- Returns NULL if no match
END;
$$;

-- ========================================================
-- PHASE 0: FOUNDATIONAL DATA MODEL FOR FIRECRAWL
-- ========================================================

-- 5. Create crop_aliases table for normalization
CREATE TABLE IF NOT EXISTS public.crop_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  alias text NOT NULL,
  language_code text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  UNIQUE(canonical_name, alias)
);

ALTER TABLE public.crop_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read crop_aliases"
  ON public.crop_aliases
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage crop_aliases"
  ON public.crop_aliases
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed common Karnataka crop aliases
INSERT INTO public.crop_aliases (canonical_name, alias, language_code) VALUES
  -- Rice
  ('Rice', 'Rice', 'en'),
  ('Rice', 'Paddy', 'en'),
  ('Rice', 'Bhatta', 'hi'),
  ('Rice', 'Akki', 'kn'),
  -- Ragi
  ('Ragi', 'Ragi', 'en'),
  ('Ragi', 'Finger Millet', 'en'),
  ('Ragi', 'Nachni', 'hi'),
  -- Jowar
  ('Jowar', 'Jowar', 'en'),
  ('Jowar', 'Sorghum', 'en'),
  ('Jowar', 'Jola', 'kn'),
  -- Maize
  ('Maize', 'Maize', 'en'),
  ('Maize', 'Corn', 'en'),
  ('Maize', 'Makka', 'hi'),
  ('Maize', 'Mekkejola', 'kn'),
  -- Groundnut
  ('Groundnut', 'Groundnut', 'en'),
  ('Groundnut', 'Peanut', 'en'),
  ('Groundnut', 'Moongphali', 'hi'),
  ('Groundnut', 'Kadalekayi', 'kn'),
  -- Sugarcane
  ('Sugarcane', 'Sugarcane', 'en'),
  ('Sugarcane', 'Ganna', 'hi'),
  ('Sugarcane', 'Kabbu', 'kn'),
  -- Cotton
  ('Cotton', 'Cotton', 'en'),
  ('Cotton', 'Kapas', 'hi'),
  ('Cotton', 'Hatti', 'kn'),
  -- Areca Nut
  ('Areca Nut', 'Areca Nut', 'en'),
  ('Areca Nut', 'Betel Nut', 'en'),
  ('Areca Nut', 'Supari', 'hi'),
  ('Areca Nut', 'Adike', 'kn'),
  -- Coconut
  ('Coconut', 'Coconut', 'en'),
  ('Coconut', 'Nariyal', 'hi'),
  ('Coconut', 'Thenginakayi', 'kn'),
  -- Onion
  ('Onion', 'Onion', 'en'),
  ('Onion', 'Pyaz', 'hi'),
  ('Onion', 'Eerulli', 'kn'),
  -- Tomato
  ('Tomato', 'Tomato', 'en'),
  ('Tomato', 'Tamatar', 'hi'),
  ('Tomato', 'Tomate', 'kn'),
  -- Potato
  ('Potato', 'Potato', 'en'),
  ('Potato', 'Aloo', 'hi'),
  ('Potato', 'Aalugadde', 'kn'),
  -- Chilli
  ('Chilli', 'Chilli', 'en'),
  ('Chilli', 'Red Chilli', 'en'),
  ('Chilli', 'Green Chilli', 'en'),
  ('Chilli', 'Mirchi', 'hi'),
  ('Chilli', 'Menasinakayi', 'kn'),
  -- Tur Dal
  ('Tur Dal', 'Tur Dal', 'en'),
  ('Tur Dal', 'Toor Dal', 'en'),
  ('Tur Dal', 'Arhar', 'hi'),
  ('Tur Dal', 'Togari', 'kn'),
  -- Banana
  ('Banana', 'Banana', 'en'),
  ('Banana', 'Kela', 'hi'),
  ('Banana', 'Bale Hannu', 'kn'),
  -- Mango
  ('Mango', 'Mango', 'en'),
  ('Mango', 'Aam', 'hi'),
  ('Mango', 'Mavu', 'kn'),
  -- Coffee
  ('Coffee', 'Coffee', 'en'),
  ('Coffee', 'Kaapi', 'kn')
ON CONFLICT (canonical_name, alias) DO NOTHING;

-- 6. Create trusted_sources table (registry of crawl targets)
CREATE TABLE IF NOT EXISTS public.trusted_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  category text NOT NULL CHECK (category IN ('mandi', 'scheme', 'advisory', 'calendar', 'input_price', 'news')),
  state text DEFAULT 'Karnataka',
  district text,
  crop_canonical text,
  priority int DEFAULT 1,
  crawl_frequency_hours int DEFAULT 24,
  active boolean DEFAULT true,
  last_crawled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trusted_sources_lookup 
  ON public.trusted_sources (category, state, district, crop_canonical, active);

ALTER TABLE public.trusted_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage trusted_sources"
  ON public.trusted_sources
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed initial trusted sources (URLs can be added/updated later)
INSERT INTO public.trusted_sources (name, url, category, state, priority) VALUES
  ('Karnataka Agmarknet', 'https://agmarknet.gov.in', 'mandi', 'Karnataka', 1),
  ('Karnataka Agriculture Portal', 'https://raitamitra.karnataka.gov.in', 'advisory', 'Karnataka', 1),
  ('PM-KISAN Portal', 'https://pmkisan.gov.in', 'scheme', 'Karnataka', 2),
  ('Karnataka Crop Insurance', 'https://pmfby.gov.in', 'scheme', 'Karnataka', 2),
  ('Karnataka Agriculture Dept', 'https://krishimaratavahini.karnataka.gov.in', 'news', 'Karnataka', 1)
ON CONFLICT DO NOTHING;

-- 7. Create web_documents table (RAW storage)
CREATE TABLE IF NOT EXISTS public.web_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.trusted_sources(id) ON DELETE CASCADE,
  url text NOT NULL,
  extracted_text text,
  extracted_json jsonb,
  content_hash text,
  fetched_at timestamptz DEFAULT now(),
  status text DEFAULT 'success' CHECK (status IN ('success', 'fail')),
  error text
);

CREATE INDEX IF NOT EXISTS idx_web_documents_source ON public.web_documents (source_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_documents_status ON public.web_documents (status, fetched_at DESC);

ALTER TABLE public.web_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage web_documents"
  ON public.web_documents
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 8. Create agri_advisories table (clean domain table)
CREATE TABLE IF NOT EXISTS public.agri_advisories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text DEFAULT 'Karnataka',
  district text,
  crop_name text,
  title text NOT NULL,
  summary text,
  recommended_actions text,
  published_date date,
  source_url text,
  fetched_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agri_advisories_lookup 
  ON public.agri_advisories (district, crop_name, fetched_at DESC);

ALTER TABLE public.agri_advisories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read agri_advisories"
  ON public.agri_advisories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage agri_advisories"
  ON public.agri_advisories
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 9. Create schemes_catalog table
CREATE TABLE IF NOT EXISTS public.schemes_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text DEFAULT 'Karnataka',
  scheme_name text NOT NULL,
  eligibility text,
  benefits text,
  documents text,
  apply_steps text,
  deadline text,
  official_link text,
  fetched_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schemes_catalog_lookup 
  ON public.schemes_catalog (state, fetched_at DESC);

ALTER TABLE public.schemes_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read schemes_catalog"
  ON public.schemes_catalog
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage schemes_catalog"
  ON public.schemes_catalog
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 10. Create market_prices_agg table (personalized aggregates with confidence)
CREATE TABLE IF NOT EXISTS public.market_prices_agg (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name text NOT NULL,
  district text NOT NULL,
  state text DEFAULT 'Karnataka',
  modal_price numeric,
  unit text DEFAULT 'quintal',
  confidence text CHECK (confidence IN ('low', 'medium', 'high')),
  sources_count int DEFAULT 1,
  sources_used jsonb,
  fetched_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_prices_agg_lookup 
  ON public.market_prices_agg (district, crop_name, fetched_at DESC);

ALTER TABLE public.market_prices_agg ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read market_prices_agg"
  ON public.market_prices_agg
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage market_prices_agg"
  ON public.market_prices_agg
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 11. Create farmer_segments table for efficient crawling
CREATE TABLE IF NOT EXISTS public.farmer_segments (
  segment_key text PRIMARY KEY,
  state text DEFAULT 'Karnataka',
  district text NOT NULL,
  crop_canonical text NOT NULL,
  active_farmer_count int DEFAULT 0,
  crawl_frequency_hours int DEFAULT 12,
  last_crawled_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_farmer_segments_due
  ON public.farmer_segments (last_crawled_at, active_farmer_count);

ALTER TABLE public.farmer_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage farmer_segments"
  ON public.farmer_segments
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 12. Add source_id column to web_fetch_logs for better tracking
ALTER TABLE public.web_fetch_logs 
ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES public.trusted_sources(id),
ADD COLUMN IF NOT EXISTS segment_key text;

-- Add index for new columns
CREATE INDEX IF NOT EXISTS idx_web_fetch_logs_source 
  ON public.web_fetch_logs (source_id, fetched_at DESC);