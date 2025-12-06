import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useCrops, useFarmlands, Crop, Farmland } from '@/hooks/useFarmerDashboard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Sprout, Calendar, MapPin, Scale, Edit, Trash2, Truck, Filter } from 'lucide-react';
import { format } from 'date-fns';
import EditCropDialog from '@/components/farmer/EditCropDialog';
import RequestTransportDialog from '@/components/farmer/RequestTransportDialog';

const statusConfig = {
  growing: { label: 'Growing', color: 'bg-muted text-muted-foreground', dotColor: 'bg-gray-400' },
  one_week: { label: '1 Week', color: 'bg-amber-100 text-amber-800', dotColor: 'bg-amber-500' },
  ready: { label: 'Ready', color: 'bg-emerald-100 text-emerald-800', dotColor: 'bg-emerald-500' },
  harvested: { label: 'Harvested', color: 'bg-primary/10 text-primary', dotColor: 'bg-primary' },
};

const CropsPage = () => {
  const { data: crops, isLoading } = useCrops();
  const { data: farmlands } = useFarmlands();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingCrop, setEditingCrop] = useState<(Crop & { farmland: Farmland | null }) | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transportCrop, setTransportCrop] = useState<(Crop & { farmland: Farmland | null }) | null>(null);
  const [transportDialogOpen, setTransportDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    crop_name: '',
    variety: '',
    land_id: '',
    sowing_date: '',
    harvest_estimate: '',
    status: 'growing' as const,
    estimated_quantity: '',
    quantity_unit: 'quintals',
  });

  const filteredCrops = crops?.filter(crop => {
    const matchesSearch = crop.crop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.variety?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || crop.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: crops?.length || 0,
    growing: crops?.filter(c => c.status === 'growing').length || 0,
    oneWeek: crops?.filter(c => c.status === 'one_week').length || 0,
    ready: crops?.filter(c => c.status === 'ready').length || 0,
    harvested: crops?.filter(c => c.status === 'harvested').length || 0,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const { error } = await supabase.from('crops').insert({
        farmer_id: user.id,
        crop_name: formData.crop_name,
        variety: formData.variety || null,
        land_id: formData.land_id || null,
        sowing_date: formData.sowing_date || null,
        harvest_estimate: formData.harvest_estimate || null,
        status: formData.status,
        estimated_quantity: formData.estimated_quantity ? parseFloat(formData.estimated_quantity) : null,
        quantity_unit: formData.quantity_unit,
      });

      if (error) throw error;

      toast({ title: 'Crop added successfully' });
      setIsDialogOpen(false);
      setFormData({
        crop_name: '',
        variety: '',
        land_id: '',
        sowing_date: '',
        harvest_estimate: '',
        status: 'growing',
        estimated_quantity: '',
        quantity_unit: 'quintals',
      });
      queryClient.invalidateQueries({ queryKey: ['crops', user.id] });
    } catch (error: any) {
      toast({ title: 'Error adding crop', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('crops').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Crop deleted' });
      queryClient.invalidateQueries({ queryKey: ['crops', user?.id] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout title="My Crops">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Sprout className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Crops</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'growing' ? 'ring-2 ring-primary' : ''}`} onClick={() => setStatusFilter('growing')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-gray-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.growing}</p>
                  <p className="text-xs text-muted-foreground">Growing</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'one_week' ? 'ring-2 ring-primary' : ''}`} onClick={() => setStatusFilter('one_week')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                  <div className="w-5 h-5 rounded-full bg-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.oneWeek}</p>
                  <p className="text-xs text-muted-foreground">1 Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'ready' ? 'ring-2 ring-primary' : ''}`} onClick={() => setStatusFilter('ready')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                  <div className="w-5 h-5 rounded-full bg-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.ready}</p>
                  <p className="text-xs text-muted-foreground">Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'harvested' ? 'ring-2 ring-primary' : ''}`} onClick={() => setStatusFilter('harvested')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <div className="w-5 h-5 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.harvested}</p>
                  <p className="text-xs text-muted-foreground">Harvested</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search crops..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Crop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Crop</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Crop Name *</Label>
                  <Input
                    value={formData.crop_name}
                    onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                    placeholder="e.g., Rice, Wheat, Tomato"
                    required
                  />
                </div>
                <div>
                  <Label>Variety</Label>
                  <Input
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    placeholder="e.g., Basmati, IR-64"
                  />
                </div>
                <div>
                  <Label>Farmland</Label>
                  <Select value={formData.land_id} onValueChange={(v) => setFormData({ ...formData, land_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select farmland" />
                    </SelectTrigger>
                    <SelectContent>
                      {farmlands?.map((land) => (
                        <SelectItem key={land.id} value={land.id}>
                          {land.name} ({land.area} {land.area_unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sowing Date</Label>
                    <Input
                      type="date"
                      value={formData.sowing_date}
                      onChange={(e) => setFormData({ ...formData, sowing_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Est. Harvest Date</Label>
                    <Input
                      type="date"
                      value={formData.harvest_estimate}
                      onChange={(e) => setFormData({ ...formData, harvest_estimate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Est. Quantity</Label>
                    <Input
                      type="number"
                      value={formData.estimated_quantity}
                      onChange={(e) => setFormData({ ...formData, estimated_quantity: e.target.value })}
                      placeholder="e.g., 50"
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
                <Button type="submit" className="w-full">Add Crop</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Crops Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : filteredCrops?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sprout className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No crops found</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Add Your First Crop
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCrops?.map((crop) => {
              const status = statusConfig[crop.status];
              return (
                <Card key={crop.id} className="hover:shadow-medium transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{crop.crop_name}</h3>
                        {crop.variety && <p className="text-sm text-muted-foreground">{crop.variety}</p>}
                      </div>
                      <Badge className={status.color}>
                        <span className={`w-2 h-2 rounded-full mr-1.5 ${status.dotColor}`} />
                        {status.label}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      {crop.farmland && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{crop.farmland.name}</span>
                        </div>
                      )}
                      {crop.harvest_estimate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Harvest: {format(new Date(crop.harvest_estimate), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {crop.estimated_quantity && (
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4" />
                          <span>{crop.estimated_quantity} {crop.quantity_unit}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                        setEditingCrop(crop);
                        setEditDialogOpen(true);
                      }}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="default" size="sm" className="flex-1" onClick={() => {
                        setTransportCrop(crop);
                        setTransportDialogOpen(true);
                      }}>
                        <Truck className="h-4 w-4 mr-1" />
                        Transport
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(crop.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <EditCropDialog
        crop={editingCrop}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      
      <RequestTransportDialog
        crop={transportCrop}
        open={transportDialogOpen}
        onOpenChange={setTransportDialogOpen}
      />
    </DashboardLayout>
  );
};

export default CropsPage;
