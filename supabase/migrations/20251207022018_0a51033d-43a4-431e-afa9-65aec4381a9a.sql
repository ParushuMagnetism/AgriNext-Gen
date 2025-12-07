-- Create task type enum
CREATE TYPE public.agent_task_type AS ENUM ('visit', 'verify_crop', 'harvest_check', 'transport_assist');

-- Create task status enum
CREATE TYPE public.agent_task_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create agent tasks table
CREATE TABLE public.agent_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  farmer_id UUID NOT NULL,
  crop_id UUID REFERENCES public.crops(id) ON DELETE SET NULL,
  task_type agent_task_type NOT NULL DEFAULT 'visit',
  task_status agent_task_status NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI agent logs table
CREATE TABLE public.ai_agent_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  log_type TEXT NOT NULL,
  input_context JSONB,
  output_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_tasks
CREATE POLICY "Agents can view own tasks"
  ON public.agent_tasks FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Agents can create tasks"
  ON public.agent_tasks FOR INSERT
  WITH CHECK (auth.uid() = agent_id AND has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can update own tasks"
  ON public.agent_tasks FOR UPDATE
  USING (auth.uid() = agent_id);

CREATE POLICY "Agents can delete own tasks"
  ON public.agent_tasks FOR DELETE
  USING (auth.uid() = agent_id);

CREATE POLICY "Admins can view all tasks"
  ON public.agent_tasks FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for ai_agent_logs
CREATE POLICY "Agents can view own logs"
  ON public.ai_agent_logs FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Agents can create logs"
  ON public.ai_agent_logs FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Admins can view all logs"
  ON public.ai_agent_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_agent_tasks_updated_at
  BEFORE UPDATE ON public.agent_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for agent_tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_tasks;