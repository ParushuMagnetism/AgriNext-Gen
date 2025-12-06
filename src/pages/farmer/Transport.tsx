import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useTransportRequests, useCrops } from '@/hooks/useFarmerDashboard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Truck, MapPin, Calendar, Package, Clock } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  requested: { label: 'Requested', color: 'bg-blue-100 text-blue-800' },
  assigned: { label: 'Assigned', color: 'bg-purple-100 text-purple-800' },
  en_route: { label: 'En Route', color: 'bg-amber-100 text-amber-800' },
  picked_up: { label: 'Picked Up', color: 'bg-emerald-100 text-emerald-800' },
  delivered: { label: 'Delivered', color: 'bg-primary/10 text-primary' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive' },
};

const TransportPage = () => {
  const { data: requests, isLoading } = useTransportRequests();
  const { data: crops } = useCrops();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    crop_id: '',
    quantity: '',
    quantity_unit: 'quintals',
    pickup_location: '',
    pickup_village: '',
    preferred_date: '',
    preferred_time: '',
    notes: '',
  });

  const filteredRequests = requests?.filter(req => 
    statusFilter === 'all' || req.status === statusFilter
  );

  const activeCount = requests?.filter(r => !['delivered', 'cancelled'].includes(r.status)).length || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const { error } = await supabase.from('transport_requests').insert({
        farmer_id: user.id,
        crop_id: formData.crop_id || null,
        quantity: parseFloat(formData.quantity),
        quantity_unit: formData.quantity_unit,
        pickup_location: formData.pickup_location,
        pickup_village: formData.pickup_village || null,
        preferred_date: formData.preferred_date || null,
        preferred_time: formData.preferred_time || null,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast({ title: 'Transport request created' });
      setIsDialogOpen(false);
      setFormData({
        crop_id: '',
        quantity: '',
        quantity_unit: 'quintals',
        pickup_location: '',
        pickup_village: '',
        preferred_date: '',
        preferred_time: '',
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ['transport-requests', user.id] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transport_requests')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Request cancelled' });
      queryClient.invalidateQueries({ queryKey: ['transport-requests', user?.id] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout title="Transport Requests">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-xs text-muted-foreground">Active Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {requests?.filter(r => r.status === 'delivered').length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-wrap">
            {['all', 'requested', 'assigned', 'en_route', 'picked_up', 'delivered'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="capitalize"
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </Button>
            ))}
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Transport</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Crop</Label>
                  <Select value={formData.crop_id} onValueChange={(v) => setFormData({ ...formData, crop_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {crops?.filter(c => c.status !== 'harvested').map((crop) => (
                        <SelectItem key={crop.id} value={crop.id}>
                          {crop.crop_name} {crop.variety && `(${crop.variety})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="e.g., 50"
                      required
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select value={formData.quantity_unit} onValueChange={(v) => setFormData({ ...formData, quantity_unit: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quintals">Quintals</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="tonnes">Tonnes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Pickup Location *</Label>
                  <Input
                    value={formData.pickup_location}
                    onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                    placeholder="Full address for pickup"
                    required
                  />
                </div>
                <div>
                  <Label>Village</Label>
                  <Input
                    value={formData.pickup_village}
                    onChange={(e) => setFormData({ ...formData, pickup_village: e.target.value })}
                    placeholder="Village name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Preferred Date</Label>
                    <Input
                      type="date"
                      value={formData.preferred_date}
                      onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Preferred Time</Label>
                    <Input
                      value={formData.preferred_time}
                      onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                      placeholder="e.g., Morning, 9 AM"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Submit Request</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : filteredRequests?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No transport requests found</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Create Your First Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests?.map((request) => {
              const status = statusConfig[request.status];
              return (
                <Card key={request.id} className="hover:shadow-medium transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="h-5 w-5 text-primary" />
                          <span className="font-semibold">
                            {request.crop?.crop_name || 'General Produce'}
                          </span>
                          <span className="text-muted-foreground">
                            • {request.quantity} {request.quantity_unit}
                          </span>
                          <Badge className={status.color}>{status.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{request.pickup_village || request.pickup_location}</span>
                          </div>
                          {request.preferred_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{format(new Date(request.preferred_date), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          {request.preferred_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{request.preferred_time}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {request.status === 'requested' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleCancel(request.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TransportPage;
