import { useFarmerProfile, useDashboardStats } from '@/hooks/useFarmerDashboard';
import { MapPin, Sprout, Truck, Wheat, LandPlot } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FarmerSummaryCard = () => {
  const { data: profile, isLoading: profileLoading } = useFarmerProfile();
  const { activeCrops, readyToHarvest, pendingTransport, totalLandArea, isLoading: statsLoading } = useDashboardStats();

  if (profileLoading || statsLoading) {
    return (
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 rounded-2xl p-6 border border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="flex flex-wrap gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      label: 'Total Land', 
      value: `${totalLandArea} acres`, 
      icon: LandPlot, 
      color: 'text-amber-600 bg-amber-100' 
    },
    { 
      label: 'Active Crops', 
      value: activeCrops.toString(), 
      icon: Sprout, 
      color: 'text-emerald-600 bg-emerald-100' 
    },
    { 
      label: 'Ready to Harvest', 
      value: readyToHarvest.toString(), 
      icon: Wheat, 
      color: 'text-primary bg-primary/10' 
    },
    { 
      label: 'Pending Transport', 
      value: pendingTransport.toString(), 
      icon: Truck, 
      color: 'text-blue-600 bg-blue-100' 
    },
  ];

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 rounded-2xl p-6 border border-border shadow-soft">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Farmer Info */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Welcome, {profile?.full_name || 'Farmer'}! 🌾
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {profile?.village && profile?.district 
                ? `${profile.village}, ${profile.district}`
                : 'Location not set'}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div 
              key={stat.label}
              className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border/50 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FarmerSummaryCard;
