
-- Create transporters table (extends profiles for logistics users)
CREATE TABLE public.transporters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  vehicle_type TEXT,
  vehicle_capacity NUMERIC,
  registration_number TEXT,
  operating_village TEXT,
  operating_district TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transporter_id UUID REFERENCES public.transporters(id) ON DELETE CASCADE NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'truck',
  capacity NUMERIC NOT NULL DEFAULT 10,
  number_plate TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI transport logs table
CREATE TABLE public.ai_transport_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transporter_id UUID REFERENCES public.transporters(id) ON DELETE CASCADE NOT NULL,
  log_type TEXT NOT NULL DEFAULT 'route_optimization',
  input_data JSONB,
  output_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to transport_requests if they don't exist
ALTER TABLE public.transport_requests 
  ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.vehicles(id),
  ADD COLUMN IF NOT EXISTS pickup_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS distance_km NUMERIC,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on new tables
ALTER TABLE public.transporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_transport_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transporters
CREATE POLICY "Transporters can view own profile" ON public.transporters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Transporters can create own profile" ON public.transporters
  FOR INSERT WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'logistics'::app_role));

CREATE POLICY "Transporters can update own profile" ON public.transporters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Agents can view transporters" ON public.transporters
  FOR SELECT USING (has_role(auth.uid(), 'agent'::app_role));

-- RLS Policies for vehicles
CREATE POLICY "Transporters can view own vehicles" ON public.vehicles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.transporters WHERE id = vehicles.transporter_id AND user_id = auth.uid())
  );

CREATE POLICY "Transporters can create vehicles" ON public.vehicles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.transporters WHERE id = vehicles.transporter_id AND user_id = auth.uid())
  );

CREATE POLICY "Transporters can update own vehicles" ON public.vehicles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.transporters WHERE id = vehicles.transporter_id AND user_id = auth.uid())
  );

CREATE POLICY "Transporters can delete own vehicles" ON public.vehicles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.transporters WHERE id = vehicles.transporter_id AND user_id = auth.uid())
  );

-- RLS Policies for ai_transport_logs
CREATE POLICY "Transporters can view own AI logs" ON public.ai_transport_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.transporters WHERE id = ai_transport_logs.transporter_id AND user_id = auth.uid())
  );

CREATE POLICY "Transporters can create AI logs" ON public.ai_transport_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.transporters WHERE id = ai_transport_logs.transporter_id AND user_id = auth.uid())
  );

-- Update RLS policy for transport_requests to allow logistics to view all requests
CREATE POLICY "Logistics can view all transport requests" ON public.transport_requests
  FOR SELECT USING (has_role(auth.uid(), 'logistics'::app_role));

CREATE POLICY "Agents can view all transport requests" ON public.transport_requests
  FOR SELECT USING (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can create transport requests" ON public.transport_requests
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'agent'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_transporters_updated_at
  BEFORE UPDATE ON public.transporters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
