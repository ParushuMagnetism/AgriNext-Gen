import { useFarmlands } from '@/hooks/useFarmerDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LandPlot, MapPin, Layers, Plus, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FarmlandsSummary = () => {
  const { data: farmlands, isLoading } = useFarmlands();
  const navigate = useNavigate();

  const totalArea = farmlands?.reduce((sum, l) => sum + l.area, 0) || 0;
  const displayedFarmlands = farmlands?.slice(0, 4) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LandPlot className="h-5 w-5 text-primary" />
            My Farmlands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
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
            <LandPlot className="h-5 w-5 text-primary" />
            My Farmlands
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {farmlands?.length || 0} plots • {totalArea.toFixed(1)} acres total
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/farmer/farmlands')}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </CardHeader>
      <CardContent>
        {displayedFarmlands.length === 0 ? (
          <div className="text-center py-8">
            <LandPlot className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">No farmlands added yet</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              size="sm"
              onClick={() => navigate('/farmer/farmlands')}
            >
              Add Your First Farmland
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayedFarmlands.map((land) => (
                <div
                  key={land.id}
                  className="bg-muted/30 border border-border/50 rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/farmer/farmlands')}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                      <LandPlot className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{land.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {land.area} {land.area_unit}
                        </Badge>
                        {land.soil_type && (
                          <span className="capitalize">{land.soil_type}</span>
                        )}
                      </div>
                      {land.village && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{land.village}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {farmlands && farmlands.length > 4 && (
              <Button 
                variant="ghost" 
                className="w-full mt-3 text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/farmer/farmlands')}
              >
                View all farmlands ({farmlands.length})
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FarmlandsSummary;