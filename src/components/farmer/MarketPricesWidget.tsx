import { useCrops, useMarketPrices, useAllMarketPrices } from '@/hooks/useFarmerDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, IndianRupee, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MarketPricesWidget = () => {
  const { data: crops } = useCrops();
  const cropNames = [...new Set(crops?.map(c => c.crop_name) || [])];
  
  // Use farmer's crops prices if they have crops, otherwise show all prices
  const { data: farmerPrices, isLoading: farmerLoading, refetch: refetchFarmer, isFetching: isFetchingFarmer } = useMarketPrices(cropNames);
  const { data: allPrices, isLoading: allLoading, refetch: refetchAll, isFetching: isFetchingAll } = useAllMarketPrices();
  
  const hasCrops = cropNames.length > 0;
  const prices = hasCrops ? farmerPrices : allPrices;
  const isLoading = hasCrops ? farmerLoading : allLoading;
  const isFetching = hasCrops ? isFetchingFarmer : isFetchingAll;
  const refetch = hasCrops ? refetchFarmer : refetchAll;

  // Group prices by crop name and get latest
  const latestPrices = prices?.reduce((acc, price) => {
    if (!acc[price.crop_name] || new Date(price.date) > new Date(acc[price.crop_name].date)) {
      acc[price.crop_name] = price;
    }
    return acc;
  }, {} as Record<string, typeof prices[0]>);

  const pricesList = Object.values(latestPrices || {}).slice(0, 6);

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
            Market Prices
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {hasCrops ? 'Prices for your crops' : 'Today\'s market rates'}
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
        {pricesList.length === 0 ? (
          <div className="text-center py-8">
            <IndianRupee className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">
              No price data available
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pricesList.map((price) => (
              <div
                key={price.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md ${getTrendColor(price.trend_direction)}`}>
                    {getTrendIcon(price.trend_direction)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{price.crop_name}</p>
                    <p className="text-xs text-muted-foreground">{price.market_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground flex items-center gap-0.5">
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketPricesWidget;
