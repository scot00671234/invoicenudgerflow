import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth.tsx';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Check, X, Mail, DollarSign, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'nudge_sent' | 'invoice_paid' | 'invoice_overdue' | 'nudge_failed' | 'subscription_reminder';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

export function NotificationSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch real-time notifications based on user activity
  const { data: recentActivity } = useQuery({
    queryKey: ['/api/recent-activity'],
    refetchInterval: 30000, // Check every 30 seconds
    enabled: !!user,
  });

  const { data: overdueInvoices } = useQuery({
    queryKey: ['/api/invoices/overdue'],
    refetchInterval: 60000, // Check every minute
    enabled: !!user,
  });

  const { data: nudgeLogs } = useQuery({
    queryKey: ['/api/nudge-logs/recent'],
    refetchInterval: 60000, // Check every minute
    enabled: !!user,
  });

  // Generate notifications from real platform data
  useEffect(() => {
    if (!user) return;

    const newNotifications: Notification[] = [];

    // Invoice overdue notifications
    if (overdueInvoices) {
      overdueInvoices.forEach((invoice: any) => {
        const daysOverdue = Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue > 0) {
          newNotifications.push({
            id: `overdue-${invoice.id}`,
            type: 'invoice_overdue',
            title: 'Invoice Overdue',
            message: `Invoice ${invoice.invoiceId} from ${invoice.clientName} is ${daysOverdue} days overdue ($${invoice.amount})`,
            timestamp: new Date(invoice.dueDate),
            read: false,
            data: { invoice },
          });
        }
      });
    }

    // Nudge sent notifications
    if (nudgeLogs) {
      nudgeLogs.forEach((log: any) => {
        const timeSince = new Date().getTime() - new Date(log.sentAt).getTime();
        const hoursAgo = timeSince / (1000 * 60 * 60);
        
        if (hoursAgo <= 24) { // Show nudges from last 24 hours
          newNotifications.push({
            id: `nudge-${log.id}`,
            type: 'nudge_sent',
            title: 'Payment Reminder Sent',
            message: `Nudge sent to ${log.invoice?.clientName || 'client'} for invoice ${log.invoice?.invoiceId || 'unknown'}`,
            timestamp: new Date(log.sentAt),
            read: false,
            data: { log },
          });
        }
      });
    }

    // Recent activity notifications
    if (recentActivity) {
      recentActivity.forEach((activity: any) => {
        const timeSince = new Date().getTime() - new Date(activity.timestamp).getTime();
        const hoursAgo = timeSince / (1000 * 60 * 60);
        
        if (hoursAgo <= 24) { // Show activity from last 24 hours
          if (activity.type === 'invoice_paid') {
            newNotifications.push({
              id: `paid-${activity.id}`,
              type: 'invoice_paid',
              title: 'Payment Received',
              message: `Invoice ${activity.invoiceId} has been marked as paid ($${activity.amount})`,
              timestamp: new Date(activity.timestamp),
              read: false,
              data: { activity },
            });
          }
        }
      });
    }

    // Pro subscription reminder
    if (!user.isPro && user.activeInvoices >= 3) {
      newNotifications.push({
        id: 'pro-reminder',
        type: 'subscription_reminder',
        title: 'Upgrade to Pro',
        message: 'You have reached the free tier limit. Upgrade to Pro for unlimited invoices and advanced features.',
        timestamp: new Date(),
        read: false,
      });
    }

    // Sort by timestamp (newest first) and limit to 20
    newNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setNotifications(newNotifications.slice(0, 20));
  }, [user, recentActivity, overdueInvoices, nudgeLogs]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'nudge_sent':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'invoice_paid':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'invoice_overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'nudge_failed':
        return <X className="h-4 w-4 text-red-500" />;
      case 'subscription_reminder':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Handle different notification types
    switch (notification.type) {
      case 'subscription_reminder':
        // Could navigate to subscription page
        break;
      case 'invoice_overdue':
        // Could navigate to specific invoice
        break;
      default:
        break;
    }
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-xs mt-1">You'll see updates about your invoices and nudges here</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                        !notification.read ? 'bg-muted/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}