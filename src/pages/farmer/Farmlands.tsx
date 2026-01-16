import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useFarmlands, Farmland } from '@/hooks/useFarmerDashboard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, LandPlot, MapPin, Layers, Edit, Trash2, TreeDeciduous, TestTube2 } from 'lucide-react';
import EditFarmlandDialog from '@/components/farmer/EditFarmlandDialog';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import EmptyState from '@/components/farmer/EmptyState';
import HelpTooltip from '@/components/farmer/HelpTooltip';
import FarmlandSoilReportsPanel from '@/components/farmer/soil-reports/FarmlandSoilReportsPanel';

const FarmlandsPage = () => {
  const { data: farmlands, isLoading } = useFarmlands();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFarmland, setEditingFarmland] = useState<Farmland | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingFarmland, setDeletingFarmland] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [soilReportsFarmland, setSoilReportsFarmland] = useState<Farmland | null>(null);
  const [soilReportsPanelOpen, setSoilReportsPanelOpen] = useState(false);
  
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

      toast({ title: 'Success!', description: 'Farmland added successfully.' });
      setIsDialogOpen(false);
      setFormData({ name: '', area: '', area_unit: 'acres', soil_type: '', village: '', district: '' });
      queryClient.invalidateQueries({ queryKey: ['farmlands', user.id] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeletingFarmland({ id, name });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFarmland) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('farmlands').delete().eq('id', deletingFarmland.id);
      if (error) throw error;
      toast({ title: 'Farmland deleted', description: `${deletingFarmland.name} has been removed.` });
      queryClient.invalidateQueries({ queryKey: ['farmlands', user?.id] });
      setDeleteConfirmOpen(false);
      setDeletingFarmland(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const totalArea = farmlands?.reduce((sum, l) => sum + l.area, 0) || 0;

  const soilDistribution = farmlands?.reduce((acc, land) => {
    const soil = land.soil_type || 'unknown';
    acc[soil] = (acc[soil] || 0) + land.area;
    return acc;
  }, {} as Record<string, number>);

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
                  <p className="text-2xl font-bold">{totalArea.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Total Acres</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                  <TreeDeciduous className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Object.keys(soilDistribution || {}).filter(k => k !== 'unknown').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Soil Types</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(farmlands?.map(l => l.village).filter(Boolean)).size}
                  </p>
                  <p className="text-xs text-muted-foreground">Villages</p>
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
              placeholder="Search by name or village..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Farmland
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Farmland</DialogTitle>
                <DialogDescription>
                  Register a new farmland plot. Fields marked with * are required.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="flex items-center">
                    Name / Plot ID *
                    <HelpTooltip content="Give your farmland a name or use the survey number for easy identification" />
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., North Field, Survey #12"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center">
                      Area *
                      <HelpTooltip content="The total area of this farmland" />
                    </Label>
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
                  <Label className="flex items-center">
                    Soil Type
                    <HelpTooltip content="Knowing your soil type helps with crop recommendations" />
                  </Label>
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
                <Button type="submit" className="w-full" size="lg">Add Farmland</Button>
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
            <CardContent className="p-0">
              <EmptyState
                icon={LandPlot}
                title={searchQuery ? "No farmlands found" : "No farmlands added yet"}
                description={
                  searchQuery 
                    ? "Try adjusting your search to find what you're looking for."
                    : "Add your farmlands to track crops, manage harvests, and get better insights."
                }
                actionLabel={searchQuery ? "Clear Search" : "Add Your First Farmland"}
                onAction={() => {
                  if (searchQuery) {
                    setSearchQuery('');
                  } else {
                    setIsDialogOpen(true);
                  }
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredFarmlands?.map((land) => (
              <Card key={land.id} className="hover:shadow-medium transition-all group">
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
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{land.village}{land.district ? `, ${land.district}` : ''}</span>
                      </div>
                    )}
                    {land.soil_type && (
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 shrink-0" />
                        <span className="capitalize">{land.soil_type} soil</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setSoilReportsFarmland(land);
                        setSoilReportsPanelOpen(true);
                      }}
                    >
                      <TestTube2 className="h-4 w-4 mr-1" />
                      Soil Reports
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingFarmland(land);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(land.id, land.name)}
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

      <EditFarmlandDialog
        farmland={editingFarmland}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <FarmlandSoilReportsPanel
        farmland={soilReportsFarmland}
        open={soilReportsPanelOpen}
        onOpenChange={setSoilReportsPanelOpen}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Farmland"
        description={`Are you sure you want to delete "${deletingFarmland?.name}"? Any crops associated with this farmland will lose their location reference.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </DashboardLayout>
  );
};

export default FarmlandsPage;
