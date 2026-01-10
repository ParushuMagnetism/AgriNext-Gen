-- ============================================
-- PRODUCTION HARDENING: RLS, Indexes, Enhanced Logging
-- ============================================

-- ============================================
-- Part 1: Enhanced web_fetch_logs table
-- ============================================
ALTER TABLE public.web_fetch_logs 
ADD COLUMN IF NOT EXISTS cache_key text,
ADD COLUMN IF NOT EXISTS cache_hit boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS http_status integer,
ADD COLUMN IF NOT EXISTS response_size integer;

-- Drop existing policies to rebuild
DROP POLICY IF EXISTS "No client access to web_fetch_logs" ON public.web_fetch_logs;
DROP POLICY IF EXISTS "Admins can view web fetch logs" ON public.web_fetch_logs;

-- Strict RLS: No client access except admin read
CREATE POLICY "No client write access to web_fetch_logs"
ON public.web_fetch_logs
FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "Admins can read web fetch logs"
ON public.web_fetch_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for observability queries
CREATE INDEX IF NOT EXISTS idx_web_fetch_logs_endpoint_fetched ON public.web_fetch_logs(endpoint, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_fetch_logs_success_fetched ON public.web_fetch_logs(success, fetched_at DESC);

-- ============================================
-- Part 2: weather_cache RLS (already locked down, verify)
-- ============================================
-- Already has "No client access to weather_cache" policy with false/false

-- ============================================
-- Part 3: mandi_registry RLS lockdown
-- ============================================
-- Already has correct policies:
-- "Anyone can view mandi registry" - SELECT with true
-- "Admins can manage mandi registry" - ALL with admin role

-- ============================================
-- Part 4: market_prices RLS - restrict write to admin
-- ============================================
-- Already has:
-- "Anyone can view market prices" - SELECT with true (good for read)
-- "Admins can manage market prices" - ALL with admin (good)
-- This is correct - authenticated users can read, only admins can write

-- ============================================
-- Part 5: price_forecasts RLS - restrict write to admin
-- ============================================
-- Already has:
-- "Anyone can view price forecasts" - SELECT with true
-- "Admins can manage price forecasts" - ALL with admin
-- This is correct

-- ============================================
-- Part 6: Add metadata columns to price_forecasts
-- ============================================
ALTER TABLE public.price_forecasts 
ADD COLUMN IF NOT EXISTS based_on_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_freshness_hours numeric;

-- Index for forecast queries
CREATE INDEX IF NOT EXISTS idx_price_forecasts_crop_generated ON public.price_forecasts(crop_name, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_forecasts_district_generated ON public.price_forecasts(district, generated_at DESC);

-- ============================================
-- Part 7: Enhanced indexes for market_prices
-- ============================================
CREATE INDEX IF NOT EXISTS idx_market_prices_crop_district_fetched ON public.market_prices(crop_name, district, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_prices_state_fetched ON public.market_prices(state, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_prices_market_crop_fetched ON public.market_prices(market_name, crop_name, fetched_at DESC);