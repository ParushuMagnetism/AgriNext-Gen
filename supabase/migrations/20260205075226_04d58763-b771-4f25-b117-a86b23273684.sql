-- Fix search_path for generate_listing_trace_code function
CREATE OR REPLACE FUNCTION public.generate_listing_trace_code()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  new_code TEXT;
BEGIN
  -- Only generate if trace_code is null
  IF NEW.trace_code IS NULL THEN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(trace_code FROM 'AGN-LST-' || year_part || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO seq_num
    FROM public.listings
    WHERE trace_code LIKE 'AGN-LST-' || year_part || '-%';
    
    -- Format: AGN-LST-YYYY-NNNNNN
    new_code := 'AGN-LST-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
    NEW.trace_code := new_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;