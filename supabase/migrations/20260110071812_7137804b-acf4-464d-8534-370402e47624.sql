-- ========================================================
-- PHASE 1 ADDITIONS: Additional clean domain tables
-- ========================================================

-- 1. market_prices_raw (for debugging and resilience)
CREATE TABLE IF NOT EXISTS public.market_prices_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name text NOT NULL,
  mandi_name text,
  district text,
  state text DEFAULT 'Karnataka',
  raw_json jsonb,
  source_url text,
  fetched_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_prices_raw_lookup 
  ON public.market_prices_raw (district, crop_name, fetched_at DESC);

ALTER TABLE public.market_prices_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage market_prices_raw"
  ON public.market_prices_raw
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. crop_calendar table
CREATE TABLE IF NOT EXISTS public.crop_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text DEFAULT 'Karnataka',
  crop_name text NOT NULL,
  season text,
  sowing_window text,
  irrigation_notes text,
  nutrient_notes text,
  pest_watchouts text,
  source_url text,
  fetched_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crop_calendar_lookup 
  ON public.crop_calendar (crop_name, fetched_at DESC);

ALTER TABLE public.crop_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read crop_calendar"
  ON public.crop_calendar
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage crop_calendar"
  ON public.crop_calendar
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3. input_prices table
CREATE TABLE IF NOT EXISTS public.input_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text DEFAULT 'Karnataka',
  district text,
  item_type text CHECK (item_type IN ('seed', 'fertilizer', 'pesticide')),
  item_name text NOT NULL,
  brand text,
  price_min numeric,
  price_max numeric,
  unit text DEFAULT 'kg',
  source_url text,
  fetched_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_input_prices_lookup 
  ON public.input_prices (district, item_type, fetched_at DESC);

ALTER TABLE public.input_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read input_prices"
  ON public.input_prices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage input_prices"
  ON public.input_prices
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. Add source_url column to existing market_prices if not exists
ALTER TABLE public.market_prices 
ADD COLUMN IF NOT EXISTS source_url text;

-- 5. Create function to normalize crop name using aliases
CREATE OR REPLACE FUNCTION public.normalize_crop_name(input_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  canonical text;
BEGIN
  IF input_name IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Try exact match (case-insensitive)
  SELECT ca.canonical_name INTO canonical
  FROM crop_aliases ca
  WHERE lower(trim(ca.alias)) = lower(trim(input_name))
  LIMIT 1;
  
  IF canonical IS NOT NULL THEN
    RETURN canonical;
  END IF;
  
  -- Return input as-is if no alias found
  RETURN trim(input_name);
END;
$$;

-- 6. Add additional indexes to existing tables for better query performance
CREATE INDEX IF NOT EXISTS idx_market_prices_district_crop 
  ON public.market_prices (district, crop_name, date DESC);

CREATE INDEX IF NOT EXISTS idx_crops_active 
  ON public.crops (farmer_id, status) 
  WHERE status != 'harvested';

CREATE INDEX IF NOT EXISTS idx_profiles_district 
  ON public.profiles (district) 
  WHERE district IS NOT NULL;