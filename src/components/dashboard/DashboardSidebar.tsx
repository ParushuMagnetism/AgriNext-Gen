import { useState, useEffect } from 'react';
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
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useFarmerNotifications } from '@/hooks/useFarmerDashboard';

const DashboardSidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { data: notifications } = useFarmerNotifications();
  
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const navItems = [
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

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Sprout className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-sidebar-foreground">Agri Mitra</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </div>
                {item.badge && (
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
            onClick={signOut}
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
