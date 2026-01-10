import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherData {
  temp_c: number;
  humidity: number;
  wind_kmh: number;
  description: string;
  icon: string;
  forecast_short: string;
  fetched_at: string;
  location: string;
}

interface CacheEntry {
  location_key: string;
  data: WeatherData;
  fetched_at: string;
}

const CACHE_TTL_MINUTES = 60;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let success = true;
  let errorMsg: string | null = null;

  try {
    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role for cache access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create user client for profile access
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user from token
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
    const locationKey = `${village}, ${district}, Karnataka`;

    console.log(`Fetching weather for: ${locationKey}`);

    // Check cache first
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
        return new Response(JSON.stringify({
          data: cached.data,
          cached: true,
          cache_age_minutes: Math.round(ageMinutes),
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Try to fetch fresh weather data
    let weatherData: WeatherData | null = null;

    // Try Perplexity API for weather
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (perplexityKey) {
      console.log('Fetching weather from Perplexity...');
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

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

          // Try to parse JSON from response
          try {
            // Clean up the response (remove markdown code blocks if present)
            let jsonStr = content.trim();
            if (jsonStr.startsWith('```')) {
              jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            }
            
            const parsed = JSON.parse(jsonStr);
            
            weatherData = {
              temp_c: parsed.temp_c || 28,
              humidity: parsed.humidity || 60,
              wind_kmh: parsed.wind_kmh || 10,
              description: parsed.description || 'Partly Cloudy',
              icon: parsed.icon || 'cloud',
              forecast_short: parsed.forecast_short || 'Weather data available',
              fetched_at: now.toISOString(),
              location: locationKey,
            };
          } catch (parseError) {
            console.error('Failed to parse weather JSON:', parseError);
            // Extract data using regex as fallback
            const tempMatch = content.match(/(\d+)\s*°?C/);
            const humidityMatch = content.match(/(\d+)\s*%/);
            
            weatherData = {
              temp_c: tempMatch ? parseInt(tempMatch[1]) : 28,
              humidity: humidityMatch ? parseInt(humidityMatch[1]) : 60,
              wind_kmh: 12,
              description: content.includes('rain') ? 'Rainy' : content.includes('sun') ? 'Sunny' : 'Partly Cloudy',
              icon: content.includes('rain') ? 'rain' : content.includes('sun') ? 'sun' : 'cloud',
              forecast_short: 'Weather conditions normal for the season.',
              fetched_at: now.toISOString(),
              location: locationKey,
            };
          }
        }
      } catch (fetchError) {
        console.error('Perplexity fetch error:', fetchError);
        success = false;
        errorMsg = fetchError instanceof Error ? fetchError.message : 'Fetch failed';
      }
    }

    // If no fresh data, use cached or generate fallback
    if (!weatherData) {
      if (cached) {
        console.log('Using stale cache as fallback');
        return new Response(JSON.stringify({
          data: cached.data,
          cached: true,
          stale: true,
          message: 'Could not refresh weather data',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate reasonable default based on Karnataka climate
      const month = now.getMonth();
      const isMonsoon = month >= 5 && month <= 9;
      const isWinter = month >= 11 || month <= 1;
      const isSummer = month >= 2 && month <= 4;

      weatherData = {
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
        fetched_at: now.toISOString(),
        location: locationKey,
      };
    }

    // Store in cache
    await supabase
      .from('weather_cache')
      .upsert({
        location_key: locationKey,
        data: weatherData,
        fetched_at: now.toISOString(),
      });

    // Log the fetch
    await supabase.from('web_fetch_logs').insert({
      endpoint: 'get-weather',
      query: locationKey,
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
