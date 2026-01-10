import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_TTL_HOURS = 6;
const PERPLEXITY_TIMEOUT_MS = 10000;
const MAX_PERPLEXITY_CALLS_PER_RUN = 50; // Rate limiting

// ============================================
// STRICT SCHEMA: Normalized Mandi Price
// ============================================
interface NormalizedMandiPrice {
  crop_name: string;
  mandi_name: string;
  district: string;
  state: 'Karnataka';
  price_modal: number | null;
  price_min: number | null;
  price_max: number | null;
  unit: string;
  source: string | null;
  fetched_at: string;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================
function sanitizeString(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  const cleaned = val.trim();
  return cleaned.length > 0 && cleaned.length < 200 ? cleaned : null;
}

function parsePrice(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  
  let numVal: number;
  
  if (typeof val === 'number') {
    numVal = val;
  } else if (typeof val === 'string') {
    // Strip currency symbols, commas, whitespace
    const cleaned = val.replace(/[₹$,\s]/g, '').trim();
    numVal = parseFloat(cleaned);
  } else {
    return null;
  }
  
  if (isNaN(numVal)) return null;
  if (numVal < 0) return null;
  if (numVal > 1000000) return null; // Reject absurd values
  
  return Math.round(numVal * 100) / 100; // Round to 2 decimal places
}

function normalizeUnit(val: unknown): string {
  if (typeof val !== 'string') return 'quintal';
  const lower = val.toLowerCase().trim();
  
  if (lower.includes('quintal') || lower === 'qtl' || lower === 'q') return 'quintal';
  if (lower.includes('kg') || lower === 'kilogram') return 'kg';
  if (lower.includes('ton') || lower === 'tonne') return 'tonne';
  
  return val.trim().slice(0, 20) || 'quintal';
}

function validateMandiPrice(data: Partial<NormalizedMandiPrice>): NormalizedMandiPrice | null {
  const cropName = sanitizeString(data.crop_name);
  const mandiName = sanitizeString(data.mandi_name);
  const district = sanitizeString(data.district);
  
  if (!cropName || !mandiName || !district) {
    console.error('Validation failed: missing required fields');
    return null;
  }
  
  const priceModal = parsePrice(data.price_modal);
  const priceMin = parsePrice(data.price_min);
  const priceMax = parsePrice(data.price_max);
  
  // Must have at least one valid price
  if (priceModal === null && priceMin === null && priceMax === null) {
    console.error('Validation failed: no valid price');
    return null;
  }
  
  return {
    crop_name: cropName,
    mandi_name: mandiName,
    district,
    state: 'Karnataka',
    price_modal: priceModal,
    price_min: priceMin,
    price_max: priceMax,
    unit: normalizeUnit(data.unit),
    source: data.source ? String(data.source).slice(0, 100) : 'Perplexity AI',
    fetched_at: data.fetched_at || new Date().toISOString(),
  };
}

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
          console.error('Non-admin user attempted to run sync:', user.id);
          return new Response(JSON.stringify({ error: 'Forbidden - Admin only' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.log('Admin user verified:', user.id);
      }
    }
    // If no auth header, allow (for scheduled/cron jobs via service role)

    // Get request body for optional filtering
    let targetCrops: string[] | null = null;
    let targetMandis: string[] | null = null;

    try {
      const body = await req.json();
      targetCrops = body.crops || null;
      targetMandis = body.mandis || null;
    } catch {
      // No body provided, sync all
    }

    // Get active crops from farmers
    const { data: crops, error: cropsError } = await supabase
      .from('crops')
      .select('crop_name')
      .neq('status', 'harvested');

    if (cropsError) {
      console.error('Crops fetch error:', cropsError);
      throw new Error('Failed to fetch crops');
    }

    const cropNames = [...new Set(crops?.map(c => c.crop_name) || [])];
    const cropsToSync = targetCrops || cropNames.slice(0, 10);

    console.log('Crops to sync:', cropsToSync);

    // Get Karnataka mandis
    const { data: mandis, error: mandisError } = await supabase
      .from('mandi_registry')
      .select('mandi_name, district')
      .eq('state', 'Karnataka')
      .order('priority', { ascending: true })
      .limit(5);

    if (mandisError) {
      console.error('Mandis fetch error:', mandisError);
      throw new Error('Failed to fetch mandis');
    }

    const mandisToSync = mandis || [];
    console.log('Mandis to sync:', mandisToSync.map(m => m.mandi_name));

    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityKey) {
      return new Response(JSON.stringify({
        error: 'Perplexity API key not configured',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      validation_failed: 0,
      rate_limited: false,
    };

    const now = new Date();
    const cacheThreshold = new Date(now.getTime() - CACHE_TTL_HOURS * 60 * 60 * 1000);
    let perplexityCalls = 0;

    // Process each crop + mandi combination
    for (const crop of cropsToSync) {
      for (const mandi of mandisToSync) {
        // ============================================
        // RATE LIMITING: Max calls per run
        // ============================================
        if (perplexityCalls >= MAX_PERPLEXITY_CALLS_PER_RUN) {
          console.log(`Rate limit reached (${MAX_PERPLEXITY_CALLS_PER_RUN} calls). Stopping.`);
          results.rate_limited = true;
          break;
        }

        const cacheKey = `mandi_price:${crop}:${mandi.mandi_name}`;
        
        // ============================================
        // CACHE CHECK: 6-hour TTL
        // ============================================
        const { data: existing } = await supabase
          .from('market_prices')
          .select('fetched_at')
          .eq('crop_name', crop)
          .eq('market_name', mandi.mandi_name)
          .gte('fetched_at', cacheThreshold.toISOString())
          .order('fetched_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          console.log(`Skipping ${crop} at ${mandi.mandi_name} - recently fetched`);
          results.skipped++;
          continue;
        }

        // Fetch from Perplexity
        try {
          const fetchStart = Date.now();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), PERPLEXITY_TIMEOUT_MS);

          const query = `Latest APMC mandi price today for ${crop} in ${mandi.mandi_name}, ${mandi.district}, Karnataka India. Provide modal price, minimum price, maximum price in Indian Rupees per quintal.`;

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
                  content: 'You are an agricultural market data assistant. Respond ONLY with a JSON object containing: modal_price (number in INR per quintal), min_price (number or null), max_price (number or null), unit (string, usually "quintal"), source (string, the source of the data). If no data available, respond with {"error": "no data"}. No markdown, just JSON.',
                },
                { role: 'user', content: query },
              ],
              max_tokens: 150,
              temperature: 0.1,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          perplexityCalls++;

          const latencyMs = Date.now() - fetchStart;

          if (!response.ok) {
            throw new Error(`Perplexity API error: ${response.status}`);
          }

          const result = await response.json();
          const content = result.choices?.[0]?.message?.content || '';
          
          console.log(`Price for ${crop} at ${mandi.mandi_name}:`, content);

          // ============================================
          // STRICT PARSING + VALIDATION
          // ============================================
          let validatedPrice: NormalizedMandiPrice | null = null;
          
          try {
            let jsonStr = content.trim();
            if (jsonStr.startsWith('```')) {
              jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            }
            
            const parsed = JSON.parse(jsonStr);
            
            if (parsed.error) {
              console.log(`No data for ${crop} at ${mandi.mandi_name}`);
              
              await supabase.from('web_fetch_logs').insert({
                endpoint: 'sync-karnataka-mandi-prices',
                cache_key: cacheKey,
                query: `${crop}:${mandi.mandi_name}`,
                cache_hit: false,
                success: false,
                latency_ms: latencyMs,
                error: 'No data available',
              });
              
              results.failed++;
              continue;
            }

            validatedPrice = validateMandiPrice({
              crop_name: crop,
              mandi_name: mandi.mandi_name,
              district: mandi.district,
              price_modal: parsed.modal_price,
              price_min: parsed.min_price,
              price_max: parsed.max_price,
              unit: parsed.unit,
              source: parsed.source,
              fetched_at: now.toISOString(),
            });

          } catch (parseError) {
            console.error('Failed to parse price JSON:', parseError);
            
            // Try regex extraction as fallback
            const priceMatch = content.match(/₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
            if (priceMatch) {
              const extractedPrice = parsePrice(priceMatch[1]);
              if (extractedPrice !== null && extractedPrice > 100 && extractedPrice < 100000) {
                validatedPrice = validateMandiPrice({
                  crop_name: crop,
                  mandi_name: mandi.mandi_name,
                  district: mandi.district,
                  price_modal: extractedPrice,
                  unit: 'quintal',
                  source: 'Perplexity AI (extracted)',
                  fetched_at: now.toISOString(),
                });
              }
            }
          }

          if (!validatedPrice) {
            console.error(`Validation failed for ${crop} at ${mandi.mandi_name}`);
            results.validation_failed++;
            
            await supabase.from('web_fetch_logs').insert({
              endpoint: 'sync-karnataka-mandi-prices',
              cache_key: cacheKey,
              query: `${crop}:${mandi.mandi_name}`,
              cache_hit: false,
              success: false,
              latency_ms: latencyMs,
              error: 'Validation failed - rejected garbage data',
            });
            
            continue;
          }

          // Calculate trend based on previous price
          const { data: prevPrice } = await supabase
            .from('market_prices')
            .select('modal_price')
            .eq('crop_name', crop)
            .eq('market_name', mandi.mandi_name)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();

          let trendDirection: 'up' | 'down' | 'flat' = 'flat';
          if (prevPrice && validatedPrice.price_modal) {
            const priceDiff = validatedPrice.price_modal - prevPrice.modal_price;
            const percentChange = (priceDiff / prevPrice.modal_price) * 100;
            if (percentChange > 2) trendDirection = 'up';
            else if (percentChange < -2) trendDirection = 'down';
          }

          // Insert validated price record
          const { error: insertError } = await supabase
            .from('market_prices')
            .insert({
              crop_name: validatedPrice.crop_name,
              market_name: validatedPrice.mandi_name,
              district: validatedPrice.district,
              state: validatedPrice.state,
              modal_price: validatedPrice.price_modal || validatedPrice.price_min || validatedPrice.price_max,
              min_price: validatedPrice.price_min,
              max_price: validatedPrice.price_max,
              unit: validatedPrice.unit,
              source: validatedPrice.source,
              trend_direction: trendDirection,
              date: now.toISOString().split('T')[0],
              fetched_at: now.toISOString(),
            });

          if (insertError) {
            console.error('Insert error:', insertError);
            results.failed++;
          } else {
            results.success++;
          }

          // Log successful fetch
          await supabase.from('web_fetch_logs').insert({
            endpoint: 'sync-karnataka-mandi-prices',
            cache_key: cacheKey,
            query: `${crop}:${mandi.mandi_name}`,
            cache_hit: false,
            success: true,
            latency_ms: latencyMs,
          });

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (fetchError) {
          console.error(`Error fetching ${crop} at ${mandi.mandi_name}:`, fetchError);
          results.failed++;
          
          await supabase.from('web_fetch_logs').insert({
            endpoint: 'sync-karnataka-mandi-prices',
            cache_key: cacheKey,
            query: `${crop}:${mandi.mandi_name}`,
            cache_hit: false,
            success: false,
            error: fetchError instanceof Error ? fetchError.message.slice(0, 200) : 'Unknown error',
          });
        }
      }
      
      if (results.rate_limited) break;
    }

    console.log('Sync results:', results);

    return new Response(JSON.stringify({
      message: results.rate_limited 
        ? 'Mandi price sync partially completed (rate limited)'
        : 'Mandi price sync completed',
      results,
      perplexity_calls: perplexityCalls,
      duration_ms: Date.now() - startTime,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-karnataka-mandi-prices:', error);
    
    return new Response(JSON.stringify({
      error: 'Sync failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
