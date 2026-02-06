
-- P0+ Migration: Extend agent_tasks, add audit logging, add admin approval support

-- 1. Add payload JSONB column to agent_tasks for proposed changes
ALTER TABLE public.agent_tasks ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT NULL;

-- 2. Extend agent_task_type enum with new values
ALTER TYPE public.agent_task_type ADD VALUE IF NOT EXISTS 'onboard_farmer';
ALTER TYPE public.agent_task_type ADD VALUE IF NOT EXISTS 'update_profile';
ALTER TYPE public.agent_task_type ADD VALUE IF NOT EXISTS 'soil_report_upload';
ALTER TYPE public.agent_task_type ADD VALUE IF NOT EXISTS 'field_visit';
ALTER TYPE public.agent_task_type ADD VALUE IF NOT EXISTS 'farmer_request';

-- 3. Extend agent_task_status enum with approval states
ALTER TYPE public.agent_task_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.agent_task_status ADD VALUE IF NOT EXISTS 'rejected';

-- 4. Create agent_activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.agent_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID NOT NULL,
  actor_role TEXT NOT NULL DEFAULT 'agent',
  farmer_id UUID,
  action_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_activity_logs
CREATE POLICY "Agents can view own activity logs"
  ON public.agent_activity_logs
  FOR SELECT
  TO authenticated
  USING (actor_id = auth.uid());

CREATE POLICY "Agents can create activity logs"
  ON public.agent_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

CREATE POLICY "Admins can view all activity logs"
  ON public.agent_activity_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_agent_activity_logs_actor ON public.agent_activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_agent_activity_logs_farmer ON public.agent_activity_logs(farmer_id);
CREATE INDEX IF NOT EXISTS idx_agent_activity_logs_action ON public.agent_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_payload ON public.agent_tasks(task_status) WHERE payload IS NOT NULL;
