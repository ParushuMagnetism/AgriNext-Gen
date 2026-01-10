-- Create ai_farmer_logs table for logging all assistant interactions
-- Note: web_cache table already exists in the schema

-- Add indexes to existing web_cache table for better query performance
CREATE INDEX IF NOT EXISTS idx_web_cache_topic ON public.web_cache(topic);
CREATE INDEX IF NOT EXISTS idx_web_cache_fetched_at ON public.web_cache(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_cache_location_crop ON public.web_cache(location_key, crop_key);

-- Enable RLS on web_cache (Edge Function only access via service role)
ALTER TABLE public.web_cache ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT policies for anon/authenticated - only service role can access
-- This ensures only Edge Functions can read/write to the cache

-- Create ai_farmer_logs table if it doesn't exist (check existing schema - it exists but let's add indexes)
-- Add indexes to existing ai_farmer_logs table
CREATE INDEX IF NOT EXISTS idx_ai_farmer_logs_user_created ON public.ai_farmer_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_farmer_logs_router_category ON public.ai_farmer_logs(router_category);
CREATE INDEX IF NOT EXISTS idx_ai_farmer_logs_used_web ON public.ai_farmer_logs(used_web);

-- Enable RLS on ai_farmer_logs
ALTER TABLE public.ai_farmer_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Farmers can read only their own logs
CREATE POLICY "Farmers can read own logs"
ON public.ai_farmer_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Admin can read all logs (using has_role function)
CREATE POLICY "Admins can read all logs"
ON public.ai_farmer_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);