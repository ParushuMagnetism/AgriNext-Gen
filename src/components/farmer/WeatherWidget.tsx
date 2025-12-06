import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudDrizzle, 
  CloudSnow, 
  Wind, 
  Droplets,
  Thermometer,
  MapPin
} from 'lucide-react';
import { useFarmerProfile } from '@/hooks/useFarmerDashboard';

interface WeatherData {
  temp: number;
  humidity: number;
  description: string;
  windSpeed: number;
  icon: string;
  location: string;
}

// Simulated weather data based on Indian conditions
const getSimulatedWeather = (village: string | null): WeatherData => {
  const conditions = [
    { description: 'Sunny', icon: 'sun', temp: 32 },
    { description: 'Partly Cloudy', icon: 'cloud', temp: 29 },
    { description: 'Light Rain', icon: 'drizzle', temp: 26 },
    { description: 'Humid', icon: 'cloud', temp: 31 },
    { description: 'Clear Sky', icon: 'sun', temp: 34 },
  ];
  
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  
  return {
    temp: condition.temp + Math.floor(Math.random() * 4) - 2,
    humidity: 45 + Math.floor(Math.random() * 35),
    description: condition.description,
    windSpeed: 5 + Math.floor(Math.random() * 15),
    icon: condition.icon,
    location: village || 'Your Location',
  };
};

const getWeatherIcon = (icon: string) => {
  switch (icon) {
    case 'sun':
      return <Sun className="h-10 w-10 text-amber-500" />;
    case 'cloud':
      return <Cloud className="h-10 w-10 text-gray-400" />;
    case 'rain':
      return <CloudRain className="h-10 w-10 text-blue-500" />;
    case 'drizzle':
      return <CloudDrizzle className="h-10 w-10 text-blue-400" />;
    case 'snow':
      return <CloudSnow className="h-10 w-10 text-sky-300" />;
    default:
      return <Sun className="h-10 w-10 text-amber-500" />;
  }
};

const WeatherWidget = () => {
  const { data: profile, isLoading: profileLoading } = useFarmerProfile();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call delay
    const timer = setTimeout(() => {
      setWeather(getSimulatedWeather(profile?.village || null));
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [profile?.village]);

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

  return (
    <Card className="bg-gradient-to-br from-sky-500 to-blue-600 text-white border-0 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <CardHeader className="pb-2 relative">
        <CardTitle className="flex items-center gap-2 text-white/90 text-base">
          <Cloud className="h-4 w-4" />
          Weather Today
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              {getWeatherIcon(weather.icon)}
            </div>
            <div>
              <p className="text-4xl font-bold">{weather.temp}°C</p>
              <p className="text-white/80 text-sm">{weather.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-3 text-white/70 text-xs">
          <MapPin className="h-3 w-3" />
          <span>{weather.location}</span>
        </div>

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
              <p className="text-sm font-medium">{weather.windSpeed} km/h</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-white/70" />
            <div>
              <p className="text-xs text-white/60">Feels</p>
              <p className="text-sm font-medium">{weather.temp + 2}°C</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;