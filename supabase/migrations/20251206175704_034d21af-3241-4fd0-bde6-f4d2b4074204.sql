-- Enable realtime for crops table
ALTER TABLE public.crops REPLICA IDENTITY FULL;

-- Enable realtime for transport_requests table
ALTER TABLE public.transport_requests REPLICA IDENTITY FULL;

-- Enable realtime for farmlands table
ALTER TABLE public.farmlands REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'crops'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crops;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'transport_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transport_requests;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'farmlands'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.farmlands;
  END IF;
END $$;