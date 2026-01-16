-- =====================================================
-- P0/P1/P2: Agent Assignments + Admin Scopes System
-- =====================================================

-- ======================
-- A1) agent_farmer_assignments - extend with missing columns
-- ======================
ALTER TABLE IF EXISTS public.agent_farmer_assignments 
ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS assigned_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add unique constraint on agent_id + farmer_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_farmer_assignments_unique'
  ) THEN
    ALTER TABLE public.agent_farmer_assignments 
    ADD CONSTRAINT agent_farmer_assignments_unique UNIQUE (agent_id, farmer_id);
  END IF;
END$$;

-- Create partial unique index for one active agent per farmer
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_farmer_one_active 
ON public.agent_farmer_assignments(farmer_id) WHERE active = true;

-- Create indexes for queries
CREATE INDEX IF NOT EXISTS idx_afa_agent_active ON public.agent_farmer_assignments(agent_id, active);
CREATE INDEX IF NOT EXISTS idx_afa_farmer_active ON public.agent_farmer_assignments(farmer_id, active);

-- ======================
-- A2) Update agent_tasks with extended columns
-- ======================
ALTER TABLE public.agent_tasks 
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS created_by_role text DEFAULT 'agent' CHECK (created_by_role IN ('farmer', 'agent', 'admin')),
ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Create indexes for agent_tasks
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_status ON public.agent_tasks(agent_id, task_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_farmer_status ON public.agent_tasks(farmer_id, task_status, created_at DESC);

-- ======================
-- A3) P1: Create agent_visits table
-- ======================
CREATE TABLE IF NOT EXISTS public.agent_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
  check_in_at timestamptz NOT NULL DEFAULT now(),
  check_out_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for agent_visits
CREATE INDEX IF NOT EXISTS idx_agent_visits_agent ON public.agent_visits(agent_id, check_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_visits_farmer ON public.agent_visits(farmer_id, check_in_at DESC);

-- ======================
-- A4) P2: Create admin_scopes table
-- ======================
CREATE TABLE IF NOT EXISTS public.admin_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope_level text NOT NULL CHECK (scope_level IN ('state', 'district', 'taluk', 'village')),
  scope_value text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create index for admin_scopes
CREATE INDEX IF NOT EXISTS idx_admin_scopes_user ON public.admin_scopes(admin_user_id, active);

-- Enable RLS on new tables
ALTER TABLE public.agent_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_scopes ENABLE ROW LEVEL SECURITY;

-- ======================
-- B) SECURITY DEFINER FUNCTIONS
-- ======================

-- B1) Check if agent is assigned to farmer
CREATE OR REPLACE FUNCTION public.is_agent_assigned_to_farmer(agent_uuid uuid, farmer_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agent_farmer_assignments
    WHERE agent_id = agent_uuid
      AND farmer_id = farmer_uuid
      AND active = true
  )
$$;

-- B2) Get admin scope match
CREATE OR REPLACE FUNCTION public.admin_scope_match(
  user_uuid uuid, 
  row_state text, 
  row_district text, 
  row_taluk text, 
  row_village text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  scope_rec RECORD;
BEGIN
  -- Super admins always have access
  IF public.has_role(user_uuid, 'admin') THEN
    -- Check if user has admin_scopes - if no scopes, treat as super admin
    IF NOT EXISTS (SELECT 1 FROM public.admin_scopes WHERE admin_user_id = user_uuid AND active = true) THEN
      RETURN true;
    END IF;
    
    -- Check each scope
    FOR scope_rec IN 
      SELECT scope_level, scope_value FROM public.admin_scopes 
      WHERE admin_user_id = user_uuid AND active = true
    LOOP
      CASE scope_rec.scope_level
        WHEN 'state' THEN
          IF lower(row_state) = lower(scope_rec.scope_value) THEN RETURN true; END IF;
        WHEN 'district' THEN
          IF lower(row_district) = lower(scope_rec.scope_value) THEN RETURN true; END IF;
        WHEN 'taluk' THEN
          IF lower(row_taluk) = lower(scope_rec.scope_value) THEN RETURN true; END IF;
        WHEN 'village' THEN
          IF lower(row_village) = lower(scope_rec.scope_value) THEN RETURN true; END IF;
      END CASE;
    END LOOP;
  END IF;
  
  RETURN false;
END;
$$;

-- ======================
-- C) RLS POLICIES for agent_farmer_assignments
-- ======================
DROP POLICY IF EXISTS "Agents can view their assignments" ON public.agent_farmer_assignments;
CREATE POLICY "Agents can view their assignments" 
ON public.agent_farmer_assignments FOR SELECT 
TO authenticated
USING (agent_id = auth.uid());

