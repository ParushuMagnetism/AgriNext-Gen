-- Phase 2: Add preferred_language column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';

-- Phase 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_market_orders_farmer_status 
ON public.market_orders(farmer_id, status);

CREATE INDEX IF NOT EXISTS idx_crops_farmer_status 
ON public.crops(farmer_id, status);

CREATE INDEX IF NOT EXISTS idx_transport_requests_farmer_status 
ON public.transport_requests(farmer_id, status);

CREATE INDEX IF NOT EXISTS idx_market_prices_crop_date 
ON public.market_prices(crop_name, date DESC);

CREATE INDEX IF NOT EXISTS idx_market_prices_agg_district_crop 
ON public.market_prices_agg(district, crop_name);