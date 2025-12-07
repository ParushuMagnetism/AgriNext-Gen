import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Sprout as CropIcon,
  LandPlot,
  Truck, 
  DollarSign, 
  Settings, 
  LogOut,
  Sprout,
  Bell,
  ShoppingBag,
  Package,
  X,
  ClipboardList,
  Users,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useFarmerNotifications } from '@/hooks/useFarmerDashboard';
import { Button } from '@/components/ui/button';

interface DashboardSidebarProps {
  onClose?: () => void;
}

const DashboardSidebar = ({ onClose }: DashboardSidebarProps) => {
  const location = useLocation();
  const { signOut, userRole } = useAuth();
  const { data: notifications } = useFarmerNotifications();
  
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  // Farmer navigation items
  const farmerNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/farmer/dashboard' },
    { icon: CropIcon, label: 'My Crops', href: '/farmer/crops' },
    { icon: LandPlot, label: 'Farmlands', href: '/farmer/farmlands' },
    { icon: Truck, label: 'Transport', href: '/farmer/transport' },
    { icon: ShoppingBag, label: 'Listings', href: '/farmer/listings' },
    { icon: Package, label: 'Orders', href: '/farmer/orders' },
    { icon: DollarSign, label: 'Earnings', href: '/farmer/earnings' },
    { 
      icon: Bell, 
      label: 'Notifications', 
      href: '/farmer/notifications',
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    { icon: Settings, label: 'Settings', href: '/farmer/settings' },
  ];

  // Agent navigation items
  const agentNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/agent/dashboard' },
    { icon: ClipboardList, label: 'My Tasks', href: '/agent/tasks' },
    { icon: Users, label: 'Farmers & Crops', href: '/agent/farmers' },
    { icon: Truck, label: 'Transport', href: '/agent/transport' },
  ];

  // Logistics navigation items
  const logisticsNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/logistics/dashboard' },
    { icon: Package, label: 'Available Loads', href: '/logistics/loads' },
    { icon: Truck, label: 'Active Trips', href: '/logistics/trips' },
    { icon: CropIcon, label: 'Completed', href: '/logistics/completed' },
    { icon: LandPlot, label: 'My Vehicles', href: '/logistics/vehicles' },
    { icon: Settings, label: 'Profile', href: '/logistics/profile' },
  ];

  // Buyer/Marketplace navigation items
  const buyerNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/marketplace/dashboard' },
    { icon: ShoppingBag, label: 'Browse Products', href: '/marketplace/browse' },
    { icon: Package, label: 'My Orders', href: '/marketplace/orders' },
    { icon: Settings, label: 'Profile', href: '/marketplace/profile' },
  ];

  // Admin navigation items
  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Users, label: 'Farmers', href: '/admin/farmers' },
    { icon: Sparkles, label: 'Agents', href: '/admin/agents' },
    { icon: Truck, label: 'Transporters', href: '/admin/transporters' },
    { icon: ShoppingBag, label: 'Buyers', href: '/admin/buyers' },
    { icon: CropIcon, label: 'Crops', href: '/admin/crops' },
    { icon: Package, label: 'Transport', href: '/admin/transport' },
    { icon: ClipboardList, label: 'Orders', href: '/admin/orders' },
    { icon: Sparkles, label: 'AI Console', href: '/admin/ai-console' },
  ];

  // Select nav items based on user role
  const navItems = userRole === 'agent' 
    ? agentNavItems 
    : userRole === 'logistics' 
      ? logisticsNavItems 
      : userRole === 'buyer'
        ? buyerNavItems
        : userRole === 'admin'
          ? adminNavItems
          : farmerNavItems;
  
  const dashboardTitle = userRole === 'agent' 
    ? 'AgriNext Gen Agent' 
    : userRole === 'logistics'
      ? 'AgriNext Gen Transport'
      : userRole === 'buyer'
        ? 'AgriNext Gen Market'
        : userRole === 'admin'
          ? 'AgriNext Gen Admin'
          : 'AgriNext Gen';

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              userRole === 'agent' 
                ? 'bg-purple-600' 
                : userRole === 'logistics'
                  ? 'bg-blue-600'
                  : userRole === 'buyer'
                    ? 'bg-orange-600'
                    : userRole === 'admin'
                      ? 'bg-rose-600'
                      : 'bg-sidebar-primary'
            )}>
              {userRole === 'agent' ? (
                <Sparkles className="w-5 h-5 text-white" />
              ) : userRole === 'logistics' ? (
                <Truck className="w-5 h-5 text-white" />
              ) : userRole === 'buyer' ? (
                <ShoppingBag className="w-5 h-5 text-white" />
              ) : userRole === 'admin' ? (
                <Sparkles className="w-5 h-5 text-white" />
              ) : (
                <Sprout className="w-5 h-5 text-sidebar-primary-foreground" />
              )}
            </div>
            <div>
              <span className="font-display font-bold text-lg text-sidebar-foreground leading-tight block">
                {dashboardTitle}
              </span>
              {userRole === 'agent' && (
                <span className="text-xs text-purple-500 font-medium">Field Operations</span>
              )}
              {userRole === 'logistics' && (
                <span className="text-xs text-blue-500 font-medium">Logistics Partner</span>
              )}
              {userRole === 'buyer' && (
                <span className="text-xs text-orange-500 font-medium">Marketplace Buyer</span>
              )}
              {userRole === 'admin' && (
                <span className="text-xs text-rose-500 font-medium">Command Center</span>
              )}
            </div>
          </div>
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? userRole === 'agent' 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      : userRole === 'logistics'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : userRole === 'buyer'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                          : userRole === 'admin'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                            : 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </div>
                {'badge' in item && typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-destructive text-destructive-foreground rounded-full min-w-[20px] text-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={() => {
              signOut();
              if (onClose) onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
