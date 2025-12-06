import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  Truck,
  XCircle,
  Clock,
  Package
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Order {
  id: string;
  orderId: string;
  buyer: { name: string; phone: string; location: string };
  product: string;
  quantity: string;
  price: string;
  total: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  paymentStatus: 'paid' | 'pending' | 'refunded';
}

const mockOrders: Order[] = [
  { 
    id: '1', 
    orderId: 'ORD-001', 
    buyer: { name: 'Rajesh Kumar', phone: '+91 98765 43210', location: 'Bangalore, Karnataka' },
    product: 'Organic Tomatoes', 
    quantity: '50 kg', 
    price: '₹50/kg',
    total: '₹2,500', 
    status: 'pending', 
    date: '2024-01-15',
    paymentStatus: 'pending'
  },
  { 
    id: '2', 
    orderId: 'ORD-002', 
    buyer: { name: 'Priya Sharma', phone: '+91 87654 32109', location: 'Mumbai, Maharashtra' },
    product: 'Fresh Onions', 
    quantity: '100 kg', 
    price: '₹40/kg',
    total: '₹4,000', 
    status: 'confirmed', 
    date: '2024-01-14',
    paymentStatus: 'paid'
  },
  { 
    id: '3', 
    orderId: 'ORD-003', 
    buyer: { name: 'Amit Patel', phone: '+91 76543 21098', location: 'Ahmedabad, Gujarat' },
    product: 'Green Chilies', 
    quantity: '20 kg', 
    price: '₹60/kg',
    total: '₹1,200', 
    status: 'shipped', 
    date: '2024-01-13',
    paymentStatus: 'paid'
  },
  { 
    id: '4', 
    orderId: 'ORD-004', 
    buyer: { name: 'Sunita Devi', phone: '+91 65432 10987', location: 'Jaipur, Rajasthan' },
    product: 'Potatoes', 
    quantity: '200 kg', 
    price: '₹30/kg',
    total: '₹6,000', 
    status: 'delivered', 
    date: '2024-01-12',
    paymentStatus: 'paid'
  },
  { 
    id: '5', 
    orderId: 'ORD-005', 
    buyer: { name: 'Vikram Singh', phone: '+91 54321 09876', location: 'Delhi' },
    product: 'Carrots', 
    quantity: '30 kg', 
    price: '₹60/kg',
    total: '₹1,800', 
    status: 'cancelled', 
    date: '2024-01-11',
    paymentStatus: 'refunded'
  },
];

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-accent/20 text-accent-foreground border-accent/30' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'bg-primary/20 text-primary border-primary/30' },
  shipped: { label: 'Shipped', icon: Truck, color: 'bg-blue-500/20 text-blue-700 border-blue-500/30' },
  delivered: { label: 'Delivered', icon: Package, color: 'bg-primary/20 text-primary border-primary/30' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-destructive/20 text-destructive border-destructive/30' },
};

const FarmerOrders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const orderCounts = {
    all: mockOrders.length,
    pending: mockOrders.filter(o => o.status === 'pending').length,
    confirmed: mockOrders.filter(o => o.status === 'confirmed').length,
    shipped: mockOrders.filter(o => o.status === 'shipped').length,
    delivered: mockOrders.filter(o => o.status === 'delivered').length,
    cancelled: mockOrders.filter(o => o.status === 'cancelled').length,
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    // In a real app, this would update the database
    console.log('Updating order', orderId, 'to status', newStatus);
  };

  return (
    <DashboardLayout title="Orders">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap">
            <TabsTrigger value="all" className="data-[state=active]:bg-background">
              All <Badge variant="secondary" className="ml-2">{orderCounts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-background">
              Pending <Badge variant="secondary" className="ml-2">{orderCounts.pending}</Badge>
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="data-[state=active]:bg-background">
              Confirmed <Badge variant="secondary" className="ml-2">{orderCounts.confirmed}</Badge>
            </TabsTrigger>
            <TabsTrigger value="shipped" className="data-[state=active]:bg-background">
              Shipped <Badge variant="secondary" className="ml-2">{orderCounts.shipped}</Badge>
            </TabsTrigger>
            <TabsTrigger value="delivered" className="data-[state=active]:bg-background">
              Delivered <Badge variant="secondary" className="ml-2">{orderCounts.delivered}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Orders Table */}
        <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Order ID</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Buyer</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Product</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Quantity</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Total</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Date</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => {
                  const StatusIcon = statusConfig[order.status].icon;
                  return (
                    <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{order.orderId}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">{order.buyer.name}</p>
                          <p className="text-xs text-muted-foreground">{order.buyer.location}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{order.product}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{order.quantity}</td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{order.total}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={cn('gap-1', statusConfig[order.status].color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[order.status].label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{order.date}</td>
                      <td className="px-6 py-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredOrders.length === 0 && (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">No orders found</h3>
              <p className="text-muted-foreground">No orders match your search criteria.</p>
            </div>
          )}
        </div>

        {/* Order Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder?.orderId}</DialogTitle>
              <DialogDescription>
                View and manage order information
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Buyer</p>
                    <p className="text-sm font-medium">{selectedOrder.buyer.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{selectedOrder.buyer.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">{selectedOrder.buyer.location}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Order Date</p>
                    <p className="text-sm font-medium">{selectedOrder.date}</p>
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm">{selectedOrder.product}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.quantity}</p>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-muted-foreground">Price per unit</p>
                    <p className="text-sm">{selectedOrder.price}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <p className="font-medium">Total</p>
                    <p className="font-semibold text-lg">{selectedOrder.total}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Status</p>
                    <Badge variant="outline" className={cn('mt-1', statusConfig[selectedOrder.status].color)}>
                      {statusConfig[selectedOrder.status].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payment</p>
                    <Badge variant={selectedOrder.paymentStatus === 'paid' ? 'default' : 'secondary'} className="mt-1">
                      {selectedOrder.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {selectedOrder?.status === 'pending' && (
                <>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Confirm Order
                  </Button>
                </>
              )}
              {selectedOrder?.status === 'confirmed' && (
                <Button className="gap-2">
                  <Truck className="h-4 w-4" />
                  Mark as Shipped
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default FarmerOrders;
