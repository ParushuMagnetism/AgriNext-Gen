-- Add traceability fields to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS trace_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS trace_status TEXT NOT NULL DEFAULT 'published',
ADD COLUMN IF NOT EXISTS inputs_summary TEXT,
ADD COLUMN IF NOT EXISTS test_report_urls JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Add check constraint for trace_status
ALTER TABLE public.listings
ADD CONSTRAINT listings_trace_status_check 
CHECK (trace_status IN ('draft', 'published'));

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_listings_trace_code ON public.listings(trace_code);
CREATE INDEX IF NOT EXISTS idx_listings_trace_status ON public.listings(trace_status);

-- Create function to auto-generate trace_code on insert
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
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate trace_code
DROP TRIGGER IF EXISTS trigger_generate_listing_trace_code ON public.listings;
CREATE TRIGGER trigger_generate_listing_trace_code
  BEFORE INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_listing_trace_code();

-- Add RLS policy for public access to trace info (read-only, published only)
CREATE POLICY "Anyone can view published trace info"
ON public.listings
FOR SELECT
USING (trace_status = 'published');