import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_TTL_HOURS = 6;
const MAX_PERPLEXITY_CALLS_PER_RUN = 10;
const PERPLEXITY_DELAY_MS = 1500; // Delay between calls to avoid rate limiting

// ============================================
// INTERFACES
// ============================================
interface PerplexityItem {
  district: string;
  mandi_name: string;
  crop_name_raw: string;
  unit: string;
  min_price: number | null;
  max_price: number | null;
  modal_price: number | null;
  date: string | null;
  source_url: string;
  source_name: string;
  notes: string;
}

interface PerplexityResponse {
  items: PerplexityItem[];
  meta: {
    as_of: string;
    confidence: number;
  };
  error?: string;
}

interface SyncRequest {
  maxSegments?: number;
  force?: boolean;
  district?: string;
  crop?: string;
}

// ============================================
// HELPER FUNCTIONS
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
    const cleaned = val.replace(/[₹$,\s]/g, '').trim();
    numVal = parseFloat(cleaned);
  } else {
    return null;
  }
  
  if (isNaN(numVal) || numVal < 0 || numVal > 1000000) return null;
  return Math.round(numVal * 100) / 100;
}

function computeReliabilityScore(item: PerplexityItem): number {
  let score = 50;
  
  // Official sources get higher score
  const officialDomains = ['agmarknet', 'apmc', 'gov.in', 'karnataka.gov', 'kpmc'];
  const sourceUrl = (item.source_url || '').toLowerCase();
  const sourceName = (item.source_name || '').toLowerCase();
  
  if (officialDomains.some(d => sourceUrl.includes(d) || sourceName.includes(d))) {
    score += 40;
  } else if (sourceUrl.includes('.gov') || sourceUrl.includes('mandi')) {
    score += 25;
  }
  
  // Has date = more reliable
  if (item.date) {
    score += 10;
  }
  
  // Has all price fields = more complete
  if (item.modal_price && item.min_price && item.max_price) {
    score += 5;
  }
  
  return Math.min(score, 100);
}

