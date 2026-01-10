import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// STRICT SCHEMA: Normalized Weather Response
// ============================================
interface NormalizedWeather {
  location_key: string;
  temp_c: number | null;
  humidity: number | null;
  wind_kmh: number | null;
  description: string;
  icon: string | null;
  forecast_short: string | null;
  source: 'perplexity' | 'openweather' | 'cache' | 'fallback';
  fetched_at: string;
  cache_hit: boolean;
}

const CACHE_TTL_MINUTES = 60;
const PERPLEXITY_TIMEOUT_MS = 8000;

// ============================================
// VALIDATION FUNCTIONS
// ============================================
function validateTemp(val: unknown): number | null {
  if (typeof val !== 'number') return null;
  if (val < -10 || val > 60) return null; // Reasonable range for India
  return Math.round(val);
}

function validateHumidity(val: unknown): number | null {
  if (typeof val !== 'number') return null;
  if (val < 0 || val > 100) return null;
  return Math.round(val);
}

function validateWindSpeed(val: unknown): number | null {
  if (typeof val !== 'number') return null;
  if (val < 0 || val > 200) return null;
  return Math.round(val);
}

function validateDescription(val: unknown): string {
  if (typeof val !== 'string' || val.trim().length === 0) return 'Weather data available';
  return val.trim().slice(0, 100);
}

function validateIcon(val: unknown): string | null {
  const validIcons = ['sun', 'cloud', 'rain', 'drizzle', 'snow', 'thunderstorm'];
  if (typeof val !== 'string') return null;
  return validIcons.includes(val.toLowerCase()) ? val.toLowerCase() : 'cloud';
}

function validateForecast(val: unknown): string | null {
  if (typeof val !== 'string' || val.trim().length === 0) return null;
  return val.trim().slice(0, 200);
}

