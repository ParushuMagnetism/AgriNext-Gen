import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Types
export interface AgentTask {
  id: string;
  agent_id: string;
  farmer_id: string;
  crop_id: string | null;
  task_type: 'visit' | 'verify_crop' | 'harvest_check' | 'transport_assist';
  task_status: 'pending' | 'in_progress' | 'completed';
  due_date: string;
  notes: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
  farmer?: {
    full_name: string | null;
    village: string | null;
    district: string | null;
    phone: string | null;
  };
  crop?: {
    crop_name: string;
    status: string;
    harvest_estimate: string | null;
    estimated_quantity: number | null;
  };
}

export interface AIAgentLog {
  id: string;
  agent_id: string;
  log_type: string;
  input_context: any;
  output_text: string | null;
  created_at: string;
}

// Fetch agent tasks
export const useAgentTasks = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['agent-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('agent_tasks')
        .select(`
          *,
          farmer:profiles!agent_tasks_farmer_id_fkey(full_name, village, district, phone),
          crop:crops(crop_name, status, harvest_estimate, estimated_quantity)
        `)
        .eq('agent_id', user.id)
        .order('due_date', { ascending: true })
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return data as unknown as AgentTask[];
    },
    enabled: !!user?.id,
  });
};

// Fetch today's tasks
export const useTodaysTasks = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['today-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('agent_tasks')
        .select(`
          *,
          farmer:profiles!agent_tasks_farmer_id_fkey(full_name, village, district, phone),
          crop:crops(crop_name, status, harvest_estimate, estimated_quantity)
        `)
        .eq('agent_id', user.id)
        .eq('due_date', today)
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return data as unknown as AgentTask[];
    },
    enabled: !!user?.id,
  });
};

// Fetch all farmers (for agent to see)
export const useAllFarmers = () => {
  return useQuery({
    queryKey: ['all-farmers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_roles!inner(role)')
        .eq('user_roles.role', 'farmer');
      
      if (error) throw error;
      return data;
    },
  });
};

// Fetch all crops (with farmer info)
export const useAllCrops = () => {
  return useQuery({
    queryKey: ['all-crops-agent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crops')
        .select(`
          *,
          farmer:profiles!crops_farmer_id_fkey(full_name, village, district),
          farmland:farmlands(name, village)
        `)
        .order('harvest_estimate', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
};

// Fetch all transport requests
export const useAllTransportRequests = () => {
  return useQuery({
    queryKey: ['all-transport-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transport_requests')
        .select(`
          *,
          crop:crops(crop_name, farmer_id),
          farmer:profiles!transport_requests_farmer_id_fkey(full_name, village)
        `)
        .order('preferred_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
};

// Update task status
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, status, notes }: { taskId: string; status: 'pending' | 'in_progress' | 'completed'; notes?: string }) => {
      const { error } = await supabase
        .from('agent_tasks')
        .update({ 
          task_status: status,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['today-tasks'] });
      toast.success('Task updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update task');
      console.error(error);
    },
  });
};

// Create new task
export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (task: { 
      farmer_id: string; 
      crop_id?: string | null; 
      task_type: 'visit' | 'verify_crop' | 'harvest_check' | 'transport_assist';
      due_date: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('agent_tasks')
        .insert({
          farmer_id: task.farmer_id,
          crop_id: task.crop_id || null,
          task_type: task.task_type,
          due_date: task.due_date,
          notes: task.notes || null,
          agent_id: user?.id!,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['today-tasks'] });
      toast.success('Task created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create task');
      console.error(error);
    },
  });
};

// Update crop status (agent can update any crop)
export const useUpdateCropStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ cropId, status, quantity, notes }: { 
      cropId: string; 
      status: string; 
      quantity?: number;
      notes?: string;
    }) => {
      const updateData: any = { status };
      if (quantity !== undefined) updateData.estimated_quantity = quantity;
      
      const { error } = await supabase
        .from('crops')
        .update(updateData)
        .eq('id', cropId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-crops-agent'] });
      toast.success('Crop status updated');
    },
    onError: (error) => {
      toast.error('Failed to update crop');
      console.error(error);
    },
  });
};

// AI Visit Prioritization
export const useAIVisitPrioritization = () => {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (tasks: AgentTask[]) => {
      const { data, error } = await supabase.functions.invoke('agent-ai', {
        body: {
          type: 'visit_prioritization',
          context: {
            tasks: tasks.map(t => ({
              id: t.id,
              farmer: t.farmer?.full_name || 'Unknown',
              village: t.farmer?.village || 'Unknown',
              taskType: t.task_type,
              cropName: t.crop?.crop_name || 'N/A',
              cropStatus: t.crop?.status || 'N/A',
              harvestEstimate: t.crop?.harvest_estimate || 'N/A',
              estimatedQuantity: t.crop?.estimated_quantity || 0,
            })),
          },
        },
      });
      
      if (error) throw error;
      
      // Log the AI usage
      await supabase.from('ai_agent_logs').insert({
        agent_id: user?.id,
        log_type: 'visit_prioritization',
        input_context: { taskCount: tasks.length },
        output_text: data.result,
      });
      
      return data.result;
    },
  });
};

// AI Cluster Summary
export const useAIClusterSummary = () => {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (clusterData: any) => {
      const { data, error } = await supabase.functions.invoke('agent-ai', {
        body: {
          type: 'cluster_summary',
          context: { clusterData },
        },
      });
      
      if (error) throw error;
      
      // Log the AI usage
      await supabase.from('ai_agent_logs').insert({
        agent_id: user?.id,
        log_type: 'cluster_summary',
        input_context: clusterData,
        output_text: data.result,
      });
      
      return data.result;
    },
  });
};

// Fetch AI logs
export const useAILogs = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['ai-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('ai_agent_logs')
        .select('*')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as AIAgentLog[];
    },
    enabled: !!user?.id,
  });
};

// Dashboard stats
export const useAgentDashboardStats = () => {
  const { data: tasks } = useAgentTasks();
  const { data: todayTasks } = useTodaysTasks();
  const { data: allCrops } = useAllCrops();
  const { data: transportRequests } = useAllTransportRequests();
  
  const farmers = new Set(tasks?.map(t => t.farmer_id) || []);
  const readyCrops = allCrops?.filter(c => c.status === 'ready' || c.status === 'one_week') || [];
  const pendingTransport = transportRequests?.filter(t => t.status === 'requested') || [];
  const completedToday = todayTasks?.filter(t => t.task_status === 'completed').length || 0;
  
  return {
    farmersAssigned: farmers.size,
    activeCrops: allCrops?.filter(c => c.status !== 'harvested').length || 0,
    tasksToday: todayTasks?.length || 0,
    tasksCompleted: completedToday,
    cropsReadyToHarvest: readyCrops.length,
    pendingTransportRequests: pendingTransport.length,
  };
};
