-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('farmer', 'buyer', 'agent', 'logistics', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create listings table for marketplace
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  quantity DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create agent_data table for soil/crop information
CREATE TABLE public.agent_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  farm_location TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  soil_type TEXT,
  soil_ph DECIMAL(3,1),
  soil_moisture TEXT,
  crop_type TEXT,
  crop_health TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create logistics_routes table
CREATE TABLE public.logistics_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logistics_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_location TEXT NOT NULL,
  end_location TEXT NOT NULL,
  waypoints JSONB DEFAULT '[]',
  distance_km DECIMAL(10,2),
  estimated_time_mins INTEGER,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create farm_pickups table
CREATE TABLE public.farm_pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES public.logistics_routes(id) ON DELETE SET NULL,
  logistics_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  pickup_location TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  quantity DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_pickups ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone'
  );
  
  -- Insert role from metadata
  IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data ->> 'role')::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create function to notify farmer on pickup
CREATE OR REPLACE FUNCTION public.notify_farmer_on_pickup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.farmer_id,
    'Pickup Scheduled',
    'A pickup has been scheduled for ' || NEW.scheduled_date || ' at ' || NEW.pickup_location,
    'pickup'
  );
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_data_updated_at
  BEFORE UPDATE ON public.agent_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_logistics_routes_updated_at
  BEFORE UPDATE ON public.logistics_routes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farm_pickups_updated_at
  BEFORE UPDATE ON public.farm_pickups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_farm_pickup_created
  AFTER INSERT ON public.farm_pickups
  FOR EACH ROW EXECUTE FUNCTION public.notify_farmer_on_pickup();

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles (read-only for users, managed by triggers)
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for listings
CREATE POLICY "Active listings are viewable by everyone"
  ON public.listings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Sellers can view own listings"
  ON public.listings FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Farmers can create listings"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id AND public.has_role(auth.uid(), 'farmer'));

CREATE POLICY "Farmers can update own listings"
  ON public.listings FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Farmers can delete own listings"
  ON public.listings FOR DELETE
  USING (auth.uid() = seller_id);

-- RLS Policies for favorites
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update message read status"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for agent_data
CREATE POLICY "Agents can view own data"
  ON public.agent_data FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Farmers can view data about their farms"
  ON public.agent_data FOR SELECT
  USING (auth.uid() = farmer_id);

CREATE POLICY "Agents can create data"
  ON public.agent_data FOR INSERT
  WITH CHECK (auth.uid() = agent_id AND public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Agents can update own data"
  ON public.agent_data FOR UPDATE
  USING (auth.uid() = agent_id);

CREATE POLICY "Admins can view all agent data"
  ON public.agent_data FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for logistics_routes
CREATE POLICY "Logistics can view own routes"
  ON public.logistics_routes FOR SELECT
  USING (auth.uid() = logistics_id);

CREATE POLICY "Logistics can create routes"
  ON public.logistics_routes FOR INSERT
  WITH CHECK (auth.uid() = logistics_id AND public.has_role(auth.uid(), 'logistics'));

CREATE POLICY "Logistics can update own routes"
  ON public.logistics_routes FOR UPDATE
  USING (auth.uid() = logistics_id);

CREATE POLICY "Logistics can delete own routes"
  ON public.logistics_routes FOR DELETE
  USING (auth.uid() = logistics_id);

-- RLS Policies for farm_pickups
CREATE POLICY "Logistics can view own pickups"
  ON public.farm_pickups FOR SELECT
  USING (auth.uid() = logistics_id);

CREATE POLICY "Farmers can view their pickups"
  ON public.farm_pickups FOR SELECT
  USING (auth.uid() = farmer_id);

CREATE POLICY "Logistics can create pickups"
  ON public.farm_pickups FOR INSERT
  WITH CHECK (auth.uid() = logistics_id AND public.has_role(auth.uid(), 'logistics'));

CREATE POLICY "Logistics can update own pickups"
  ON public.farm_pickups FOR UPDATE
  USING (auth.uid() = logistics_id);

CREATE POLICY "Logistics can delete own pickups"
  ON public.farm_pickups FOR DELETE
  USING (auth.uid() = logistics_id);

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;