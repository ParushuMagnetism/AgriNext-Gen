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

export interface MarketPriceAgg {
  id: string;
  crop_name: string;
  district: string;
  state: string | null;
  modal_price: number | null;
  unit: string | null;
  confidence: string | null;
  sources_count: number | null;
  fetched_at: string | null;
}

/**
 * 3-tier market prices fallback:
 * Tier A: Personalized (farmer district + crops)
 * Tier B: District default (farmer district, any crops)
 * Tier C: State default (Karnataka, any crops)
 */
export const useMarketPricesTiered = (
  district: string | null | undefined,
  cropNames: string[] = []
) => {
  return useQuery({
    queryKey: ['market-prices-tiered', district, cropNames],
    queryFn: async () => {
      // Tier A: Try personalized (district + crops)
      if (district && cropNames.length > 0) {
        const { data: tierA, error: errorA } = await supabase
          .from('market_prices_agg')
          .select('*')
          .eq('district', district)
          .in('crop_name', cropNames)
          .order('fetched_at', { ascending: false })
          .limit(8);

        if (!errorA && tierA && tierA.length > 0) {
          return { tier: 'A' as const, data: tierA as MarketPriceAgg[], label: `Prices for your crops in ${district}` };
        }
      }

      // Tier B: District default (district, any crops)
      if (district) {
        const { data: tierB, error: errorB } = await supabase
          .from('market_prices_agg')
          .select('*')
          .eq('district', district)
          .order('fetched_at', { ascending: false })
          .limit(6);

        if (!errorB && tierB && tierB.length > 0) {
          return { tier: 'B' as const, data: tierB as MarketPriceAgg[], label: `Top prices in ${district}` };
        }
      }

      // Tier C: State default (Karnataka, any crops)
      const { data: tierC, error: errorC } = await supabase
        .from('market_prices_agg')
        .select('*')
        .eq('state', 'Karnataka')
        .order('fetched_at', { ascending: false })
        .limit(6);

      if (!errorC && tierC && tierC.length > 0) {
        return { tier: 'C' as const, data: tierC as MarketPriceAgg[], label: 'Karnataka mandi prices' };
      }

      // Fallback: Try raw market_prices table
      const { data: fallback, error: fallbackError } = await supabase
        .from('market_prices')
        .select('*')
        .eq('state', 'Karnataka')
        .order('date', { ascending: false })
        .limit(6);

      if (!fallbackError && fallback && fallback.length > 0) {
        // Transform to MarketPriceAgg format
        const transformed: MarketPriceAgg[] = fallback.map(p => ({
          id: p.id,
          crop_name: p.crop_name,
          district: p.district || 'Karnataka',
          state: p.state,
          modal_price: p.modal_price,
          unit: p.unit,
          confidence: null,
          sources_count: null,
          fetched_at: p.fetched_at || p.date,
        }));
        return { tier: 'C' as const, data: transformed, label: 'Karnataka mandi prices' };
      }

      return { tier: 'C' as const, data: [] as MarketPriceAgg[], label: 'No price data available' };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

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
