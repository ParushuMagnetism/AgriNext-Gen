
-- Create farmlands table
CREATE TABLE public.farmlands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area NUMERIC NOT NULL DEFAULT 0,
  area_unit TEXT NOT NULL DEFAULT 'acres',
  soil_type TEXT,
  village TEXT,
  district TEXT,
  location_lat NUMERIC,
  location_long NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create crops table with status enum
CREATE TYPE public.crop_status AS ENUM ('growing', 'one_week', 'ready', 'harvested');

CREATE TABLE public.crops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  land_id UUID REFERENCES public.farmlands(id) ON DELETE SET NULL,
  crop_name TEXT NOT NULL,
  variety TEXT,
  sowing_date DATE,
  harvest_estimate DATE,
  status crop_status NOT NULL DEFAULT 'growing',
  estimated_quantity NUMERIC,
  quantity_unit TEXT DEFAULT 'quintals',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transport_requests table with status enum
CREATE TYPE public.transport_status AS ENUM ('requested', 'assigned', 'en_route', 'picked_up', 'delivered', 'cancelled');

CREATE TABLE public.transport_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES public.crops(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  quantity_unit TEXT DEFAULT 'quintals',
  pickup_location TEXT NOT NULL,
  pickup_village TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  status transport_status NOT NULL DEFAULT 'requested',
  transporter_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market_prices table
CREATE TYPE public.price_trend AS ENUM ('up', 'down', 'flat');

CREATE TABLE public.market_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crop_name TEXT NOT NULL,
  market_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  modal_price NUMERIC NOT NULL,
  min_price NUMERIC,
  max_price NUMERIC,
  trend_direction price_trend DEFAULT 'flat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.farmlands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for farmlands
CREATE POLICY "Farmers can view own farmlands" ON public.farmlands
  FOR SELECT USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can create own farmlands" ON public.farmlands
  FOR INSERT WITH CHECK (auth.uid() = farmer_id AND has_role(auth.uid(), 'farmer'::app_role));

CREATE POLICY "Farmers can update own farmlands" ON public.farmlands
  FOR UPDATE USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can delete own farmlands" ON public.farmlands
  FOR DELETE USING (auth.uid() = farmer_id);

-- RLS Policies for crops
CREATE POLICY "Farmers can view own crops" ON public.crops
  FOR SELECT USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can create own crops" ON public.crops
  FOR INSERT WITH CHECK (auth.uid() = farmer_id AND has_role(auth.uid(), 'farmer'::app_role));

CREATE POLICY "Farmers can update own crops" ON public.crops
  FOR UPDATE USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can delete own crops" ON public.crops
  FOR DELETE USING (auth.uid() = farmer_id);

CREATE POLICY "Agents can view assigned farmer crops" ON public.crops
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agent_data 
      WHERE agent_data.farmer_id = crops.farmer_id 
      AND agent_data.agent_id = auth.uid()
    )
  );

-- RLS Policies for transport_requests
CREATE POLICY "Farmers can view own transport requests" ON public.transport_requests
  FOR SELECT USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can create transport requests" ON public.transport_requests
  FOR INSERT WITH CHECK (auth.uid() = farmer_id AND has_role(auth.uid(), 'farmer'::app_role));

CREATE POLICY "Farmers can update own transport requests" ON public.transport_requests
  FOR UPDATE USING (auth.uid() = farmer_id);

CREATE POLICY "Logistics can view assigned requests" ON public.transport_requests
  FOR SELECT USING (auth.uid() = transporter_id OR has_role(auth.uid(), 'logistics'::app_role));

CREATE POLICY "Logistics can update assigned requests" ON public.transport_requests
  FOR UPDATE USING (auth.uid() = transporter_id OR has_role(auth.uid(), 'logistics'::app_role));

-- RLS Policies for market_prices (public read)
CREATE POLICY "Anyone can view market prices" ON public.market_prices
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage market prices" ON public.market_prices
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_farmlands_updated_at
  BEFORE UPDATE ON public.farmlands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crops_updated_at
  BEFORE UPDATE ON public.crops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transport_requests_updated_at
  BEFORE UPDATE ON public.transport_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add village and district to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS village TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_land_area NUMERIC DEFAULT 0;
