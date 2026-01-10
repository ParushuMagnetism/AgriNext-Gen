-- =============================================
-- A) WEATHER CACHE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.weather_cache (
  location_key text PRIMARY KEY,
  data jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

-- Index for cleanup/TTL queries
CREATE INDEX IF NOT EXISTS idx_weather_cache_fetched_at ON public.weather_cache(fetched_at DESC);

-- Enable RLS - only edge functions can access
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;

-- No direct client access
CREATE POLICY "No client access to weather_cache"
  ON public.weather_cache
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- =============================================
-- B) MANDI REGISTRY TABLE (Karnataka focus)
-- =============================================
CREATE TABLE IF NOT EXISTS public.mandi_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandi_name text NOT NULL,
  district text NOT NULL,
  state text NOT NULL DEFAULT 'Karnataka',
  priority int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_mandi_registry_state_district ON public.mandi_registry(state, district);
CREATE INDEX IF NOT EXISTS idx_mandi_registry_priority ON public.mandi_registry(priority DESC);

-- Enable RLS
ALTER TABLE public.mandi_registry ENABLE ROW LEVEL SECURITY;

-- Anyone can view mandi registry
CREATE POLICY "Anyone can view mandi registry"
  ON public.mandi_registry
  FOR SELECT
  USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage mandi registry"
  ON public.mandi_registry
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed Karnataka mandis
INSERT INTO public.mandi_registry (mandi_name, district, state, priority) VALUES
  ('Bengaluru APMC', 'Bengaluru Urban', 'Karnataka', 1),
  ('Mysuru APMC', 'Mysuru', 'Karnataka', 1),
  ('Hubli-Dharwad APMC', 'Dharwad', 'Karnataka', 1),
  ('Belgaum APMC', 'Belgaum', 'Karnataka', 2),
  ('Mangaluru APMC', 'Dakshina Kannada', 'Karnataka', 2),
  ('Davangere APMC', 'Davangere', 'Karnataka', 2),
  ('Shimoga APMC', 'Shimoga', 'Karnataka', 3),
  ('Tumkur APMC', 'Tumkur', 'Karnataka', 3),
  ('Hassan APMC', 'Hassan', 'Karnataka', 3),
  ('Kolar APMC', 'Kolar', 'Karnataka', 3)
ON CONFLICT DO NOTHING;

-- =============================================
-- C) UPDATE MARKET_PRICES TABLE
-- =============================================
-- Add new columns if they don't exist
ALTER TABLE public.market_prices 
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS state text DEFAULT 'Karnataka',
  ADD COLUMN IF NOT EXISTS unit text DEFAULT 'quintal',
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS fetched_at timestamptz DEFAULT now();

-- Update existing rows to have Karnataka state
UPDATE public.market_prices SET state = 'Karnataka' WHERE state IS NULL;

-- Add better indexes
CREATE INDEX IF NOT EXISTS idx_market_prices_crop_district_date ON public.market_prices(crop_name, district, date DESC);
CREATE INDEX IF NOT EXISTS idx_market_prices_state_date ON public.market_prices(state, date DESC);
CREATE INDEX IF NOT EXISTS idx_market_prices_fetched_at ON public.market_prices(fetched_at DESC);

-- =============================================
-- D) PRICE FORECASTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.price_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name text NOT NULL,
  district text NOT NULL,
  state text NOT NULL DEFAULT 'Karnataka',
  direction text NOT NULL CHECK (direction IN ('up', 'down', 'stable')),
  confidence text NOT NULL DEFAULT 'low' CHECK (confidence IN ('low', 'medium', 'high')),
  reason text,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_price_forecasts_crop_district ON public.price_forecasts(crop_name, district);
CREATE INDEX IF NOT EXISTS idx_price_forecasts_generated_at ON public.price_forecasts(generated_at DESC);

-- Enable RLS
ALTER TABLE public.price_forecasts ENABLE ROW LEVEL SECURITY;

-- Anyone can view forecasts
CREATE POLICY "Anyone can view price forecasts"
  ON public.price_forecasts
  FOR SELECT
  USING (true);

-- Admins can manage
CREATE POLICY "Admins can manage price forecasts"
  ON public.price_forecasts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- E) WEB FETCH LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.web_fetch_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL,
  query text,
  success boolean NOT NULL DEFAULT true,
  latency_ms int,
  error text,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

-- Index for debugging
CREATE INDEX IF NOT EXISTS idx_web_fetch_logs_endpoint ON public.web_fetch_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_web_fetch_logs_fetched_at ON public.web_fetch_logs(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_fetch_logs_success ON public.web_fetch_logs(success);

-- Enable RLS
ALTER TABLE public.web_fetch_logs ENABLE ROW LEVEL SECURITY;

-- No client access
CREATE POLICY "No client access to web_fetch_logs"
  ON public.web_fetch_logs
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Admins can read logs
CREATE POLICY "Admins can view web fetch logs"
  ON public.web_fetch_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));