import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  MapPin,
  ArrowRight,
  RotateCcw,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  useLogisticsDashboardStats, 
  useActiveTrips, 
  useAvailableLoads,
  useTransporterProfile,
  useCreateTransporterProfile
} from '@/hooks/useLogisticsDashboard';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-800',
  assigned: 'bg-blue-100 text-blue-800',
  en_route: 'bg-purple-100 text-purple-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
};

const LogisticsDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, transporter } = useLogisticsDashboardStats();
  const { data: activeTrips, isLoading: tripsLoading } = useActiveTrips();
  const { data: availableLoads, isLoading: loadsLoading } = useAvailableLoads();
  const { data: profile, isLoading: profileLoading } = useTransporterProfile();
  const createProfile = useCreateTransporterProfile();
  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [reverseSuggestion, setReverseSuggestion] = useState<string | null>(null);

  // Create profile if not exists
  const handleCreateProfile = () => {
    createProfile.mutate({
      name: user?.email?.split('@')[0] || 'Transporter',
    });
  };

  // AI Route Optimization
  const handleAIRouteOptimization = async () => {
    if (!availableLoads || availableLoads.length === 0) {
      toast.error('No available loads to optimize');
      return;
    }

    setAiLoading(true);
    try {
      const loads = availableLoads.map(load => ({
        farmer_name: load.farmer?.full_name,
        village: load.pickup_village || load.pickup_location,
        crop_name: load.crop?.crop_name,
        quantity: load.quantity,
        quantity_unit: load.quantity_unit,
        preferred_date: load.preferred_date,
      }));

      const { data, error } = await supabase.functions.invoke('transport-ai', {
        body: { 
          type: 'route_optimization', 
          loads,
          currentLocation: profile?.operating_village || 'Base'
        }
      });

      if (error) throw error;
      setAiSuggestion(data.result);
      toast.success('Route optimization complete!');
    } catch (error) {
      console.error('AI error:', error);
      toast.error('Failed to get AI suggestions');
    } finally {
      setAiLoading(false);
    }
  };

  // AI Reverse Logistics
  const handleReverseLogistics = async () => {
    setReverseLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('transport-ai', {
        body: { 
          type: 'reverse_logistics',
          currentLocation: 'Market/Mandi',
          homeBase: profile?.operating_village || 'Base village',
          loads: []
        }
      });

      if (error) throw error;
      setReverseSuggestion(data.result);
      toast.success('Reverse load suggestions ready!');
    } catch (error) {
      console.error('AI error:', error);
      toast.error('Failed to get reverse load suggestions');
    } finally {
      setReverseLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  // Show profile creation if no profile exists
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Truck className="h-16 w-16 mx-auto text-primary mb-4" />
            <CardTitle>Welcome, Transporter!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Set up your transporter profile to start accepting loads and managing trips.
            </p>
            <Button 
              className="w-full" 
              onClick={handleCreateProfile}
              disabled={createProfile.isPending}
            >
              {createProfile.isPending ? 'Creating...' : 'Create Profile'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transporter Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile.name} • {profile.operating_village || 'Set your location'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/logistics/profile')}>
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/logistics/loads')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Loads</p>
                <p className="text-2xl font-bold text-amber-600">{stats.availableLoads}</p>
              </div>
              <Package className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/logistics/trips')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accepted Trips</p>
                <p className="text-2xl font-bold text-blue-600">{stats.acceptedTrips}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/logistics/trips')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-purple-600">{stats.tripsInProgress}</p>
              </div>
              <Truck className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/logistics/completed')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedTrips}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Trips */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Today's Active Trips
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/logistics/trips')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tripsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : !activeTrips || activeTrips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active trips</p>
                <Button variant="link" onClick={() => navigate('/logistics/loads')}>
                  Browse available loads
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTrips.slice(0, 3).map(trip => (
                  <div 
                    key={trip.id} 
                    className="p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/logistics/trip/${trip.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{trip.crop?.crop_name || 'Unknown Crop'}</span>
                      <Badge className={statusColors[trip.status]}>{trip.status.replace('_', ' ')}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{trip.pickup_village || trip.pickup_location}</span>
                      <span>•</span>
                      <span>{trip.quantity} {trip.quantity_unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Load Requests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                New Load Requests
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/logistics/loads')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : !availableLoads || availableLoads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No new load requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableLoads.slice(0, 3).map(load => (
                  <div 
                    key={load.id} 
                    className="p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{load.farmer?.full_name || 'Unknown Farmer'}</span>
                      <span className="text-sm text-muted-foreground">
                        {load.preferred_date ? format(parseISO(load.preferred_date), 'MMM d') : 'Flexible'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span>{load.crop?.crop_name || 'Crop'}</span>
                      <span>•</span>
                      <span>{load.quantity} {load.quantity_unit}</span>
                      <span>•</span>
                      <MapPin className="h-3 w-3" />
                      <span>{load.pickup_village || load.pickup_location}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions Panel */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Route Optimization */}
            <div className="p-4 rounded-lg border bg-background">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Route Optimization</h4>
                <Button 
                  size="sm" 
                  onClick={handleAIRouteOptimization}
                  disabled={aiLoading || !availableLoads?.length}
                >
                  {aiLoading ? 'Analyzing...' : 'Suggest Best Route'}
                </Button>
              </div>
              {aiSuggestion ? (
                <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {aiSuggestion}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click to get AI-recommended pickup order for maximum efficiency.
                </p>
              )}
            </div>

            {/* Reverse Logistics */}
            <div className="p-4 rounded-lg border bg-background">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reverse Load
                </h4>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleReverseLogistics}
                  disabled={reverseLoading}
                >
                  {reverseLoading ? 'Finding...' : 'Find Return Loads'}
                </Button>
              </div>
              {reverseSuggestion ? (
                <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {reverseSuggestion}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Find cargo for your return trip to maximize earnings.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogisticsDashboard;