function computeConfidence(sources: { reliability: number }[], freshnessHours: number): 'low' | 'medium' | 'high' {
  if (sources.length === 0) return 'low';
  
  const avgReliability = sources.reduce((sum, s) => sum + s.reliability, 0) / sources.length;
  
  if (sources.length >= 2 && avgReliability >= 80 && freshnessHours < 24) {
    return 'high';
  }
  if (sources.length >= 1 && avgReliability >= 60 && freshnessHours < 48) {
    return 'medium';
  }
  return 'low';
}

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
// MAIN HANDLER
// ============================================
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

    // Parse request body
    let requestBody: SyncRequest = { maxSegments: 20, force: false };
    try {
      const body = await req.json();
      requestBody = { ...requestBody, ...body };
    } catch {
      // No body provided
    }

    const { maxSegments, force, district: targetDistrict, crop: targetCrop } = requestBody;

    // Get Perplexity API key
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityKey) {
      console.error('PERPLEXITY_API_KEY not configured');
      return new Response(JSON.stringify({
        error: 'Perplexity API key not configured',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // GET SEGMENTS TO SYNC
    // ============================================
    const cacheThreshold = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000);
    
    let segmentsQuery = supabase
      .from('farmer_segments')
      .select('*')
      .gt('active_farmer_count', 0);
    
    // Filter by district/crop if specified
    if (targetDistrict) {
      segmentsQuery = segmentsQuery.eq('district', targetDistrict);
    }
    if (targetCrop) {
      segmentsQuery = segmentsQuery.eq('crop_canonical', targetCrop);
    }
    
    // Only get stale segments unless forced
    if (!force) {
      segmentsQuery = segmentsQuery.or(`last_crawled_at.is.null,last_crawled_at.lt.${cacheThreshold.toISOString()}`);
    }
    
    segmentsQuery = segmentsQuery
      .order('active_farmer_count', { ascending: false })
      .limit(maxSegments || 20);

    const { data: segments, error: segmentsError } = await segmentsQuery;

    if (segmentsError) {
      throw new Error(`Failed to fetch segments: ${segmentsError.message}`);
    }

    console.log(`Found ${segments?.length || 0} segments to sync`);

    if (!segments || segments.length === 0) {
      return new Response(JSON.stringify({
        message: 'No segments due for sync',
        cache_hit: true,
        segments_processed: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // PROCESS EACH SEGMENT
    // ============================================
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      raw_records_inserted: 0,
      agg_records_updated: 0,
    };

    let perplexityCalls = 0;

    for (const segment of segments) {
      if (perplexityCalls >= MAX_PERPLEXITY_CALLS_PER_RUN) {
        console.log(`Rate limit reached (${MAX_PERPLEXITY_CALLS_PER_RUN} calls). Stopping.`);
        break;
      }

      const segmentKey = segment.segment_key;
      const district = segment.district;
      const crop = segment.crop_canonical;

      console.log(`Processing segment: ${segmentKey}`);

      try {
        const fetchStart = Date.now();

        // ============================================
        // PERPLEXITY API CALL
        // ============================================
        const systemPrompt = `You are extracting agricultural mandi prices for Karnataka, India. Return strict JSON only. Use recent data. Include source_url for each item. If data is unavailable, return an empty array and explain in error field.`;

        const userPrompt = `Fetch latest mandi/APMC prices for:
State: Karnataka
District: ${district}
Crop: ${crop} (include common aliases)

Return JSON:
{
  "items": [
    {
      "district": "...",
      "mandi_name": "...",
      "crop_name_raw": "...",
      "unit": "quintal" or "kg",
      "min_price": number|null,
      "max_price": number|null,
      "modal_price": number|null,
      "date": "YYYY-MM-DD"|null,
      "source_url": "...",
      "source_name": "...",
      "notes": "..."
    }
  ],
  "meta": { "as_of": "...", "confidence": 0-100 }
}

Constraints:
- Prefer official portals / agmarknet / apmc / govt or reputable market boards
- Do not hallucinate numbers: if unclear, set fields to null and lower confidence`;

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 1500,
            temperature: 0.1,
          }),
        });

        perplexityCalls++;
        const latencyMs = Date.now() - fetchStart;

        if (!response.ok) {
          throw new Error(`Perplexity API error: ${response.status}`);
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content || '';
        const citations = result.citations || [];

        console.log(`Perplexity response for ${segmentKey}:`, content.substring(0, 200));

        // ============================================
        // PARSE AND VALIDATE RESPONSE
        // ============================================
        let parsedData: PerplexityResponse;
        try {
          let jsonStr = content.trim();
          // Remove markdown code blocks if present
          if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
          }
          parsedData = JSON.parse(jsonStr);
        } catch (parseError) {
          console.error(`JSON parse error for ${segmentKey}:`, parseError);
          
          // Log the failure
          await supabase.from('web_fetch_logs').insert({
            endpoint: 'sync-karnataka-mandi-prices',
            function_name: 'sync-karnataka-mandi-prices',
            segment_key: segmentKey,
            query: `${district}:${crop}`,
            cache_hit: false,
            success: false,
            latency_ms: latencyMs,
            error: 'JSON parse error',
            request_json: { district, crop },
            response_meta: { raw_content: content.substring(0, 500) },
          });
          
          results.failed++;
          continue;
        }

        if (parsedData.error || !parsedData.items || parsedData.items.length === 0) {
          console.log(`No data for ${segmentKey}:`, parsedData.error);
          
          await supabase.from('web_fetch_logs').insert({
            endpoint: 'sync-karnataka-mandi-prices',
            function_name: 'sync-karnataka-mandi-prices',
            segment_key: segmentKey,
            query: `${district}:${crop}`,
            cache_hit: false,
            success: false,
            latency_ms: latencyMs,
            error: parsedData.error || 'No items returned',
          });
          
          results.failed++;
          continue;
        }

        // ============================================
        // INSERT RAW RECORDS
        // ============================================
        const now = new Date().toISOString();
        const rawRecords = parsedData.items.map(item => ({
          fetched_at: now,
          state: 'Karnataka',
          district: sanitizeString(item.district) || district,
          mandi_name: sanitizeString(item.mandi_name) || 'Unknown',
          crop_name: sanitizeString(item.crop_name_raw) || crop,
          crop_canonical: crop,
          unit: item.unit || 'quintal',
          min_price: parsePrice(item.min_price),
          max_price: parsePrice(item.max_price),
          modal_price: parsePrice(item.modal_price),
          source_url: item.source_url || null,
          source_name: item.source_name || 'Perplexity AI',
          reliability_score: computeReliabilityScore(item),
          raw_json: item,
          status: 'success',
        }));

        const { error: rawInsertError } = await supabase
          .from('market_prices_raw')
          .insert(rawRecords);

        if (rawInsertError) {
          console.error(`Raw insert error for ${segmentKey}:`, rawInsertError);
        } else {
          results.raw_records_inserted += rawRecords.length;
        }

        // ============================================
        // AGGREGATE INTO market_prices_agg
        // ============================================
        // Find best price data (highest reliability with valid modal price)
        const validItems = rawRecords.filter(r => r.modal_price !== null);
        
        if (validItems.length > 0) {
          // Sort by reliability descending
          validItems.sort((a, b) => (b.reliability_score || 0) - (a.reliability_score || 0));
          
          // Use median modal price if multiple
          const modalPrices = validItems.map(r => r.modal_price!).sort((a, b) => a - b);
          const medianPrice = modalPrices[Math.floor(modalPrices.length / 2)];
          
          const minPrices = validItems.map(r => r.min_price).filter(p => p !== null) as number[];
          const maxPrices = validItems.map(r => r.max_price).filter(p => p !== null) as number[];
          
          const freshnessMinutes = Math.round((Date.now() - new Date(now).getTime()) / (1000 * 60));
          const confidence = computeConfidence(
            validItems.map(r => ({ reliability: r.reliability_score || 50 })),
            freshnessMinutes / 60
          );

          const aggRecord = {
            state: 'Karnataka',
            district,
            crop_name: crop,
            modal_price: medianPrice,
            min_price: minPrices.length > 0 ? Math.min(...minPrices) : null,
            max_price: maxPrices.length > 0 ? Math.max(...maxPrices) : null,
            unit: 'quintal',
            sources_count: validItems.length,
            sources_used: validItems.slice(0, 3).map(r => ({
              mandi_name: r.mandi_name,
              source_url: r.source_url,
              reliability: r.reliability_score,
            })),
            confidence,
            freshness_minutes: freshnessMinutes,
            fetched_at: now,
          };

          const { error: aggError } = await supabase
            .from('market_prices_agg')
            .upsert(aggRecord, {
              onConflict: 'state,district,crop_name',
            });

          if (aggError) {
            console.error(`Agg upsert error for ${segmentKey}:`, aggError);
          } else {
            results.agg_records_updated++;
          }
        }

        // ============================================
        // UPDATE SEGMENT LAST_CRAWLED_AT
        // ============================================
        await supabase
          .from('farmer_segments')
          .update({ last_crawled_at: now })
          .eq('segment_key', segmentKey);

        // Log success
        await supabase.from('web_fetch_logs').insert({
          endpoint: 'sync-karnataka-mandi-prices',
          function_name: 'sync-karnataka-mandi-prices',
          segment_key: segmentKey,
          query: `${district}:${crop}`,
          cache_hit: false,
          success: true,
          latency_ms: latencyMs,
          response_meta: {
            items_count: parsedData.items.length,
            citations_count: citations.length,
            confidence: parsedData.meta?.confidence,
          },
        });

        results.success++;

        // Delay between calls to avoid rate limiting
        if (perplexityCalls < segments.length) {
          await new Promise(resolve => setTimeout(resolve, PERPLEXITY_DELAY_MS));
        }

      } catch (error) {
        console.error(`Error processing segment ${segmentKey}:`, error);
        
        await supabase.from('web_fetch_logs').insert({
          endpoint: 'sync-karnataka-mandi-prices',
          function_name: 'sync-karnataka-mandi-prices',
          segment_key: segmentKey,
          query: `${district}:${crop}`,
          cache_hit: false,
          success: false,
          error: error instanceof Error ? error.message.slice(0, 500) : 'Unknown error',
        });
        
        results.failed++;
      }
    }

    const durationMs = Date.now() - startTime;

    console.log('Sync results:', results);

    return new Response(JSON.stringify({
      success: true,
      message: 'Mandi price sync completed',
      results,
      perplexity_calls: perplexityCalls,
      duration_ms: durationMs,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-karnataka-mandi-prices:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Sync failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
