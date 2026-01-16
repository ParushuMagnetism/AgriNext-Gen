import { useCrops, useFarmerProfile } from '@/hooks/useFarmerDashboard';
import { 
  useMarketPricesTiered, 
  usePriceForecasts, 
  useDistrictNeighbors,
  useNeighborPrices,
  type MarketPriceAgg 
} from '@/hooks/useMarketData';
import { useIsDistrictValid } from '@/hooks/useKarnatakaDistricts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  IndianRupee, 
  RefreshCw, 
  Clock, 
  MapPin, 
  AlertCircle, 
  Info,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { t } from '@/i18n';

const MarketPricesWidget = () => {
  const { data: profile, isLoading: profileLoading } = useFarmerProfile();
  const { data: crops } = useCrops();
  const cropNames = [...new Set(crops?.map(c => c.crop_name) || [])];
  
  // Check if farmer has a valid Karnataka district
  const hasValidDistrict = useIsDistrictValid(profile?.district);
  
  // Use 3-tier fallback system
  const { 
    data: pricesData, 
    isLoading: pricesLoading, 
    refetch, 
    isFetching,
    error: pricesError 
  } = useMarketPricesTiered(
    hasValidDistrict ? profile?.district : null,
    cropNames
  );

  const { data: forecasts } = usePriceForecasts(cropNames);
  
  // Get neighbor districts
  const { data: neighborDistricts = [] } = useDistrictNeighbors(
    hasValidDistrict ? profile?.district : null
  );
  
  // Get neighbor prices for comparison
  const { data: neighborPrices = {} } = useNeighborPrices(neighborDistricts, cropNames);
  
  const isLoading = profileLoading || pricesLoading;
  const pricesList = pricesData?.data || [];
  const tier = pricesData?.tier || 'C';
  const tierLabel = pricesData?.label || 'Market Prices';

  // Get forecast for a crop
  const getForecast = (cropName: string) => {
    return forecasts?.find(f => f.crop_name === cropName);
  };

  // Check if data is stale (>48 hours)
  const isDataStale = (fetchedAt: string | null): boolean => {
    if (!fetchedAt) return true;
    return differenceInHours(new Date(), new Date(fetchedAt)) > 48;
  };

  // Get neighbor comparison for a crop
  const getNeighborComparison = (cropName: string, myPrice: number | null) => {
    const neighborPrice = neighborPrices[cropName];
    if (!neighborPrice || !neighborPrice.modal_price || !myPrice) return null;
    
    const delta = neighborPrice.modal_price - myPrice;
    const percentDelta = ((delta / myPrice) * 100).toFixed(1);
    
    return {
      district: neighborPrice.district,
      price: neighborPrice.modal_price,
      delta,
      percentDelta,
      isBetter: delta > 0,
    };
  };

  const getConfidenceBadge = (confidence: string | null) => {
    if (!confidence) return null;
    
    const styles = {
      high: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
      medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
      low: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
    };
    
    return (
      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${styles[confidence as keyof typeof styles] || styles.low}`}>
        {confidence}
      </Badge>
    );
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
        const fetchedAt = price.fetched_at || new Date().toISOString();
        return new Date(fetchedAt) > new Date(latest) ? fetchedAt : latest;
      }, pricesList[0].fetched_at || new Date().toISOString())
    : null;

  const isStale = lastUpdated ? isDataStale(lastUpdated) : false;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-primary" />
            {t('farmer.market.title')}
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
            {t('farmer.market.title')}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {tierLabel}
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
        {/* Stale data warning */}
        {isStale && pricesList.length > 0 && (
          <Alert className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
              {t('farmer.market.staleData')}
            </AlertDescription>
          </Alert>
        )}

        {/* Show Tier C banner - district not set */}
        {tier === 'C' && !hasValidDistrict && (
          <Alert className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <MapPin className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
              {t('farmer.market.setDistrict')}
            </AlertDescription>
          </Alert>
        )}

        {/* Show Tier B info - no crops yet */}
        {tier === 'B' && cropNames.length === 0 && (
          <Alert className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
              {t('farmer.market.addCrops')}
            </AlertDescription>
          </Alert>
        )}

        {/* Error state with retry */}
        {pricesError && (
          <div className="text-center py-8">
            <AlertCircle className="h-10 w-10 mx-auto text-destructive/50 mb-3" />
            <p className="text-muted-foreground text-sm mb-3">
              {t('common.error')}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.retry')}
            </Button>
          </div>
        )}
        
        {!pricesError && pricesList.length === 0 ? (
          <div className="text-center py-8">
            <IndianRupee className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">
              {t('farmer.market.noData')}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {t('farmer.market.syncPending')}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.refresh')}
            </Button>
          </div>
        ) : !pricesError && (
          <div className="space-y-2">
            {pricesList.map((price) => {
              const forecast = getForecast(price.crop_name);
              const neighborComp = getNeighborComparison(price.crop_name, price.modal_price);
              const isPriceStale = isDataStale(price.fetched_at);
              
              return (
                <div
                  key={price.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    isPriceStale 
                      ? 'bg-muted/20 border-dashed border-muted-foreground/30' 
                      : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-1.5 rounded-md shrink-0 bg-primary/10 text-primary">
                        <IndianRupee className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground truncate">{price.crop_name}</p>
                          {getForecastBadge(forecast)}
                          {getConfidenceBadge(price.confidence)}
                          {isPriceStale && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">
                              stale
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{price.district}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-foreground flex items-center gap-0.5 justify-end">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {price.modal_price?.toLocaleString('en-IN') || 'N/A'}
                        <span className="text-xs text-muted-foreground font-normal">/{price.unit || 'qtl'}</span>
                      </p>
                      {price.sources_count && price.sources_count > 1 && (
                        <p className="text-xs text-muted-foreground">
                          {price.sources_count} sources
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Neighbor comparison */}
                  {neighborComp && (
                    <div className={`mt-2 pt-2 border-t border-border/30 flex items-center gap-2 text-xs ${
                      neighborComp.isBetter ? 'text-emerald-600' : 'text-muted-foreground'
                    }`}>
                      {neighborComp.isBetter ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      <span>
                        {neighborComp.district}: ₹{neighborComp.price.toLocaleString('en-IN')}
                        <span className={neighborComp.isBetter ? 'text-emerald-600 font-medium' : ''}>
                          {' '}({neighborComp.isBetter ? '+' : ''}{neighborComp.percentDelta}%)
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Forecast summary */}
            {forecasts && forecasts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">{t('farmer.market.forecast')}</p>
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
              <div className={`flex items-center gap-1 mt-3 pt-2 border-t border-border/30 text-[10px] ${
                isStale ? 'text-amber-600' : 'text-muted-foreground/70'
              }`}>
                <Clock className="h-3 w-3" />
                <span>
                  {t('farmer.market.lastUpdated')} {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
                  {isStale && ' (stale)'}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketPricesWidget;