DROP POLICY IF EXISTS "Farmers can view their agent" ON public.agent_farmer_assignments;
CREATE POLICY "Farmers can view their agent" 
ON public.agent_farmer_assignments FOR SELECT 
TO authenticated
USING (farmer_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage assignments" ON public.agent_farmer_assignments;
CREATE POLICY "Admins can manage assignments" 
ON public.agent_farmer_assignments FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ======================
-- D) RLS POLICIES for agent_tasks - updated for farmer requests
-- ======================
DROP POLICY IF EXISTS "Agents can view their tasks" ON public.agent_tasks;
CREATE POLICY "Agents can view their tasks" 
ON public.agent_tasks FOR SELECT 
TO authenticated
USING (
  agent_id = auth.uid() 
  OR farmer_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Farmers can create help requests" ON public.agent_tasks;
CREATE POLICY "Farmers can create help requests" 
ON public.agent_tasks FOR INSERT 
TO authenticated
WITH CHECK (
  farmer_id = auth.uid() 
  AND created_by_role = 'farmer'
  AND EXISTS (
    SELECT 1 FROM public.agent_farmer_assignments 
    WHERE farmer_id = auth.uid() AND active = true AND agent_id = agent_tasks.agent_id
  )
);

DROP POLICY IF EXISTS "Agents can create tasks for assigned farmers" ON public.agent_tasks;
CREATE POLICY "Agents can create tasks for assigned farmers" 
ON public.agent_tasks FOR INSERT 
TO authenticated
WITH CHECK (
  (created_by_role = 'agent' AND agent_id = auth.uid() AND public.is_agent_assigned_to_farmer(auth.uid(), farmer_id))
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Agents can update their tasks" ON public.agent_tasks;
CREATE POLICY "Agents can update their tasks" 
ON public.agent_tasks FOR UPDATE 
TO authenticated
USING (
  agent_id = auth.uid() 
  OR (farmer_id = auth.uid() AND created_by_role = 'farmer' AND task_status = 'pending')
  OR public.has_role(auth.uid(), 'admin')
);

-- ======================
-- E) RLS POLICIES for agent_visits
-- ======================
DROP POLICY IF EXISTS "Agents can view and create visits" ON public.agent_visits;
CREATE POLICY "Agents can view and create visits" 
ON public.agent_visits FOR ALL 
TO authenticated
USING (
  agent_id = auth.uid() 
  OR farmer_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (agent_id = auth.uid() AND public.is_agent_assigned_to_farmer(auth.uid(), farmer_id))
  OR public.has_role(auth.uid(), 'admin')
);

-- ======================
-- F) RLS POLICIES for admin_scopes
-- ======================
DROP POLICY IF EXISTS "Admins can view their scopes" ON public.admin_scopes;
CREATE POLICY "Admins can view their scopes" 
ON public.admin_scopes FOR SELECT 
TO authenticated
USING (
  admin_user_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Super admins can manage scopes" ON public.admin_scopes;
CREATE POLICY "Super admins can manage scopes" 
ON public.admin_scopes FOR ALL 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') 
  AND NOT EXISTS (SELECT 1 FROM public.admin_scopes WHERE admin_user_id = auth.uid() AND active = true)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') 
  AND NOT EXISTS (SELECT 1 FROM public.admin_scopes WHERE admin_user_id = auth.uid() AND active = true)
);

-- ======================
-- G) Update profiles RLS to allow agent access for assigned farmers
-- ======================
DROP POLICY IF EXISTS "Agent can view assigned farmer profiles" ON public.profiles;
CREATE POLICY "Agent can view assigned farmer profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (
  id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'agent') AND public.is_agent_assigned_to_farmer(auth.uid(), id))
);

-- ======================
-- H) Update farmlands RLS to allow agent read access
-- ======================
DROP POLICY IF EXISTS "Agent can view assigned farmer farmlands" ON public.farmlands;
CREATE POLICY "Agent can view assigned farmer farmlands" 
ON public.farmlands FOR SELECT 
TO authenticated
USING (
  farmer_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'agent') AND public.is_agent_assigned_to_farmer(auth.uid(), farmer_id))
);

-- ======================
-- I) Update crops RLS to allow agent read access
-- ======================
DROP POLICY IF EXISTS "Agent can view assigned farmer crops" ON public.crops;
CREATE POLICY "Agent can view assigned farmer crops" 
ON public.crops FOR SELECT 
TO authenticated
USING (
  farmer_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'agent') AND public.is_agent_assigned_to_farmer(auth.uid(), farmer_id))
);

-- ======================
-- J) Update transport_requests RLS to allow agent read access
-- ======================
DROP POLICY IF EXISTS "Agent can view assigned farmer transport" ON public.transport_requests;
CREATE POLICY "Agent can view assigned farmer transport" 
ON public.transport_requests FOR SELECT 
TO authenticated
USING (
  farmer_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'logistics')
  OR (public.has_role(auth.uid(), 'agent') AND public.is_agent_assigned_to_farmer(auth.uid(), farmer_id))
);

-- ======================
-- K) Enable realtime for agent assignments
-- ======================
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_farmer_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_visits;