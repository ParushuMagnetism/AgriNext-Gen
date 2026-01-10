import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_TTL_HOURS = 6;

interface MandiPrice {
  crop_name: string;
  market_name: string;
  district: string;
  modal_price: number;
  min_price: number | null;
  max_price: number | null;
  unit: string;
  source: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    let cropsQuery = supabase
      .from('crops')
      .select('crop_name')
      .neq('status', 'harvested');

    const { data: crops, error: cropsError } = await cropsQuery;

    if (cropsError) {
      console.error('Crops fetch error:', cropsError);
      throw new Error('Failed to fetch crops');
    }

    // Get unique crop names
    const cropNames = [...new Set(crops?.map(c => c.crop_name) || [])];
    const cropsToSync = targetCrops || cropNames.slice(0, 10); // Limit to 10 crops

    console.log('Crops to sync:', cropsToSync);

    // Get Karnataka mandis
    let mandisQuery = supabase
      .from('mandi_registry')
      .select('mandi_name, district')
      .eq('state', 'Karnataka')
      .order('priority', { ascending: true })
      .limit(5); // Top 5 priority mandis

    const { data: mandis, error: mandisError } = await mandisQuery;

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

    const results: { success: number; failed: number; skipped: number } = {
      success: 0,
      failed: 0,
      skipped: 0,
    };

    const now = new Date();
    const cacheThreshold = new Date(now.getTime() - CACHE_TTL_HOURS * 60 * 60 * 1000);

    // Process each crop + mandi combination
    for (const crop of cropsToSync) {
      for (const mandi of mandisToSync) {
        const cacheKey = `mandi_price:${crop}:${mandi.mandi_name}`;
        
        // Check if we have recent data
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
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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

          if (!response.ok) {
            throw new Error(`Perplexity API error: ${response.status}`);
          }

          const result = await response.json();
          const content = result.choices?.[0]?.message?.content || '';
          
          console.log(`Price for ${crop} at ${mandi.mandi_name}:`, content);

          // Parse the response
          let priceData: MandiPrice | null = null;
          
          try {
            let jsonStr = content.trim();
            if (jsonStr.startsWith('```')) {
              jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            }
            
            const parsed = JSON.parse(jsonStr);
            
            if (parsed.error) {
              console.log(`No data for ${crop} at ${mandi.mandi_name}`);
              results.failed++;
              continue;
            }

            if (parsed.modal_price && parsed.modal_price > 0) {
              priceData = {
                crop_name: crop,
                market_name: mandi.mandi_name,
                district: mandi.district,
                modal_price: parsed.modal_price,
                min_price: parsed.min_price || null,
                max_price: parsed.max_price || null,
                unit: parsed.unit || 'quintal',
                source: parsed.source || 'Perplexity AI',
              };
            }
          } catch (parseError) {
            console.error('Failed to parse price JSON:', parseError);
            
            // Try regex extraction as fallback
            const priceMatch = content.match(/₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
            if (priceMatch) {
              const price = parseFloat(priceMatch[1].replace(/,/g, ''));
              if (price > 100 && price < 100000) { // Reasonable range for quintals
                priceData = {
                  crop_name: crop,
                  market_name: mandi.mandi_name,
                  district: mandi.district,
                  modal_price: price,
                  min_price: null,
                  max_price: null,
                  unit: 'quintal',
                  source: 'Perplexity AI (extracted)',
                };
              }
            }
          }

          if (priceData) {
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
            if (prevPrice) {
              const priceDiff = priceData.modal_price - prevPrice.modal_price;
              const percentChange = (priceDiff / prevPrice.modal_price) * 100;
              if (percentChange > 2) trendDirection = 'up';
              else if (percentChange < -2) trendDirection = 'down';
            }

            // Insert new price record
            const { error: insertError } = await supabase
              .from('market_prices')
              .insert({
                crop_name: priceData.crop_name,
                market_name: priceData.market_name,
                district: priceData.district,
                state: 'Karnataka',
                modal_price: priceData.modal_price,
                min_price: priceData.min_price,
                max_price: priceData.max_price,
                unit: priceData.unit,
                source: priceData.source,
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
          } else {
            results.failed++;
          }

          // Log the fetch
          await supabase.from('web_fetch_logs').insert({
            endpoint: 'sync-karnataka-mandi-prices',
            query: `${crop}:${mandi.mandi_name}`,
            success: priceData !== null,
            latency_ms: Date.now() - fetchStart,
          });

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (fetchError) {
          console.error(`Error fetching ${crop} at ${mandi.mandi_name}:`, fetchError);
          results.failed++;
          
          await supabase.from('web_fetch_logs').insert({
            endpoint: 'sync-karnataka-mandi-prices',
            query: `${crop}:${mandi.mandi_name}`,
            success: false,
            error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          });
        }
      }
    }

    console.log('Sync results:', results);

    return new Response(JSON.stringify({
      message: 'Mandi price sync completed',
      results,
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
