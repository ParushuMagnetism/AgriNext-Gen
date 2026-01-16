-- PHASE 0: Create trip-proofs storage bucket (PRIVATE)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('trip-proofs', 'trip-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for trip-proofs
CREATE POLICY "Transporters can upload proofs to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trip-proofs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Transporters can read their own proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'trip-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can read all trip proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'trip-proofs'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- PHASE 1A: Create trips table as first-class entity
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transport_request_id uuid UNIQUE NOT NULL REFERENCES public.transport_requests(id) ON DELETE CASCADE,
  transporter_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'en_route', 'arrived', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'issue')),
  assigned_at timestamptz DEFAULT now(),
  en_route_at timestamptz NULL,
  arrived_at timestamptz NULL,
  picked_up_at timestamptz NULL,
  in_transit_at timestamptz NULL,
  delivered_at timestamptz NULL,
  cancelled_at timestamptz NULL,
  issue_code text NULL,
  issue_notes text NULL,
  pickup_proofs jsonb NULL,
  delivery_proofs jsonb NULL,
  pickup_otp_required boolean DEFAULT false,
  pickup_otp_verified boolean DEFAULT false,
  delivery_otp_required boolean DEFAULT false,
  delivery_otp_verified boolean DEFAULT false,
  actual_weight_kg numeric NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for trips
CREATE INDEX idx_trips_transporter_status ON public.trips (transporter_id, status);
CREATE INDEX idx_trips_transport_request ON public.trips (transport_request_id);
CREATE INDEX idx_trips_assigned_at ON public.trips (assigned_at DESC);

-- RLS for trips
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transporters can view their own trips"
ON public.trips FOR SELECT
TO authenticated
USING (transporter_id = auth.uid());

CREATE POLICY "Transporters can update their own trips"
ON public.trips FOR UPDATE
TO authenticated
USING (transporter_id = auth.uid())
WITH CHECK (transporter_id = auth.uid());

CREATE POLICY "System can insert trips"
ON public.trips FOR INSERT
TO authenticated
WITH CHECK (transporter_id = auth.uid());

CREATE POLICY "Admins have full access to trips"
ON public.trips FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- PHASE 1B: Add missing columns to transport_requests
ALTER TABLE public.transport_requests 
ADD COLUMN IF NOT EXISTS assigned_trip_id uuid NULL REFERENCES public.trips(id),
ADD COLUMN IF NOT EXISTS assigned_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS status_updated_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS pickup_window_start timestamptz NULL,
ADD COLUMN IF NOT EXISTS pickup_window_end timestamptz NULL,
ADD COLUMN IF NOT EXISTS drop_location text NULL,
ADD COLUMN IF NOT EXISTS fare_estimate numeric NULL,
ADD COLUMN IF NOT EXISTS cancellation_reason text NULL;

-- PHASE 1C: Create transport_status_events for audit trail
CREATE TABLE public.transport_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transport_request_id uuid NOT NULL REFERENCES public.transport_requests(id) ON DELETE CASCADE,
  trip_id uuid NULL REFERENCES public.trips(id) ON DELETE SET NULL,
  actor_id uuid NOT NULL,
  actor_role text NOT NULL CHECK (actor_role IN ('farmer', 'agent', 'transporter', 'admin', 'system')),
  old_status text NULL,
  new_status text NOT NULL,
  note text NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for status events
CREATE INDEX idx_transport_status_events_request ON public.transport_status_events (transport_request_id, created_at DESC);
CREATE INDEX idx_transport_status_events_trip ON public.transport_status_events (trip_id, created_at DESC);

-- RLS for transport_status_events
ALTER TABLE public.transport_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view events for their requests"
ON public.transport_status_events FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.transport_requests tr
    WHERE tr.id = transport_request_id AND tr.farmer_id = auth.uid()
  )
);

CREATE POLICY "Transporters can view events for their trips"
ON public.transport_status_events FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = trip_id AND t.transporter_id = auth.uid()
  )
);

CREATE POLICY "System can insert status events"
ON public.transport_status_events FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins have full access to status events"
ON public.transport_status_events FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Trigger to update trips.updated_at
CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update transport_requests.status_updated_at
CREATE OR REPLACE FUNCTION public.update_transport_request_status_time()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_transport_request_status_time_trigger
BEFORE UPDATE ON public.transport_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_transport_request_status_time();