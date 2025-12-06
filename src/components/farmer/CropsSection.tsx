import { useCrops } from '@/hooks/useFarmerDashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sprout, Calendar, MapPin, Scale, Edit, Truck, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const statusConfig = {
  growing: { label: 'Growing', color: 'bg-muted text-muted-foreground', dotColor: 'bg-gray-400' },
  one_week: { label: '1 Week to Harvest', color: 'bg-amber-100 text-amber-800', dotColor: 'bg-amber-500' },
  ready: { label: 'Ready to Harvest', color: 'bg-emerald-100 text-emerald-800', dotColor: 'bg-emerald-500' },
  harvested: { label: 'Harvested', color: 'bg-primary/10 text-primary', dotColor: 'bg-primary' },
};

const CropsSection = () => {
  const { data: crops, isLoading } = useCrops();
  const navigate = useNavigate();

  const activeCrops = crops?.filter(c => c.status !== 'harvested') || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-primary" />
            My Crops
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2">
          <Sprout className="h-5 w-5 text-primary" />
          My Crops
        </CardTitle>
        <Button size="sm" onClick={() => navigate('/farmer/crops/new')}>
          <Plus className="h-4 w-4 mr-1" />
          Add Crop
        </Button>
      </CardHeader>
      <CardContent>
        {activeCrops.length === 0 ? (
          <div className="text-center py-12">
            <Sprout className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No active crops yet</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/farmer/crops/new')}>
              Add Your First Crop
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeCrops.map((crop) => {
              const status = statusConfig[crop.status];
              return (
                <div
                  key={crop.id}
                  className="group bg-card border border-border rounded-xl p-4 hover:shadow-medium transition-all duration-300"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{crop.crop_name}</h3>
                      {crop.variety && (
                        <p className="text-sm text-muted-foreground">{crop.variety}</p>
                      )}
                    </div>
                    <Badge className={status.color}>
                      <span className={`w-2 h-2 rounded-full mr-1.5 ${status.dotColor}`} />
                      {status.label}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    {crop.farmland && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{crop.farmland.name} ({crop.farmland.area} {crop.farmland.area_unit})</span>
                      </div>
                    )}
                    {crop.harvest_estimate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Harvest: {format(new Date(crop.harvest_estimate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {crop.estimated_quantity && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Scale className="h-4 w-4" />
                        <span>Est. {crop.estimated_quantity} {crop.quantity_unit}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-border/50">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Update
                    </Button>
                    <Button variant="default" size="sm" className="flex-1">
                      <Truck className="h-4 w-4 mr-1" />
                      Transport
                    </Button>
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

export default CropsSection;
