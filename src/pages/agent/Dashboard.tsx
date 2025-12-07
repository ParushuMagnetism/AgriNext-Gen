import DashboardLayout from '@/layouts/DashboardLayout';
import AgentSummaryCards from '@/components/agent/AgentSummaryCards';
import TodaysTaskList from '@/components/agent/TodaysTaskList';
import CropsNearHarvest from '@/components/agent/CropsNearHarvest';
import PendingTransportList from '@/components/agent/PendingTransportList';
import AIInsightsPanel from '@/components/agent/AIInsightsPanel';

const AgentDashboard = () => {
  return (
    <DashboardLayout title="Agent Dashboard">
      <div className="space-y-6">
        {/* Summary Cards */}
        <AgentSummaryCards />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Tasks */}
          <TodaysTaskList />

          {/* Crops Near Harvest */}
          <CropsNearHarvest />
        </div>

        {/* AI Insights Panel - Full Width */}
        <AIInsightsPanel />

        {/* Pending Transport */}
        <PendingTransportList />
      </div>
    </DashboardLayout>
  );
};

export default AgentDashboard;
