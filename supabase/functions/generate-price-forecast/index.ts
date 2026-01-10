import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// STRICT SCHEMA: Normalized Forecast
// ============================================
interface NormalizedForecast {
  crop_name: string;
  district: string;
  state: 'Karnataka';
  direction: 'up' | 'down' | 'stable';
  confidence: 'low' | 'medium' | 'high';
  reason: string;
  generated_at: string;
  based_on_points: number;
  data_freshness_hours: number;
}

const PERPLEXITY_TIMEOUT_MS = 6000;
const MIN_DATA_POINTS = 5;
const MAX_DATA_FRESHNESS_HOURS = 48;

// ============================================
// ADMIN CHECK FUNCTION
// ============================================
async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  
  return !error && data !== null;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================
function validateDirection(val: unknown): 'up' | 'down' | 'stable' {
  if (typeof val !== 'string') return 'stable';
  const lower = val.toLowerCase().trim();
  if (lower === 'up' || lower.includes('increas') || lower.includes('ris')) return 'up';
  if (lower === 'down' || lower.includes('decreas') || lower.includes('fall')) return 'down';
  return 'stable';
}

function validateConfidence(val: unknown): 'low' | 'medium' | 'high' {
  if (typeof val !== 'string') return 'low';
  const lower = val.toLowerCase().trim();
  if (lower === 'high') return 'high';
  if (lower === 'medium') return 'medium';
  return 'low';
}

