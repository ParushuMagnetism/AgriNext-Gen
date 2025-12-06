import { useCrops } from '@/hooks/useFarmerDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Wheat, TrendingUp } from 'lucide-react';
import { format, addDays, isWithinInterval } from 'date-fns';

const HarvestTimeline = () => {
  const { data: crops, isLoading } = useCrops();

  const today = new Date();
  const twoWeeksLater = addDays(today, 14);

  const upcomingHarvests = crops?.filter((crop) => {
    if (!crop.harvest_estimate || crop.status === 'harvested') return false;
    const harvestDate = new Date(crop.harvest_estimate);
    return isWithinInterval(harvestDate, { start: today, end: twoWeeksLater });
  }).sort((a, b) => {
    return new Date(a.harvest_estimate!).getTime() - new Date(b.harvest_estimate!).getTime();
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Harvests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Harvests
          <span className="text-sm font-normal text-muted-foreground ml-2">
            (Next 14 days)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingHarvests.length === 0 ? (
          <div className="text-center py-8">
            <Wheat className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">No harvests in the next 2 weeks</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingHarvests.map((crop, index) => {
              const harvestDate = new Date(crop.harvest_estimate!);
              const daysUntil = Math.ceil((harvestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div
                  key={crop.id}
                  className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  {/* Timeline dot */}
                  <div className="relative">
                    <div className={`w-3 h-3 rounded-full ${
                      daysUntil <= 3 ? 'bg-emerald-500' : daysUntil <= 7 ? 'bg-amber-500' : 'bg-muted-foreground'
                    }`} />
                    {index < upcomingHarvests.length - 1 && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-border" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Wheat className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground truncate">{crop.crop_name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>{format(harvestDate, 'MMM d, yyyy')}</span>
                      {crop.farmland && (
                        <>
                          <span>•</span>
                          <span className="truncate">{crop.farmland.village || crop.farmland.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Days badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    daysUntil <= 3 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : daysUntil <= 7 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                  </div>

                  {/* Action hint */}
                  <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>Monitor price</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HarvestTimeline;
