import DashboardLayout from '@/layouts/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentOrders from '@/components/dashboard/RecentOrders';
import EarningsChart from '@/components/dashboard/EarningsChart';
import ActiveListings from '@/components/dashboard/ActiveListings';
import { Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';

const FarmerDashboard = () => {
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Earnings"
            value="₹1,51,000"
            change="+12.5% from last month"
            changeType="positive"
            icon={DollarSign}
            iconColor="bg-primary/10 text-primary"
          />
          <StatsCard
            title="Active Listings"
            value="12"
            change="+2 new this week"
            changeType="positive"
            icon={Package}
            iconColor="bg-accent/20 text-accent-foreground"
          />
          <StatsCard
            title="Pending Orders"
            value="8"
            change="3 require action"
            changeType="neutral"
            icon={ShoppingCart}
            iconColor="bg-blue-500/10 text-blue-600"
          />
          <StatsCard
            title="Monthly Growth"
            value="+23%"
            change="Compared to last month"
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-primary/10 text-primary"
          />
        </div>

        {/* Charts and Listings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EarningsChart />
          <ActiveListings />
        </div>

        {/* Recent Orders */}
        <RecentOrders />
      </div>
    </DashboardLayout>
  );
};

export default FarmerDashboard;
