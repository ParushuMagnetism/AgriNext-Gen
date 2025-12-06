import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useCrops, useFarmlands } from '@/hooks/useFarmerDashboard';
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
import { Plus, Search, Sprout, Calendar, MapPin, Scale, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  growing: { label: 'Growing', color: 'bg-muted text-muted-foreground' },
  one_week: { label: '1 Week', color: 'bg-amber-100 text-amber-800' },
  ready: { label: 'Ready', color: 'bg-emerald-100 text-emerald-800' },
  harvested: { label: 'Harvested', color: 'bg-primary/10 text-primary' },
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

  const filteredCrops = crops?.filter(crop =>
    crop.crop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    crop.variety?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                      <Badge className={status.color}>{status.label}</Badge>
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
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
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
    </DashboardLayout>
  );
};

export default CropsPage;