// Karnataka seasonal fallback
function getSeasonalFallback(locationKey: string): NormalizedWeather {
  const now = new Date();
  const month = now.getMonth();
  const isMonsoon = month >= 5 && month <= 9;
  const isWinter = month >= 11 || month <= 1;
  const isSummer = month >= 2 && month <= 4;

  return {
    location_key: locationKey,
    temp_c: isSummer ? 34 : isWinter ? 22 : 28,
    humidity: isMonsoon ? 80 : isWinter ? 50 : 60,
    wind_kmh: 12,
    description: isMonsoon ? 'Rainy' : isSummer ? 'Sunny' : 'Partly Cloudy',
    icon: isMonsoon ? 'rain' : isSummer ? 'sun' : 'cloud',
    forecast_short: isMonsoon 
      ? 'Monsoon season - expect rainfall' 
      : isSummer 
        ? 'Hot and dry conditions expected'
        : 'Pleasant weather expected',
    source: 'fallback',
    fetched_at: now.toISOString(),
    cache_hit: false,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let success = true;
  let errorMsg: string | null = null;
  let cacheHit = false;
  let locationKey = '';

  try {
    // ============================================
    // AUTH: Require farmer authentication
    // ============================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch farmer profile for location
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('village, district')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile error:', profileError);
      throw new Error('Failed to fetch profile');
    }

    const village = profile?.village || 'Bengaluru';
    const district = profile?.district || 'Bengaluru Urban';
    locationKey = `${village}, ${district}, Karnataka`;

    console.log(`Fetching weather for: ${locationKey}`);

    // ============================================
    // CACHE CHECK: 60 minute TTL
    // ============================================
    const { data: cached } = await supabase
      .from('weather_cache')
      .select('*')
      .eq('location_key', locationKey)
      .maybeSingle();

    const now = new Date();
    if (cached) {
      const cachedTime = new Date(cached.fetched_at);
      const ageMinutes = (now.getTime() - cachedTime.getTime()) / (1000 * 60);
      
      if (ageMinutes < CACHE_TTL_MINUTES) {
        console.log('Returning cached weather data');
        cacheHit = true;
        
        // Log cache hit
        await supabase.from('web_fetch_logs').insert({
          endpoint: 'get-weather',
          cache_key: locationKey,
          query: locationKey,
          cache_hit: true,
          success: true,
          latency_ms: Date.now() - startTime,
        });

        const cachedData = cached.data as Record<string, unknown>;
        const response: NormalizedWeather = {
          location_key: locationKey,
          temp_c: validateTemp(cachedData.temp_c),
          humidity: validateHumidity(cachedData.humidity),
          wind_kmh: validateWindSpeed(cachedData.wind_kmh),
          description: validateDescription(cachedData.description),
          icon: validateIcon(cachedData.icon),
          forecast_short: validateForecast(cachedData.forecast_short),
          source: 'cache',
          fetched_at: cached.fetched_at,
          cache_hit: true,
        };

        return new Response(JSON.stringify({
          data: response,
          cached: true,
          cache_age_minutes: Math.round(ageMinutes),
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ============================================
    // FETCH: Try Perplexity API with strict timeout
    // ============================================
    let weatherData: NormalizedWeather | null = null;
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (perplexityKey) {
      console.log('Fetching weather from Perplexity...');
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), PERPLEXITY_TIMEOUT_MS);

        const query = `Current weather and 24-hour forecast for ${village}, ${district}, Karnataka, India. Provide: temperature in Celsius, humidity percentage, wind speed in km/h, weather condition (sunny/cloudy/rainy/etc), and brief forecast.`;

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
                content: 'You are a weather assistant. Respond ONLY with a JSON object containing: temp_c (number), humidity (number 0-100), wind_kmh (number), description (short string like "Sunny", "Partly Cloudy", "Light Rain"), icon (one of: sun, cloud, rain, drizzle, thunderstorm), forecast_short (1-2 sentence forecast). No markdown, just JSON.',
              },
              { role: 'user', content: query },
            ],
            max_tokens: 200,
            temperature: 0.1,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          const content = result.choices?.[0]?.message?.content || '';
          
          console.log('Perplexity response:', content);

          try {
            let jsonStr = content.trim();
            if (jsonStr.startsWith('```')) {
              jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            }
            
            const parsed = JSON.parse(jsonStr);
            
            // STRICT VALIDATION: Only accept if we get valid key fields
            const tempValid = validateTemp(parsed.temp_c);
            const descValid = validateDescription(parsed.description);
            
            if (tempValid !== null && descValid !== 'Weather data available') {
              weatherData = {
                location_key: locationKey,
                temp_c: tempValid,
                humidity: validateHumidity(parsed.humidity),
                wind_kmh: validateWindSpeed(parsed.wind_kmh),
                description: descValid,
                icon: validateIcon(parsed.icon),
                forecast_short: validateForecast(parsed.forecast_short),
                source: 'perplexity',
                fetched_at: now.toISOString(),
                cache_hit: false,
              };
            } else {
              console.log('Perplexity response failed validation, will use cache/fallback');
            }
          } catch (parseError) {
            console.error('Failed to parse weather JSON:', parseError);
            // Regex fallback extraction
            const tempMatch = content.match(/(\d+)\s*°?C/);
            const humidityMatch = content.match(/(\d+)\s*%/);
            
            if (tempMatch) {
              const extractedTemp = validateTemp(parseInt(tempMatch[1]));
              if (extractedTemp !== null) {
                weatherData = {
                  location_key: locationKey,
                  temp_c: extractedTemp,
                  humidity: humidityMatch ? validateHumidity(parseInt(humidityMatch[1])) : null,
                  wind_kmh: 12,
                  description: content.includes('rain') ? 'Rainy' : content.includes('sun') ? 'Sunny' : 'Partly Cloudy',
                  icon: content.includes('rain') ? 'rain' : content.includes('sun') ? 'sun' : 'cloud',
                  forecast_short: 'Weather conditions normal for the season.',
                  source: 'perplexity',
                  fetched_at: now.toISOString(),
                  cache_hit: false,
                };
              }
            }
          }
        } else {
          console.error('Perplexity API error:', response.status);
          success = false;
          errorMsg = `API returned ${response.status}`;
        }
      } catch (fetchError) {
        console.error('Perplexity fetch error:', fetchError);
        success = false;
        errorMsg = fetchError instanceof Error ? fetchError.message : 'Fetch failed';
      }
    }

    // ============================================
    // FALLBACK: Use cached data or seasonal default
    // ============================================
    if (!weatherData) {
      if (cached) {
        console.log('Using stale cache as fallback - NOT overwriting with bad data');
        
        await supabase.from('web_fetch_logs').insert({
          endpoint: 'get-weather',
          cache_key: locationKey,
          query: locationKey,
          cache_hit: true,
          success: false,
          latency_ms: Date.now() - startTime,
          error: errorMsg || 'Failed to fetch, using stale cache',
        });

        const cachedData = cached.data as Record<string, unknown>;
        return new Response(JSON.stringify({
          data: {
            location_key: locationKey,
            temp_c: validateTemp(cachedData.temp_c),
            humidity: validateHumidity(cachedData.humidity),
            wind_kmh: validateWindSpeed(cachedData.wind_kmh),
            description: validateDescription(cachedData.description),
            icon: validateIcon(cachedData.icon),
            forecast_short: validateForecast(cachedData.forecast_short),
            source: 'cache' as const,
            fetched_at: cached.fetched_at,
            cache_hit: true,
          },
          cached: true,
          stale: true,
          message: 'Could not refresh weather data',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // No cache, use seasonal fallback
      weatherData = getSeasonalFallback(locationKey);
    }

    // ============================================
    // STORE: Only store valid weather data
    // ============================================
    if (weatherData.source !== 'fallback') {
      await supabase
        .from('weather_cache')
        .upsert({
          location_key: locationKey,
          data: weatherData,
          fetched_at: now.toISOString(),
        });
    }

    // Log the fetch
    await supabase.from('web_fetch_logs').insert({
      endpoint: 'get-weather',
      cache_key: locationKey,
      query: locationKey,
      cache_hit: false,
      success,
      latency_ms: Date.now() - startTime,
      error: errorMsg,
    });

    return new Response(JSON.stringify({
      data: weatherData,
      cached: false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-weather:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to fetch weather',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