function sanitizeReason(val: unknown): string {
  if (typeof val !== 'string') return 'Forecast based on recent price trends';
  return val.trim().slice(0, 300) || 'Forecast based on recent price trends';
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

    // ============================================
    // AUTH: ADMIN-ONLY ACCESS
    // ============================================
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      
      const { data: { user } } = await userClient.auth.getUser();
      
      if (user) {
        const adminCheck = await isAdmin(supabase, user.id);
        if (!adminCheck) {
          console.error('Non-admin user attempted to generate forecast:', user.id);
          return new Response(JSON.stringify({ error: 'Forbidden - Admin only' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.log('Admin user verified:', user.id);
      }
    }
    // If no auth header, allow (for scheduled/cron jobs via service role)

    // Get unique crop+district combinations from recent prices (last 14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const { data: priceData, error: priceError } = await supabase
      .from('market_prices')
      .select('crop_name, district, modal_price, date, fetched_at')
      .eq('state', 'Karnataka')
      .gte('date', twoWeeksAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (priceError) {
      throw new Error('Failed to fetch price data');
    }

    // Group by crop+district
    const groupedPrices: Record<string, { 
      prices: number[]; 
      dates: string[];
      lastFetchedAt: string;
    }> = {};
    
    for (const row of priceData || []) {
      if (!row.district) continue;
      const key = `${row.crop_name}:${row.district}`;
      if (!groupedPrices[key]) {
        groupedPrices[key] = { prices: [], dates: [], lastFetchedAt: '' };
      }
      groupedPrices[key].prices.push(row.modal_price);
      groupedPrices[key].dates.push(row.date);
      
      // Track most recent fetch
      if (!groupedPrices[key].lastFetchedAt || 
          (row.fetched_at && row.fetched_at > groupedPrices[key].lastFetchedAt)) {
        groupedPrices[key].lastFetchedAt = row.fetched_at || row.date;
      }
    }

    console.log(`Processing ${Object.keys(groupedPrices).length} crop+district combinations`);

    const forecasts: NormalizedForecast[] = [];
    const skipped: { key: string; reason: string }[] = [];
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    const now = new Date();

    for (const [key, data] of Object.entries(groupedPrices)) {
      const [cropName, district] = key.split(':');
      
      // ============================================
      // VALIDATION: Check data sufficiency
      // ============================================
      const dataPoints = data.prices.length;
      
      // Calculate data freshness
      const lastFetchTime = new Date(data.lastFetchedAt || data.dates[data.dates.length - 1]);
      const dataFreshnessHours = (now.getTime() - lastFetchTime.getTime()) / (1000 * 60 * 60);
      
      // STRICT CHECK: Insufficient data
      if (dataPoints < MIN_DATA_POINTS) {
        console.log(`Skipping ${key}: insufficient data points (${dataPoints} < ${MIN_DATA_POINTS})`);
        skipped.push({ key, reason: `Only ${dataPoints} data points` });
        
        // Insert placeholder with low confidence
        forecasts.push({
          crop_name: cropName,
          district,
          state: 'Karnataka',
          direction: 'stable',
          confidence: 'low',
          reason: `Insufficient recent data (${dataPoints} points). More price updates needed for accurate forecast.`,
          generated_at: now.toISOString(),
          based_on_points: dataPoints,
          data_freshness_hours: Math.round(dataFreshnessHours),
        });
        continue;
      }
      
      // STRICT CHECK: Stale data
      if (dataFreshnessHours > MAX_DATA_FRESHNESS_HOURS) {
        console.log(`Skipping ${key}: data too stale (${Math.round(dataFreshnessHours)}h > ${MAX_DATA_FRESHNESS_HOURS}h)`);
        skipped.push({ key, reason: `Data ${Math.round(dataFreshnessHours)}h old` });
        
        forecasts.push({
          crop_name: cropName,
          district,
          state: 'Karnataka',
          direction: 'stable',
          confidence: 'low',
          reason: `Price data is ${Math.round(dataFreshnessHours)} hours old. Unable to generate reliable forecast.`,
          generated_at: now.toISOString(),
          based_on_points: dataPoints,
          data_freshness_hours: Math.round(dataFreshnessHours),
        });
        continue;
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

      // Confidence based on data consistency and freshness
      let confidence: 'low' | 'medium' | 'high' = 'low';
      if (n >= 5 && dataFreshnessHours < 24) confidence = 'medium';
      if (n >= 10 && dataFreshnessHours < 12) confidence = 'high';

      // Generate reason
      let reason = '';
      if (direction === 'up') {
        reason = `Price trend showing ${Math.abs(percentChange).toFixed(1)}% increase over ${n} data points`;
      } else if (direction === 'down') {
        reason = `Price trend showing ${Math.abs(percentChange).toFixed(1)}% decrease over ${n} data points`;
      } else {
        reason = `Prices stable with minimal variation over ${n} data points`;
      }

      // Optionally enhance with Perplexity for market news (only for medium+ confidence)
      if (perplexityKey && confidence !== 'low' && n >= 5) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), PERPLEXITY_TIMEOUT_MS);

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
                  content: 'You are an agricultural market analyst. Provide a very brief (one sentence) market insight. Focus on demand, supply, or seasonal factors. Never predict exact prices.',
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
              reason = sanitizeReason(insight);
              
              // Adjust confidence if Perplexity confirms our direction
              const confirmsDirection = 
                (direction === 'up' && insight.toLowerCase().includes('increas')) ||
                (direction === 'down' && insight.toLowerCase().includes('decreas'));
              if (confirmsDirection && confidence !== 'high') {
                confidence = 'high';
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
        state: 'Karnataka',
        direction,
        confidence,
        reason,
        generated_at: now.toISOString(),
        based_on_points: n,
        data_freshness_hours: Math.round(dataFreshnessHours),
      });
    }

    // Store forecasts (only valid ones with reasonable confidence)
    let insertedCount = 0;
    let failedCount = 0;

    for (const forecast of forecasts) {
      const { error } = await supabase.from('price_forecasts').insert({
        crop_name: forecast.crop_name,
        district: forecast.district,
        state: forecast.state,
        direction: forecast.direction,
        confidence: forecast.confidence,
        reason: forecast.reason,
        generated_at: forecast.generated_at,
        based_on_points: forecast.based_on_points,
        data_freshness_hours: forecast.data_freshness_hours,
      });

      if (!error) {
        insertedCount++;
      } else {
        console.error('Forecast insert error:', error);
        failedCount++;
      }
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
      failed: failedCount,
      skipped: skipped.length,
      skipped_details: skipped.slice(0, 10), // Only return first 10
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
