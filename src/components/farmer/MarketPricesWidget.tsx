import { useCrops, useMarketPrices, useAllMarketPrices, useFarmerProfile } from '@/hooks/useFarmerDashboard';
import { usePriceForecasts } from '@/hooks/useMarketData';
import { useIsDistrictValid } from '@/hooks/useKarnatakaDistricts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, IndianRupee, RefreshCw, Clock, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MarketPricesWidget = () => {
  const { data: profile, isLoading: profileLoading } = useFarmerProfile();
  const { data: crops } = useCrops();
  const cropNames = [...new Set(crops?.map(c => c.crop_name) || [])];
  
  // Check if farmer has a valid Karnataka district
  const hasValidDistrict = useIsDistrictValid(profile?.district);
  
  // Use farmer's crops prices if they have crops, otherwise show all prices
  const { data: farmerPrices, isLoading: farmerLoading, refetch: refetchFarmer, isFetching: isFetchingFarmer } = useMarketPrices(cropNames);
  const { data: allPrices, isLoading: allLoading, refetch: refetchAll, isFetching: isFetchingAll } = useAllMarketPrices();
  const { data: forecasts } = usePriceForecasts(cropNames);
  
  const hasCrops = cropNames.length > 0;
  const prices = hasCrops ? farmerPrices : allPrices;
  const isLoading = profileLoading || (hasCrops ? farmerLoading : allLoading);
  const isFetching = hasCrops ? isFetchingFarmer : isFetchingAll;
  const refetch = hasCrops ? refetchFarmer : refetchAll;

  // Group prices by crop name and market, get latest
  const latestPrices = prices?.reduce((acc, price) => {
    const key = `${price.crop_name}-${price.market_name}`;
    if (!acc[key] || new Date(price.date) > new Date(acc[key].date)) {
      acc[key] = price;
    }
    return acc;
  }, {} as Record<string, typeof prices[0]>);

  const pricesList = Object.values(latestPrices || {}).slice(0, 8);

  // Get forecast for a crop
  const getForecast = (cropName: string) => {
    return forecasts?.find(f => f.crop_name === cropName);
  };

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string | null) => {
    switch (trend) {
      case 'up':
        return 'text-emerald-600 bg-emerald-50';
      case 'down':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getForecastBadge = (forecast: ReturnType<typeof getForecast>) => {
    if (!forecast) return null;
    
    const colorMap = {
      up: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      down: 'bg-red-100 text-red-700 border-red-200',
      stable: 'bg-gray-100 text-gray-700 border-gray-200',
    };

    const confidenceMap = {
      low: '◐',
      medium: '◕',
      high: '●',
    };

    return (
      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${colorMap[forecast.direction]}`}>
        {forecast.direction === 'up' ? '↑' : forecast.direction === 'down' ? '↓' : '→'} 
        {' '}{confidenceMap[forecast.confidence]}
      </Badge>
    );
  };

  // Get the most recent fetched_at from prices
  const lastUpdated = pricesList.length > 0 
    ? pricesList.reduce((latest, price) => {
        const fetchedAt = (price as any).fetched_at || price.date;
        return new Date(fetchedAt) > new Date(latest) ? fetchedAt : latest;
      }, pricesList[0].date)
    : null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-primary" />
            Market Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <IndianRupee className="h-5 w-5 text-primary" />
            Karnataka Mandi Prices
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {hasValidDistrict && profile?.district 
              ? `Prices for ${profile.district}` 
              : hasCrops 
                ? 'Prices for your crops' 
                : 'Today\'s market rates'}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {/* Show fallback message if district is not set */}
        {!hasValidDistrict && (
          <Alert className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
              Set your district to see personalized local mandi prices
            </AlertDescription>
          </Alert>
        )}
        
        {pricesList.length === 0 ? (
          <div className="text-center py-8">
            <IndianRupee className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">
              No price data available
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Add crops to see relevant market prices
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pricesList.map((price) => {
              const forecast = getForecast(price.crop_name);
              const fetchedAt = (price as any).fetched_at;
              
              return (
                <div
                  key={price.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-1.5 rounded-md shrink-0 ${getTrendColor(price.trend_direction)}`}>
                      {getTrendIcon(price.trend_direction)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{price.crop_name}</p>
                        {getForecastBadge(forecast)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{price.market_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-foreground flex items-center gap-0.5 justify-end">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {price.modal_price.toLocaleString('en-IN')}
                      <span className="text-xs text-muted-foreground font-normal">/qtl</span>
                    </p>
                    {price.min_price && price.max_price && (
                      <p className="text-xs text-muted-foreground">
                        ₹{price.min_price.toLocaleString('en-IN')} - ₹{price.max_price.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Forecast summary */}
            {forecasts && forecasts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">Price Forecast</p>
                <div className="space-y-1">
                  {forecasts.slice(0, 3).map((f, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className={f.direction === 'up' ? 'text-emerald-600' : f.direction === 'down' ? 'text-red-600' : ''}>
                        {f.direction === 'up' ? '↑' : f.direction === 'down' ? '↓' : '→'}
                      </span>
                      <span className="font-medium">{f.crop_name}:</span>
                      <span className="line-clamp-1">{f.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last updated */}
            {lastUpdated && (
              <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/30 text-muted-foreground/70 text-[10px]">
                <Clock className="h-3 w-3" />
                <span>Data updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketPricesWidget;
