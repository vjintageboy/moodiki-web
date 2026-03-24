'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bell, Check, Trash2, Calendar, MessageSquare, 
  AlertCircle, Info, RefreshCw, Send 
} from 'lucide-react';
import type { Notification } from '@/lib/types/database.types';

// Map notification types to icons and colors
const getNotificationMetadata = (type: string, isRead: boolean) => {
  const baseClass = isRead ? "text-muted-foreground bg-muted" : "";
  
  switch (type?.toLowerCase()) {
    case 'appointment':
      return {
        icon: Calendar,
        colorClass: isRead ? baseClass : "text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400"
      };
    case 'message':
      return {
        icon: MessageSquare,
        colorClass: isRead ? baseClass : "text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-400"
      };
    case 'alert':
    case 'warning':
      return {
        icon: AlertCircle,
        colorClass: isRead ? baseClass : "text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400"
      };
    default:
      return {
        icon: Info,
        colorClass: isRead ? baseClass : "text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-400"
      };
  }
};

export default function NotificationsPage() {
  const { 
    notifications, isLoading, error, refetch, unreadCount,
    markAsRead, markAllAsRead, deleteNotification 
  } = useNotifications();
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead.mutate(id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification.mutate(id);
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-theme(spacing.20))]">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 rounded-full px-2 py-0.5 text-xs">
                {unreadCount} new
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage your alerts and messages
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => markAllAsRead.mutate()}
            disabled={unreadCount === 0 || markAllAsRead.isPending}
            className="gap-2 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
          >
            <Check className="w-4 h-4" />
            Mark all read
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-0 shadow-md">
        <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as any)} className="flex-1 flex flex-col">
          <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0 bg-muted/30">
            <TabsList>
              <TabsTrigger value="all">All Notifications</TabsTrigger>
              <TabsTrigger value="unread" className="gap-2">
                Unread
                {unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <div className="text-sm text-muted-foreground">
              {filteredNotifications.length} items
            </div>
          </div>

          <ScrollArea className="flex-1 h-full">
            <div className="p-0">
              {isLoading ? (
                // Loading Skeletons
                <div className="divide-y">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="p-6 flex items-start gap-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                // Error State
                <div className="py-20 text-center px-4">
                  <div className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4 dark:bg-red-900/30">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">Failed to load notifications</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                    {error.message || 'There was a problem retrieving your notifications. Please try again.'}
                  </p>
                  <Button variant="outline" className="mt-6" onClick={() => refetch()}>
                    Try Again
                  </Button>
                </div>
              ) : filteredNotifications.length === 0 ? (
                // Empty State
                <div className="py-24 text-center px-4">
                  <div className="inline-flex w-20 h-20 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
                    <Bell className="w-10 h-10 opacity-50" />
                  </div>
                  <h3 className="text-xl font-medium text-foreground">All caught up!</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {filter === 'unread' 
                      ? "You don't have any unread notifications."
                      : "You don't have any notifications yet."}
                  </p>
                </div>
              ) : (
                // Notifications List
                <div className="divide-y divide-border/50">
                  {filteredNotifications.map((notification) => {
                    const meta = getNotificationMetadata(notification.type, notification.is_read);
                    const Icon = meta.icon;
                    
                    return (
                      <div 
                        key={notification.id} 
                        className={`group p-6 flex flex-col sm:flex-row sm:items-start gap-4 transition-colors hover:bg-muted/50 ${
                          !notification.is_read ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                        }`}
                      >
                        {/* Status dot & Icon */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full ${!notification.is_read ? 'bg-purple-600' : 'bg-transparent'}`} />
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${meta.colorClass}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className={`text-base truncate ${!notification.is_read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                            {notification.title}
                          </h4>
                          <p className={`mt-1 text-sm line-clamp-2 ${!notification.is_read ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                            {notification.message}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            <span className="mx-1">•</span>
                            <span className="capitalize">{notification.type}</span>
                          </p>
                        </div>

                        {/* Actions (hover) */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-start mt-2 sm:mt-0">
                          {!notification.is_read && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="h-8 w-8 text-muted-foreground hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </Card>
    </div>
  );
}
