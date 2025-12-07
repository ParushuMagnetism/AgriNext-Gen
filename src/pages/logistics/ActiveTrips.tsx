import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Truck, 
  MapPin, 
  Calendar, 
  Phone,
  Play,
  Package,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useActiveTrips, useUpdateTripStatus, TransportRequest } from '@/hooks/useLogisticsDashboard';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const statusColors: Record<string, string> = {
  assigned: 'bg-blue-100 text-blue-800',
  en_route: 'bg-purple-100 text-purple-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
};

const statusLabels: Record<string, string> = {
  assigned: 'Assigned',
  en_route: 'En Route',
  picked_up: 'Picked Up',
};

const ActiveTrips = () => {
  const navigate = useNavigate();
  const { data: trips, isLoading } = useActiveTrips();
  const updateStatus = useUpdateTripStatus();
  
  const [selectedTrip, setSelectedTrip] = useState<TransportRequest | null>(null);
  const [isPickupDialogOpen, setIsPickupDialogOpen] = useState(false);
  const [pickupWeight, setPickupWeight] = useState('');

  const handleStartTrip = (trip: TransportRequest) => {
    updateStatus.mutate({ requestId: trip.id, status: 'en_route' });
  };

  const handlePickupComplete = (trip: TransportRequest) => {
    setSelectedTrip(trip);
    setIsPickupDialogOpen(true);
  };

  const handleConfirmPickup = () => {
    if (selectedTrip) {
      updateStatus.mutate(
        { requestId: selectedTrip.id, status: 'picked_up' },
        {
          onSuccess: () => {
            setIsPickupDialogOpen(false);
            setSelectedTrip(null);
            setPickupWeight('');
          },
        }
      );
    }
  };

  const handleMarkDelivered = (trip: TransportRequest) => {
    updateStatus.mutate({ requestId: trip.id, status: 'delivered' });
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'assigned':
        return { label: 'Start Trip', action: handleStartTrip, icon: Play };
      case 'en_route':
        return { label: 'Pickup Complete', action: handlePickupComplete, icon: Package };
      case 'picked_up':
        return { label: 'Mark Delivered', action: handleMarkDelivered, icon: CheckCircle2 };
      default:
        return null;
    }
  };

  const openGoogleMaps = (location: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Active Trips</h1>
        <p className="text-muted-foreground">
          {trips?.length || 0} trips in progress
        </p>
      </div>

      {/* Trips List */}
      {!trips || trips.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Truck className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No active trips</p>
              <p className="text-sm mb-4">Accept some loads to start transporting</p>
              <Button onClick={() => navigate('/logistics/loads')}>
                Browse Available Loads
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => {
            const nextAction = getNextAction(trip.status);
            
            return (
              <Card key={trip.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Trip Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          {trip.crop?.crop_name || 'Unknown Crop'}
                          {trip.crop?.variety && (
                            <span className="text-muted-foreground font-normal ml-2">
                              ({trip.crop.variety})
                            </span>
                          )}
                        </h3>
                        <Badge className={statusColors[trip.status]}>
                          {statusLabels[trip.status]}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Farmer</p>
                          <p className="font-medium">{trip.farmer?.full_name || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium">{trip.quantity} {trip.quantity_unit || 'quintals'}</p>
                        </div>
                        <div className="flex items-start gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-muted-foreground">Pickup Location</p>
                            <p className="font-medium">{trip.pickup_village || trip.pickup_location}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-muted-foreground">Preferred Date</p>
                            <p className="font-medium">
                              {trip.preferred_date 
                                ? format(parseISO(trip.preferred_date), 'MMM d, yyyy')
                                : 'Flexible'}
                              {trip.preferred_time && ` @ ${trip.preferred_time}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {trip.notes && (
                        <div className="p-2 bg-muted/50 rounded text-sm">
                          <p className="text-muted-foreground">Notes: {trip.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 min-w-[180px]">
                      {nextAction && (
                        <Button 
                          onClick={() => nextAction.action(trip)}
                          disabled={updateStatus.isPending}
                          className="w-full"
                        >
                          <nextAction.icon className="h-4 w-4 mr-2" />
                          {nextAction.label}
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openGoogleMaps(trip.pickup_village || trip.pickup_location)}
                        className="w-full"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in Maps
                      </Button>

                      {trip.farmer?.phone && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`tel:${trip.farmer?.phone}`)}
                          className="w-full"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call Farmer
                        </Button>
                      )}

                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/logistics/trip/${trip.id}`)}
                        className="w-full"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pickup Confirmation Dialog */}
      <Dialog open={isPickupDialogOpen} onOpenChange={setIsPickupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Pickup</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              Confirm that you have picked up the load from the farmer.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="weight">Actual Weight (optional)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="Enter actual weight in quintals"
                value={pickupWeight}
                onChange={(e) => setPickupWeight(e.target.value)}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Note: Photo upload feature coming soon. For now, take photos manually for records.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPickupDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPickup} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? 'Confirming...' : 'Confirm Pickup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveTrips;
