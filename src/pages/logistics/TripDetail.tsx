import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Phone, 
  User, 
  Package,
  ExternalLink,
  Play,
  CheckCircle2,
  Truck
} from 'lucide-react';
import { useActiveTrips, useCompletedTrips, useUpdateTripStatus, TransportRequest } from '@/hooks/useLogisticsDashboard';
import { format, parseISO } from 'date-fns';

const statusColors: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-800',
  assigned: 'bg-blue-100 text-blue-800',
  en_route: 'bg-purple-100 text-purple-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  requested: 'Requested',
  assigned: 'Assigned',
  en_route: 'En Route',
  picked_up: 'Picked Up',
  delivered: 'Delivered',
};

const TripDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: activeTrips, isLoading: activeLoading } = useActiveTrips();
  const { data: completedTrips, isLoading: completedLoading } = useCompletedTrips();
  const updateStatus = useUpdateTripStatus();

  const isLoading = activeLoading || completedLoading;
  const trip = [...(activeTrips || []), ...(completedTrips || [])].find(t => t.id === id);

  const openGoogleMaps = (location: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
  };

  const handleStatusUpdate = (newStatus: TransportRequest['status']) => {
    if (trip) {
      updateStatus.mutate({ requestId: trip.id, status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-4 md:p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground">Trip not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Trip Details</h1>
        </div>
        <Badge className={statusColors[trip.status]} >
          {statusLabels[trip.status]}
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Main Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Load Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Crop</p>
                <p className="font-medium text-lg">{trip.crop?.crop_name || 'Unknown'}</p>
                {trip.crop?.variety && (
                  <p className="text-sm text-muted-foreground">{trip.crop.variety}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantity</p>
                <p className="font-medium text-lg">{trip.quantity} {trip.quantity_unit || 'quintals'}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-start gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Pickup Location</p>
                  <p className="font-medium">{trip.pickup_village || trip.pickup_location}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => openGoogleMaps(trip.pickup_village || trip.pickup_location)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Google Maps
              </Button>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Preferred Date & Time</p>
                <p className="font-medium">
                  {trip.preferred_date 
                    ? format(parseISO(trip.preferred_date), 'MMMM d, yyyy')
                    : 'Flexible'}
                  {trip.preferred_time && ` at ${trip.preferred_time}`}
                </p>
              </div>
            </div>

            {trip.distance_km && (
              <div>
                <p className="text-sm text-muted-foreground">Distance</p>
                <p className="font-medium">{trip.distance_km} km</p>
              </div>
            )}

            {trip.notes && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{trip.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Farmer Info & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Farmer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium text-lg">{trip.farmer?.full_name || 'Unknown'}</p>
              </div>
              
              {trip.farmer?.village && (
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {trip.farmer.village}
                    {trip.farmer.district && `, ${trip.farmer.district}`}
                  </p>
                </div>
              )}

              {trip.farmer?.phone && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(`tel:${trip.farmer?.phone}`)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call {trip.farmer.phone}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Status Actions */}
          {trip.status !== 'delivered' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Update Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trip.status === 'assigned' && (
                  <Button 
                    className="w-full" 
                    onClick={() => handleStatusUpdate('en_route')}
                    disabled={updateStatus.isPending}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Trip
                  </Button>
                )}
                
                {trip.status === 'en_route' && (
                  <Button 
                    className="w-full" 
                    onClick={() => handleStatusUpdate('picked_up')}
                    disabled={updateStatus.isPending}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Pickup Complete
                  </Button>
                )}
                
                {trip.status === 'picked_up' && (
                  <Button 
                    className="w-full" 
                    onClick={() => handleStatusUpdate('delivered')}
                    disabled={updateStatus.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Delivered
                  </Button>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Photo upload feature coming soon
                </p>
              </CardContent>
            </Card>
          )}

          {trip.status === 'delivered' && trip.completed_at && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="py-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="font-medium text-green-800">Delivered Successfully</p>
                <p className="text-sm text-green-600">
                  {format(parseISO(trip.completed_at), 'MMMM d, yyyy h:mm a')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripDetail;
