import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ForecastResult {
  crop_name: string;
  district: string;
  direction: 'up' | 'down' | 'stable';
  confidence: 'low' | 'medium' | 'high';
  reason: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get unique crop+district combinations from recent prices
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const { data: priceData, error: priceError } = await supabase
      .from('market_prices')
      .select('crop_name, district, modal_price, date')
      .eq('state', 'Karnataka')
      .gte('date', twoWeeksAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (priceError) {
      throw new Error('Failed to fetch price data');
    }

    // Group by crop+district
    const groupedPrices: Record<string, { prices: number[]; dates: string[] }> = {};
    
    for (const row of priceData || []) {
      if (!row.district) continue;
      const key = `${row.crop_name}:${row.district}`;
      if (!groupedPrices[key]) {
        groupedPrices[key] = { prices: [], dates: [] };
      }
      groupedPrices[key].prices.push(row.modal_price);
      groupedPrices[key].dates.push(row.date);
    }

    console.log(`Processing ${Object.keys(groupedPrices).length} crop+district combinations`);

    const forecasts: ForecastResult[] = [];
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');

    for (const [key, data] of Object.entries(groupedPrices)) {
      const [cropName, district] = key.split(':');
      
      if (data.prices.length < 2) {
        continue; // Not enough data for trend
      }

      // Calculate simple linear trend
      const n = data.prices.length;
      const avgPrice = data.prices.reduce((a, b) => a + b, 0) / n;
      
      // Calculate slope
      let sumXY = 0;
      let sumX2 = 0;
      const avgX = (n - 1) / 2;
      
      for (let i = 0; i < n; i++) {
        sumXY += (i - avgX) * (data.prices[i] - avgPrice);
        sumX2 += (i - avgX) ** 2;
      }
      
      const slope = sumX2 !== 0 ? sumXY / sumX2 : 0;
      const percentChange = (slope / avgPrice) * 100;

      // Determine direction
      let direction: 'up' | 'down' | 'stable';
      if (percentChange > 2) direction = 'up';
      else if (percentChange < -2) direction = 'down';
      else direction = 'stable';

      // Confidence based on data consistency
      let confidence: 'low' | 'medium' | 'high' = 'low';
      if (n >= 5) confidence = 'medium';
      if (n >= 10) confidence = 'high';

      // Generate reason
      let reason = '';
      if (direction === 'up') {
        reason = `Price trend showing ${Math.abs(percentChange).toFixed(1)}% increase over the past ${n} days`;
      } else if (direction === 'down') {
        reason = `Price trend showing ${Math.abs(percentChange).toFixed(1)}% decrease over the past ${n} days`;
      } else {
        reason = `Prices stable with minimal variation over the past ${n} days`;
      }

      // Optionally enhance with Perplexity for market news
      if (perplexityKey && n >= 3) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const query = `Brief ${cropName} price trend news for Karnataka India markets. Is price expected to go up or down? One sentence only.`;

          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${perplexityKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'sonar',
              messages: [
                {
                  role: 'system',
                  content: 'You are an agricultural market analyst. Provide a very brief (one sentence) market insight. Focus on demand, supply, or seasonal factors.',
                },
                { role: 'user', content: query },
              ],
              max_tokens: 80,
              temperature: 0.2,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const result = await response.json();
            const insight = result.choices?.[0]?.message?.content?.trim();
            if (insight && insight.length > 10 && insight.length < 200) {
              reason = insight;
              
              // Adjust confidence if Perplexity confirms our direction
              if (
                (direction === 'up' && insight.toLowerCase().includes('increas')) ||
                (direction === 'down' && insight.toLowerCase().includes('decreas'))
              ) {
                if (confidence === 'low') confidence = 'medium';
                else if (confidence === 'medium') confidence = 'high';
              }
            }
          }
        } catch (e) {
          console.log('Perplexity enhancement skipped:', e);
        }
      }

      forecasts.push({
        crop_name: cropName,
        district,
        direction,
        confidence,
        reason,
      });
    }

    // Store forecasts
    const now = new Date();
    let insertedCount = 0;

    for (const forecast of forecasts) {
      const { error } = await supabase.from('price_forecasts').insert({
        crop_name: forecast.crop_name,
        district: forecast.district,
        state: 'Karnataka',
        direction: forecast.direction,
        confidence: forecast.confidence,
        reason: forecast.reason,
        generated_at: now.toISOString(),
      });

      if (!error) insertedCount++;
    }

    // Log the operation
    await supabase.from('web_fetch_logs').insert({
      endpoint: 'generate-price-forecast',
      query: `generated ${forecasts.length} forecasts`,
      success: true,
      latency_ms: Date.now() - startTime,
    });

    return new Response(JSON.stringify({
      message: 'Price forecasts generated',
      total: forecasts.length,
      inserted: insertedCount,
      duration_ms: Date.now() - startTime,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-price-forecast:', error);
    
    return new Response(JSON.stringify({
      error: 'Forecast generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
