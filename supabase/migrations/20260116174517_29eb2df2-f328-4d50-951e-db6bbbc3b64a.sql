-- Fix security definer view by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.farmland_soil_latest;

CREATE VIEW public.farmland_soil_latest 
WITH (security_invoker = true)
AS
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