
-- Create buyers table
CREATE TABLE public.buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  district TEXT,
  buyer_type TEXT DEFAULT 'retail',
  preferred_crops TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market_orders table
CREATE TABLE public.market_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.buyers(id) ON DELETE CASCADE NOT NULL,
  crop_id UUID REFERENCES public.crops(id),
  farmer_id UUID NOT NULL,
  quantity NUMERIC NOT NULL,
  quantity_unit TEXT DEFAULT 'quintals',
  price_offered NUMERIC,
  status TEXT NOT NULL DEFAULT 'requested',
  transporter_id UUID,
  delivery_date DATE,
  delivery_address TEXT,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_market_logs table
CREATE TABLE public.ai_market_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.buyers(id) ON DELETE CASCADE NOT NULL,
  module_type TEXT NOT NULL,
  input_data JSONB,
  output_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_market_logs ENABLE ROW LEVEL SECURITY;

-- RLS for buyers
CREATE POLICY "Buyers can view own profile" ON public.buyers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Buyers can create own profile" ON public.buyers
  FOR INSERT WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'buyer'::app_role));

CREATE POLICY "Buyers can update own profile" ON public.buyers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Farmers can view buyer info for orders" ON public.buyers
  FOR SELECT USING (has_role(auth.uid(), 'farmer'::app_role));

CREATE POLICY "Agents can view buyers" ON public.buyers
  FOR SELECT USING (has_role(auth.uid(), 'agent'::app_role));

-- RLS for market_orders
CREATE POLICY "Buyers can view own orders" ON public.market_orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.buyers WHERE id = market_orders.buyer_id AND user_id = auth.uid())
  );

CREATE POLICY "Buyers can create orders" ON public.market_orders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.buyers WHERE id = market_orders.buyer_id AND user_id = auth.uid())
  );

CREATE POLICY "Buyers can update own orders" ON public.market_orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.buyers WHERE id = market_orders.buyer_id AND user_id = auth.uid())
  );

CREATE POLICY "Farmers can view orders for their crops" ON public.market_orders
  FOR SELECT USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can update orders for their crops" ON public.market_orders
  FOR UPDATE USING (auth.uid() = farmer_id);

CREATE POLICY "Agents can view all orders" ON public.market_orders
  FOR SELECT USING (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Logistics can view assigned orders" ON public.market_orders
  FOR SELECT USING (auth.uid() = transporter_id OR has_role(auth.uid(), 'logistics'::app_role));

-- RLS for ai_market_logs
CREATE POLICY "Buyers can view own AI logs" ON public.ai_market_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.buyers WHERE id = ai_market_logs.buyer_id AND user_id = auth.uid())
  );

CREATE POLICY "Buyers can create AI logs" ON public.ai_market_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.buyers WHERE id = ai_market_logs.buyer_id AND user_id = auth.uid())
  );

-- Triggers
CREATE TRIGGER update_buyers_updated_at
  BEFORE UPDATE ON public.buyers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_market_orders_updated_at
  BEFORE UPDATE ON public.market_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
