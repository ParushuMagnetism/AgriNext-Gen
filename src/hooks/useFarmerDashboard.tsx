import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FarmerProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  village: string | null;
  district: string | null;
  total_land_area: number | null;
}

export interface Farmland {
  id: string;
  name: string;
  area: number;
  area_unit: string;
  soil_type: string | null;
  village: string | null;
  district: string | null;
}

export interface Crop {
  id: string;
  crop_name: string;
  variety: string | null;
  sowing_date: string | null;
  harvest_estimate: string | null;
  status: 'growing' | 'one_week' | 'ready' | 'harvested';
  estimated_quantity: number | null;
  quantity_unit: string | null;
  land_id: string | null;
  farmland?: Farmland;
}

export interface TransportRequest {
  id: string;
  quantity: number;
  quantity_unit: string | null;
  pickup_location: string;
  pickup_village: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  status: 'requested' | 'assigned' | 'en_route' | 'picked_up' | 'delivered' | 'cancelled';
  crop_id: string | null;
  crop?: Crop;
}

export interface MarketPrice {
  id: string;
  crop_name: string;
  market_name: string;
  date: string;
  modal_price: number;
  min_price: number | null;
  max_price: number | null;
  trend_direction: 'up' | 'down' | 'flat' | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export const useFarmerProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['farmer-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as FarmerProfile | null;
    },
    enabled: !!user?.id,
  });
};

export const useFarmlands = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['farmlands', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('farmlands')
        .select('*')
        .eq('farmer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Farmland[];
    },
    enabled: !!user?.id,
  });
};

export const useCrops = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['crops', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('crops')
        .select(`
          *,
          farmland:farmlands(*)
        `)
        .eq('farmer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (Crop & { farmland: Farmland | null })[];
    },
    enabled: !!user?.id,
  });
};

export const useTransportRequests = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transport-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('transport_requests')
        .select(`
          *,
          crop:crops(*)
        `)
        .eq('farmer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (TransportRequest & { crop: Crop | null })[];
    },
    enabled: !!user?.id,
  });
};

export const useMarketPrices = (cropNames?: string[]) => {
  return useQuery({
    queryKey: ['market-prices', cropNames],
    queryFn: async () => {
      let query = supabase
        .from('market_prices')
        .select('*')
        .order('date', { ascending: false })
        .limit(20);

      if (cropNames && cropNames.length > 0) {
        query = query.in('crop_name', cropNames);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MarketPrice[];
    },
  });
};

export const useAllMarketPrices = () => {
  return useQuery({
    queryKey: ['all-market-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .order('date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as MarketPrice[];
    },
  });
};

export const useFarmerNotifications = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['farmer-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useDashboardStats = () => {
  const { data: crops, isLoading: cropsLoading } = useCrops();
  const { data: transportRequests, isLoading: transportLoading } = useTransportRequests();
  const { data: farmlands, isLoading: farmlandsLoading } = useFarmlands();

  const activeCrops = crops?.filter(c => c.status !== 'harvested').length || 0;
  const readyToHarvest = crops?.filter(c => c.status === 'ready').length || 0;
  const oneWeekToHarvest = crops?.filter(c => c.status === 'one_week').length || 0;
  const pendingTransport = transportRequests?.filter(t => 
    ['requested', 'assigned'].includes(t.status)
  ).length || 0;
  const totalLandArea = farmlands?.reduce((sum, f) => sum + f.area, 0) || 0;

  return {
    activeCrops,
    readyToHarvest,
    oneWeekToHarvest,
    pendingTransport,
    totalLandArea,
    isLoading: cropsLoading || transportLoading || farmlandsLoading,
  };
};