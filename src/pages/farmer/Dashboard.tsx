import DashboardLayout from '@/layouts/DashboardLayout';
import FarmerSummaryCard from '@/components/farmer/FarmerSummaryCard';
import CropsSection from '@/components/farmer/CropsSection';
import HarvestTimeline from '@/components/farmer/HarvestTimeline';
import TransportSection from '@/components/farmer/TransportSection';
import MarketPricesWidget from '@/components/farmer/MarketPricesWidget';
import AdvisoriesList from '@/components/farmer/AdvisoriesList';
import QuickActions from '@/components/farmer/QuickActions';
import WeatherWidget from '@/components/farmer/WeatherWidget';
import FarmlandsSummary from '@/components/farmer/FarmlandsSummary';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';

const FarmerDashboard = () => {
  // Enable real-time subscriptions for live data updates
  useRealtimeSubscriptions();

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Farmer Summary Header */}
        <FarmerSummaryCard />

        {/* Quick Actions */}
        <QuickActions />

        {/* Weather + Farmlands Summary Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <WeatherWidget />
          <div className="lg:col-span-2">
            <FarmlandsSummary />
          </div>
        </div>

        {/* My Crops Section */}
        <CropsSection />

        {/* Two column layout for Harvest & Transport */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HarvestTimeline />
          <TransportSection />
        </div>

        {/* Two column layout for Market Prices & Advisories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MarketPricesWidget />
          <AdvisoriesList />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FarmerDashboard;
