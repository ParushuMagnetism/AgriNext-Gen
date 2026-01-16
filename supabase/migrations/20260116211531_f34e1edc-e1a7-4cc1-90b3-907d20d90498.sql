-- ============= PHASE 0: DEMO TAGGING + NEW TABLES =============

-- Add demo_tag column to core tables for demo data tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.farmlands ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.crops ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.agent_farmer_assignments ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.agent_tasks ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.agent_visits ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.agent_data ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.transport_requests ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.transport_status_events ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.buyers ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.market_orders ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.market_prices ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.market_prices_agg ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.admin_scopes ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.price_forecasts ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.transporters ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS demo_tag text;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS demo_tag text;

-- Create indexes for demo_tag for faster deletion
CREATE INDEX IF NOT EXISTS idx_profiles_demo_tag ON public.profiles(demo_tag) WHERE demo_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crops_demo_tag ON public.crops(demo_tag) WHERE demo_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_farmlands_demo_tag ON public.farmlands(demo_tag) WHERE demo_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transport_requests_demo_tag ON public.transport_requests(demo_tag) WHERE demo_tag IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_market_orders_demo_tag ON public.market_orders(demo_tag) WHERE demo_tag IS NOT NULL;

-- ============= ESCALATIONS TABLE (Agent → Admin) =============
CREATE TABLE IF NOT EXISTS public.escalations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by_agent_id uuid NOT NULL,
  farmer_id uuid NOT NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category text NOT NULL CHECK (category IN ('crop_issue', 'pest_outbreak', 'weather_damage', 'transport_issue', 'payment_dispute', 'other')),
  title text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'closed')),
  assigned_admin_id uuid,
  resolution_notes text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  demo_tag text
);

-- Create indexes for escalations
CREATE INDEX IF NOT EXISTS idx_escalations_status ON public.escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalations_severity ON public.escalations(severity);
CREATE INDEX IF NOT EXISTS idx_escalations_agent ON public.escalations(created_by_agent_id);
CREATE INDEX IF NOT EXISTS idx_escalations_demo_tag ON public.escalations(demo_tag) WHERE demo_tag IS NOT NULL;

-- Enable RLS on escalations
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;

-- RLS policies for escalations
CREATE POLICY "Agents can create escalations" ON public.escalations
  FOR INSERT WITH CHECK (auth.uid() = created_by_agent_id AND has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can view own escalations" ON public.escalations
  FOR SELECT USING (auth.uid() = created_by_agent_id);

CREATE POLICY "Admins can view all escalations" ON public.escalations
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update escalations" ON public.escalations
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============= TRANSPORT ISSUES TABLE =============
CREATE TABLE IF NOT EXISTS public.transport_issues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid REFERENCES public.trips(id),
  transport_request_id uuid REFERENCES public.transport_requests(id),
  transporter_id uuid NOT NULL,
  farmer_id uuid NOT NULL,
  issue_code text NOT NULL CHECK (issue_code IN ('weight_mismatch', 'delay', 'route_issue', 'damaged_goods', 'payment_dispute', 'no_show', 'other')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  reported_by_role text NOT NULL CHECK (reported_by_role IN ('farmer', 'transporter', 'agent', 'admin')),
  reported_by_id uuid NOT NULL,
  description text NOT NULL,
  evidence_notes text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'escalated', 'closed')),
  resolution_notes text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  demo_tag text
);

-- Create indexes for transport_issues
CREATE INDEX IF NOT EXISTS idx_transport_issues_status ON public.transport_issues(status);
CREATE INDEX IF NOT EXISTS idx_transport_issues_code ON public.transport_issues(issue_code);
CREATE INDEX IF NOT EXISTS idx_transport_issues_trip ON public.transport_issues(trip_id);
CREATE INDEX IF NOT EXISTS idx_transport_issues_demo_tag ON public.transport_issues(demo_tag) WHERE demo_tag IS NOT NULL;

-- Enable RLS on transport_issues
ALTER TABLE public.transport_issues ENABLE ROW LEVEL SECURITY;

-- RLS policies for transport_issues
CREATE POLICY "Users can create issues they report" ON public.transport_issues
  FOR INSERT WITH CHECK (auth.uid() = reported_by_id);

CREATE POLICY "Transporters can view issues on their trips" ON public.transport_issues
  FOR SELECT USING (transporter_id = auth.uid() OR farmer_id = auth.uid());

CREATE POLICY "Admins can view all transport issues" ON public.transport_issues
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update transport issues" ON public.transport_issues
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============= UPDATE ADMIN_SCOPES WITH SCOPE LEVELS =============
-- Update scope_level check constraint if needed
ALTER TABLE public.admin_scopes DROP CONSTRAINT IF EXISTS admin_scopes_scope_level_check;
ALTER TABLE public.admin_scopes ADD CONSTRAINT admin_scopes_scope_level_check 
  CHECK (scope_level IN ('state', 'district', 'taluk', 'village', 'all'));