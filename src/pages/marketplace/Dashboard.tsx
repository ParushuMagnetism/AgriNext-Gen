import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ShoppingCart, 
  Leaf, 
  TrendingUp, 
  Package,
  Sparkles,
  ArrowRight,
  MapPin,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  useBuyerProfile,
  useCreateBuyerProfile,
  useMarketProducts,
  useMarketplaceDashboardStats,
  useBuyerOrders
} from '@/hooks/useMarketplaceDashboard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MarketplaceDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useBuyerProfile();
  const createProfile = useCreateBuyerProfile();
  const { data: products } = useMarketProducts();
  const stats = useMarketplaceDashboardStats();
  const { data: orders } = useBuyerOrders();
  
  const [aiLoading, setAiLoading] = useState(false);
  const [stockAdvice, setStockAdvice] = useState<string | null>(null);

  const handleCreateProfile = () => {
    createProfile.mutate({
      name: user?.email?.split('@')[0] || 'Buyer',
      buyer_type: 'retail',
    });
  };

  const handleStockRecommendation = async () => {
    if (!profile) return;
    
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('marketplace-ai', {
        body: {
          type: 'stock_recommendation',
          buyerProfile: profile,
          marketData: { available_crops: products?.slice(0, 10) }
        }
      });
      
      if (error) throw error;
      setStockAdvice(data.result);
      toast.success('AI recommendations ready!');
    } catch (error) {
      console.error('AI error:', error);
      toast.error('Failed to get recommendations');
    } finally {
      setAiLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <DashboardLayout title="Marketplace">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout title="Marketplace">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <ShoppingCart className="h-16 w-16 mx-auto text-primary mb-4" />
              <CardTitle>Welcome to AgriNext Gen Marketplace!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Set up your buyer profile to start purchasing fresh produce directly from farmers.
              </p>
              <Button 
                className="w-full" 
                onClick={handleCreateProfile}
                disabled={createProfile.isPending}
              >
                {createProfile.isPending ? 'Creating...' : 'Create Buyer Profile'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const freshProducts = products?.filter(p => p.status === 'ready').slice(0, 4) || [];
  const activeOrders = orders?.filter(o => !['delivered', 'cancelled'].includes(o.status)).slice(0, 3) || [];

  return (
    <DashboardLayout title="Marketplace">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
          <p className="text-muted-foreground">
            Welcome, {profile.name} • {profile.company_name || profile.buyer_type}
          </p>
        </div>
        <Button onClick={() => navigate('/marketplace/browse')}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Browse Products
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/marketplace/browse')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-primary">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fresh Harvest</p>
                <p className="text-2xl font-bold text-green-600">{stats.freshHarvest}</p>
              </div>
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coming Soon</p>
                <p className="text-2xl font-bold text-amber-600">{stats.oneWeekAway}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/marketplace/orders')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Fresh Harvest */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                Fresh Harvest Available
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace/browse')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {freshProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Leaf className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No fresh harvest available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {freshProducts.map(product => (
                  <div 
                    key={product.id}
                    className="p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/marketplace/product/${product.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{product.crop_name}</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Ready</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{product.estimated_quantity} {product.quantity_unit}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {product.farmer?.village || product.land?.village || 'Unknown'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Orders */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                Your Active Orders
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace/orders')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active orders</p>
                <Button variant="link" onClick={() => navigate('/marketplace/browse')}>
                  Start shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map(order => (
                  <div 
                    key={order.id}
                    className="p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => navigate('/marketplace/orders')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{order.crop?.crop_name || 'Order'}</span>
                      <Badge variant="outline">{order.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{order.quantity} {order.quantity_unit}</span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {order.farmer?.full_name || 'Farmer'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Stock Advisor
            </CardTitle>
            <Button onClick={handleStockRecommendation} disabled={aiLoading}>
              {aiLoading ? 'Analyzing...' : 'What Should I Stock?'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stockAdvice ? (
            <div className="p-4 bg-background rounded-lg whitespace-pre-wrap text-sm">
              {stockAdvice}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Get AI-powered recommendations on what crops to stock this week based on market trends and your buyer profile.
            </p>
          )}
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
};

export default MarketplaceDashboard;
