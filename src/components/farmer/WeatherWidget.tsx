import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudDrizzle, 
  CloudSnow, 
  Wind, 
  Droplets,
  Thermometer,
  MapPin,
  RefreshCw,
  CloudLightning,
  Clock
} from 'lucide-react';
import { useFarmerProfile } from '@/hooks/useFarmerDashboard';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

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

interface WeatherResponse {
  data: WeatherData;
  cached: boolean;
  stale?: boolean;
  cache_age_minutes?: number;
  message?: string;
}

const getWeatherIcon = (icon: string) => {
  switch (icon) {
    case 'sun':
      return <Sun className="h-10 w-10 text-amber-500" />;
    case 'cloud':
      return <Cloud className="h-10 w-10 text-gray-200" />;
    case 'rain':
      return <CloudRain className="h-10 w-10 text-blue-300" />;
    case 'drizzle':
      return <CloudDrizzle className="h-10 w-10 text-blue-200" />;
    case 'snow':
      return <CloudSnow className="h-10 w-10 text-sky-200" />;
    case 'thunderstorm':
      return <CloudLightning className="h-10 w-10 text-yellow-400" />;
    default:
      return <Sun className="h-10 w-10 text-amber-500" />;
  }
};

const WeatherWidget = () => {
  const { data: profile, isLoading: profileLoading } = useFarmerProfile();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [isStale, setIsStale] = useState(false);

  const fetchWeather = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    else setIsLoading(true);
    
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error: invokeError } = await supabase.functions.invoke<WeatherResponse>('get-weather', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (invokeError) {
        throw invokeError;
      }

      if (data?.data) {
        setWeather(data.data);
        setIsCached(data.cached || false);
        setIsStale(data.stale || false);
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Could not load weather');
      
      // Use fallback based on Karnataka climate
      const month = new Date().getMonth();
      const isMonsoon = month >= 5 && month <= 9;
      const isWinter = month >= 11 || month <= 1;
      const isSummer = month >= 2 && month <= 4;

      setWeather({
        temp_c: isSummer ? 34 : isWinter ? 22 : 28,
        humidity: isMonsoon ? 80 : isWinter ? 50 : 60,
        wind_kmh: 12,
        description: isMonsoon ? 'Rainy' : isSummer ? 'Sunny' : 'Partly Cloudy',
        icon: isMonsoon ? 'rain' : isSummer ? 'sun' : 'cloud',
        forecast_short: 'Weather data unavailable',
        fetched_at: new Date().toISOString(),
        location: profile?.village || 'Karnataka',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!profileLoading) {
      fetchWeather();
    }
  }, [profileLoading, profile?.village]);

  if (isLoading || profileLoading) {
    return (
      <Card className="bg-gradient-to-br from-sky-500 to-blue-600 text-white border-0">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white">
            <Cloud className="h-5 w-5" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Skeleton className="h-20 w-20 rounded-full bg-white/20" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-16 bg-white/20" />
              <Skeleton className="h-4 w-24 bg-white/20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  const lastUpdated = weather.fetched_at 
    ? formatDistanceToNow(new Date(weather.fetched_at), { addSuffix: true })
    : 'unknown';

  return (
    <Card className="bg-gradient-to-br from-sky-500 to-blue-600 text-white border-0 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <CardHeader className="pb-2 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white/90 text-base">
            <Cloud className="h-4 w-4" />
            Weather Today
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => fetchWeather(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              {getWeatherIcon(weather.icon)}
            </div>
            <div>
              <p className="text-4xl font-bold">{weather.temp_c}°C</p>
              <p className="text-white/80 text-sm">{weather.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-3 text-white/70 text-xs">
          <MapPin className="h-3 w-3" />
          <span>{weather.location || profile?.village || 'Your Location'}</span>
        </div>

        {weather.forecast_short && (
          <p className="mt-2 text-xs text-white/60 italic line-clamp-2">
            {weather.forecast_short}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-white/70" />
            <div>
              <p className="text-xs text-white/60">Humidity</p>
              <p className="text-sm font-medium">{weather.humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-white/70" />
            <div>
              <p className="text-xs text-white/60">Wind</p>
              <p className="text-sm font-medium">{weather.wind_kmh} km/h</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-white/70" />
            <div>
              <p className="text-xs text-white/60">Feels</p>
              <p className="text-sm font-medium">{weather.temp_c + 2}°C</p>
            </div>
          </div>
        </div>

        {/* Last updated indicator */}
        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-white/10 text-white/50 text-[10px]">
          <Clock className="h-3 w-3" />
          <span>Updated {lastUpdated}</span>
          {isStale && <span className="text-amber-300 ml-1">(cached)</span>}
          {error && <span className="text-amber-300 ml-1">(offline)</span>}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
