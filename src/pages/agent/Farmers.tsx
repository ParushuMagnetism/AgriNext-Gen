import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAllFarmers, useAllCrops, useUpdateCropStatus } from '@/hooks/useAgentDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Sprout, 
  MapPin, 
  Phone,
  Calendar,
  Search,
  Edit
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  growing: 'bg-gray-100 text-gray-800',
  one_week: 'bg-amber-100 text-amber-800',
  ready: 'bg-green-100 text-green-800',
  harvested: 'bg-blue-100 text-blue-800',
};

const AgentFarmers = () => {
  const { data: farmers, isLoading: farmersLoading } = useAllFarmers();
  const { data: crops, isLoading: cropsLoading } = useAllCrops();
  const updateCropStatus = useUpdateCropStatus();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newQuantity, setNewQuantity] = useState('');

  const filteredFarmers = farmers?.filter((f) =>
    f.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.district?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCrops = crops?.filter((c) =>
    c.crop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c as any).farmer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c as any).farmer?.village?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCropCount = (farmerId: string) => {
    return crops?.filter(c => c.farmer_id === farmerId).length || 0;
  };

  const handleUpdateCrop = () => {
    if (!selectedCrop || !newStatus) {
      toast.error('Please select a status');
      return;
    }
    
    updateCropStatus.mutate({
      cropId: selectedCrop.id,
      status: newStatus,
      quantity: newQuantity ? parseFloat(newQuantity) : undefined,
    }, {
      onSuccess: () => {
        setSelectedCrop(null);
        setNewStatus('');
        setNewQuantity('');
      },
    });
  };

  return (
    <DashboardLayout title="Farmers & Crops">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Farmers & Crops
          </h1>
          <p className="text-muted-foreground">View and manage farmer data</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search farmers or crops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="farmers">
          <TabsList>
            <TabsTrigger value="farmers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Farmers
            </TabsTrigger>
            <TabsTrigger value="crops" className="flex items-center gap-2">
              <Sprout className="h-4 w-4" />
              Crops
            </TabsTrigger>
          </TabsList>

          {/* Farmers Tab */}
          <TabsContent value="farmers">
            <Card>
              <CardContent className="p-0">
                {farmersLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Village</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Active Crops</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFarmers?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground">No farmers found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFarmers?.map((farmer) => (
                          <TableRow key={farmer.id}>
                            <TableCell className="font-medium">
                              {farmer.full_name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {farmer.village || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell>{farmer.district || 'N/A'}</TableCell>
                            <TableCell>
                              {farmer.phone ? (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {farmer.phone}
                                </span>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {getCropCount(farmer.id)} crops
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Crops Tab */}
          <TabsContent value="crops">
            <Card>
              <CardContent className="p-0">
                {cropsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Crop Name</TableHead>
                        <TableHead>Farmer</TableHead>
                        <TableHead>Village</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Harvest Date</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCrops?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12">
                            <Sprout className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground">No crops found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCrops?.map((crop) => (
                          <TableRow key={crop.id}>
                            <TableCell className="font-medium">{crop.crop_name}</TableCell>
                            <TableCell>{(crop as any).farmer?.full_name || 'Unknown'}</TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {(crop as any).farmer?.village || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[crop.status]}>
                                {crop.status === 'one_week' ? '1 Week' : crop.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {crop.harvest_estimate ? (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(parseISO(crop.harvest_estimate), 'MMM d')}
                                </span>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              {crop.estimated_quantity ? (
                                `${crop.estimated_quantity} ${crop.quantity_unit || 'quintals'}`
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedCrop(crop);
                                  setNewStatus(crop.status);
                                  setNewQuantity(crop.estimated_quantity?.toString() || '');
                                }}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Update
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Update Crop Dialog */}
        <Dialog open={!!selectedCrop} onOpenChange={() => setSelectedCrop(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Crop Status</DialogTitle>
              <DialogDescription>
                Update the status for {selectedCrop?.crop_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="growing">Growing</SelectItem>
                    <SelectItem value="one_week">1 Week to Harvest</SelectItem>
                    <SelectItem value="ready">Ready to Harvest</SelectItem>
                    <SelectItem value="harvested">Harvested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Estimated Quantity (Optional)</Label>
                <Input
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
              </div>
              
              <Button 
                onClick={handleUpdateCrop}
                disabled={updateCropStatus.isPending}
                className="w-full"
              >
                {updateCropStatus.isPending ? 'Updating...' : 'Update Crop'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AgentFarmers;
