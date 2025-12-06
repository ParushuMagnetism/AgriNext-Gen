import { useFarmerNotifications } from '@/hooks/useFarmerDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Cloud, 
  TrendingUp, 
  Sprout, 
  FileText, 
  AlertTriangle,
  ChevronRight,
  Check
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

const categoryConfig: Record<string, { icon: React.ElementType; color: string }> = {
  price: { icon: TrendingUp, color: 'text-emerald-600 bg-emerald-100' },
  weather: { icon: Cloud, color: 'text-blue-600 bg-blue-100' },
  crop: { icon: Sprout, color: 'text-primary bg-primary/10' },
  scheme: { icon: FileText, color: 'text-purple-600 bg-purple-100' },
  alert: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-100' },
  pickup: { icon: Bell, color: 'text-primary bg-primary/10' },
  info: { icon: Bell, color: 'text-muted-foreground bg-muted' },
};

const AdvisoriesList = () => {
  const { data: notifications, isLoading } = useFarmerNotifications();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    queryClient.invalidateQueries({ queryKey: ['farmer-notifications', user?.id] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Advisories & Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" />
          Advisories & Alerts
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {unreadCount} new
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!notifications || notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notification) => {
              const category = categoryConfig[notification.type.toLowerCase()] || categoryConfig.info;
              const Icon = category.icon;

              return (
                <div
                  key={notification.id}
                  className={`flex gap-3 p-3 rounded-lg border transition-colors ${
                    notification.is_read 
                      ? 'bg-card border-border/50' 
                      : 'bg-primary/5 border-primary/20'
                  }`}
                >
                  <div className={`p-2 rounded-lg h-fit ${category.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-medium text-sm ${
                        notification.is_read ? 'text-foreground' : 'text-foreground'
                      }`}>
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 shrink-0"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}

            {notifications.length > 5 && (
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => window.location.href = '/farmer/notifications'}
              >
                View all notifications
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvisoriesList;
