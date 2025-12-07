import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Sprout, 
  Truck, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Brain,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { useAdminDashboardStats, useRecentActivity } from '@/hooks/useAdminDashboard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const AdminDashboard = () => {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminDashboardStats();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity();
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const handleAIAnalysis = async (type: string) => {
    setAiLoading(type);
    setAiResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-ai', {
        body: {
          type,
          data: {
            totalFarmers: stats?.totalFarmers || 0,
            totalBuyers: stats?.totalBuyers || 0,
            activeTransporters: stats?.activeTransporters || 0,
            totalCrops: stats?.totalCrops || 0,
            harvestReady: stats?.harvestReady || 0,
            oneWeekAway: stats?.oneWeekAway || 0,
            pendingTransport: stats?.pendingTransport || 0,
            activeTransport: stats?.activeTransport || 0,
            pendingOrders: stats?.pendingOrders || 0,
            totalOrders: stats?.newOrdersToday || 0,
          },
        },
      });

      if (error) throw error;
      setAiResult(data.analysis);
      toast.success('AI analysis generated!');
    } catch (error) {
      console.error('AI error:', error);
      toast.error('Failed to generate AI analysis');
    } finally {
      setAiLoading(null);
    }
  };

  const statCards = [
    { label: 'Total Farmers', value: stats?.totalFarmers || 0, icon: Users, color: 'text-green-600' },
    { label: 'Active Buyers', value: stats?.totalBuyers || 0, icon: ShoppingBag, color: 'text-orange-600' },
    { label: 'Transporters', value: stats?.activeTransporters || 0, icon: Truck, color: 'text-blue-600' },
    { label: 'Active Crops', value: stats?.totalCrops || 0, icon: Sprout, color: 'text-emerald-600' },
    { label: 'Harvest Ready', value: stats?.harvestReady || 0, icon: Package, color: 'text-amber-600' },
    { label: 'Pending Transport', value: stats?.pendingTransport || 0, icon: Truck, color: 'text-purple-600' },
    { label: 'New Orders Today', value: stats?.newOrdersToday || 0, icon: TrendingUp, color: 'text-rose-600' },
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: Activity, color: 'text-indigo-600' },
  ];

  return (
    <DashboardLayout title="Admin Command Center">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Command Center</h1>
            <p className="text-muted-foreground">Complete ecosystem visibility and control</p>
          </div>
          <Button onClick={() => refetchStats()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsLoading ? (
            Array(8).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            statCards.map((stat, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className={`w-8 h-8 ${stat.color} opacity-80`} />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity?.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          activity.type === 'order' ? 'default' :
                          activity.type === 'transport' ? 'secondary' : 'outline'
                        }>
                          {activity.type}
                        </Badge>
                        <span className="text-sm">{activity.message}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                  {!recentActivity?.length && (
                    <p className="text-center text-muted-foreground py-8">No recent activity</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/admin/farmers">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Farmers
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/admin/agents">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Agents
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/admin/transporters">
                  <Truck className="w-4 h-4 mr-2" />
                  Manage Transporters
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/admin/ai-console">
                  <Brain className="w-4 h-4 mr-2" />
                  AI Console
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Command Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <Button 
                onClick={() => handleAIAnalysis('cluster_health')}
                disabled={!!aiLoading}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {aiLoading === 'cluster_health' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Activity className="w-4 h-4 mr-2" />
                )}
                Cluster Health
              </Button>
              <Button 
                onClick={() => handleAIAnalysis('supply_demand')}
                disabled={!!aiLoading}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {aiLoading === 'supply_demand' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4 mr-2" />
                )}
                Supply-Demand
              </Button>
              <Button 
                onClick={() => handleAIAnalysis('price_anomaly')}
                disabled={!!aiLoading}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                {aiLoading === 'price_anomaly' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mr-2" />
                )}
                Price Anomaly
              </Button>
              <Button 
                onClick={() => handleAIAnalysis('efficiency_advisor')}
                disabled={!!aiLoading}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {aiLoading === 'efficiency_advisor' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                Efficiency
              </Button>
            </div>

            {aiResult && (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  AI Analysis Result
                </h4>
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                  {aiResult}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
