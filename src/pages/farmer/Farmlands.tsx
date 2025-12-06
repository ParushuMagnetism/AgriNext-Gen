import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useFarmlands } from '@/hooks/useFarmerDashboard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, LandPlot, MapPin, Layers, Edit, Trash2 } from 'lucide-react';

const FarmlandsPage = () => {
  const { data: farmlands, isLoading } = useFarmlands();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    area_unit: 'acres',
    soil_type: '',
    village: '',
    district: '',
  });

  const filteredFarmlands = farmlands?.filter(land =>
    land.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    land.village?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const { error } = await supabase.from('farmlands').insert({
        farmer_id: user.id,
        name: formData.name,
        area: parseFloat(formData.area),
        area_unit: formData.area_unit,
        soil_type: formData.soil_type || null,
        village: formData.village || null,
        district: formData.district || null,
      });

      if (error) throw error;

      toast({ title: 'Farmland added successfully' });
      setIsDialogOpen(false);
      setFormData({ name: '', area: '', area_unit: 'acres', soil_type: '', village: '', district: '' });
      queryClient.invalidateQueries({ queryKey: ['farmlands', user.id] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('farmlands').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Farmland deleted' });
      queryClient.invalidateQueries({ queryKey: ['farmlands', user?.id] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const totalArea = farmlands?.reduce((sum, l) => sum + l.area, 0) || 0;

  return (
    <DashboardLayout title="Farmlands">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <LandPlot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{farmlands?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Plots</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalArea}</p>
                  <p className="text-xs text-muted-foreground">Total Acres</p>
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
              placeholder="Search farmlands..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Farmland
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Farmland</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Name / Plot ID *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., North Field, Plot #12"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Area *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      placeholder="e.g., 5"
                      required
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select value={formData.area_unit} onValueChange={(v) => setFormData({ ...formData, area_unit: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="acres">Acres</SelectItem>
                        <SelectItem value="hectares">Hectares</SelectItem>
                        <SelectItem value="bigha">Bigha</SelectItem>
                        <SelectItem value="guntha">Guntha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Soil Type</Label>
                  <Select value={formData.soil_type} onValueChange={(v) => setFormData({ ...formData, soil_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select soil type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alluvial">Alluvial</SelectItem>
                      <SelectItem value="black">Black (Regur)</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="laterite">Laterite</SelectItem>
                      <SelectItem value="sandy">Sandy</SelectItem>
                      <SelectItem value="clay">Clay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Village</Label>
                    <Input
                      value={formData.village}
                      onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                      placeholder="Village name"
                    />
                  </div>
                  <div>
                    <Label>District</Label>
                    <Input
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      placeholder="District name"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Add Farmland</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Farmlands Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : filteredFarmlands?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <LandPlot className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No farmlands added yet</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Add Your First Farmland
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFarmlands?.map((land) => (
              <Card key={land.id} className="hover:shadow-medium transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                        <LandPlot className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{land.name}</h3>
                        <p className="text-sm text-muted-foreground">{land.area} {land.area_unit}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    {land.village && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{land.village}{land.district ? `, ${land.district}` : ''}</span>
                      </div>
                    )}
                    {land.soil_type && (
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        <span className="capitalize">{land.soil_type} soil</span>
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
                      onClick={() => handleDelete(land.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FarmlandsPage;
