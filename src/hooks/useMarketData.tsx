import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PriceForecast {
  id: string;
  crop_name: string;
  district: string;
  state: string;
  direction: 'up' | 'down' | 'stable';
  confidence: 'low' | 'medium' | 'high';
  reason: string;
  generated_at: string;
}

export const usePriceForecasts = (cropNames?: string[]) => {
  return useQuery({
    queryKey: ['price-forecasts', cropNames],
    queryFn: async () => {
      let query = supabase
        .from('price_forecasts')
        .select('*')
        .eq('state', 'Karnataka')
        .order('generated_at', { ascending: false })
        .limit(20);

      if (cropNames && cropNames.length > 0) {
        query = query.in('crop_name', cropNames);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Get latest forecast per crop
      const latestByC: Record<string, PriceForecast> = {};
      for (const f of (data || []) as PriceForecast[]) {
        if (!latestByC[f.crop_name] || new Date(f.generated_at) > new Date(latestByC[f.crop_name].generated_at)) {
          latestByC[f.crop_name] = f;
        }
      }
      
      return Object.values(latestByC);
    },
  });
};
