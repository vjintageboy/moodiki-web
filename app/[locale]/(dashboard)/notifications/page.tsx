'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations, useLocale } from 'next-intl';
import {
  Bell, Check, Trash2, Calendar, MessageSquare,
  AlertCircle, Info, RefreshCw, Send, Users, Megaphone
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
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
  const t = useTranslations('Notifications');
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? vi : enUS;

  const {
    notifications, isLoading, error, refetch, unreadCount,
    markAsRead, markAllAsRead, deleteNotification, sendNotification
  } = useNotifications();

  const { user: currentUser, isAdmin } = useAuth();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<string>('all');
  const [broadcastType, setBroadcastType] = useState<string>('system');

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

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    try {
      // For 'all' target, we'd fetch all user IDs from the server
      // For now, send via the mutation which handles the insert
      await sendNotification.mutateAsync({
        userIds: broadcastTarget === 'all' ? ['__ALL__'] : [broadcastTarget],
        title: broadcastTitle,
        message: broadcastMessage,
        type: broadcastType,
        target: broadcastTarget,
      });
      setBroadcastOpen(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
      refetch();
    } catch (error) {
      console.error('Failed to send broadcast:', error);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-theme(spacing.20))]">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            {t('title')}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 rounded-full px-2 py-0.5 text-xs">
                {unreadCount} {t('new')}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBroadcastOpen(true)}
              className="gap-2 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700 hover:from-amber-100 hover:to-amber-200"
            >
              <Megaphone className="w-4 h-4 text-amber-600" />
              {t('broadcast.button')}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => markAllAsRead.mutate()}
            disabled={unreadCount === 0 || markAllAsRead.isPending}
            className="gap-2 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900"
          >
            <Check className="w-4 h-4" />
            {t('markAllRead')}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-0 shadow-md">
        <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as any)} className="flex-1 flex flex-col">
          <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0 bg-muted/30">
            <TabsList>
              <TabsTrigger value="all">{t('allNotifications')}</TabsTrigger>
              <TabsTrigger value="unread" className="gap-2">
                {t('unread')}
                {unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <div className="text-sm text-muted-foreground">
              {filteredNotifications.length} {t('items')}
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
                  <h3 className="text-lg font-medium text-foreground">{t('failedToLoad')}</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                    {error.message || t('failedToLoadDesc')}
                  </p>
                  <Button variant="outline" className="mt-6" onClick={() => refetch()}>
                    {t('tryAgain')}
                  </Button>
                </div>
              ) : filteredNotifications.length === 0 ? (
                // Empty State
                <div className="py-24 text-center px-4">
                  <div className="inline-flex w-20 h-20 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
                    <Bell className="w-10 h-10 opacity-50" />
                  </div>
                  <h3 className="text-xl font-medium text-foreground">{t('allCaughtUp')}</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {filter === 'unread' 
                      ? t('noUnread')
                      : t('noNotifications')}
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
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: dateLocale })}
                            <span className="mx-1">•</span>
                            <span className="capitalize">{t(`types.${notification.type.toLowerCase()}` as any)}</span>
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
                              title={t('markAsRead')}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40"
                            title={t('delete')}
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

      {/* Broadcast Dialog (Admin only) */}
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-600" />
              {t('broadcast.title')}
            </DialogTitle>
            <DialogDescription>
              {t('broadcast.desc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('broadcast.target')}</label>
              <Select value={broadcastTarget} onValueChange={(v) => v && setBroadcastTarget(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('broadcast.allUsers')}</SelectItem>
                  <SelectItem value="users">{t('broadcast.onlyUsers')}</SelectItem>
                  <SelectItem value="experts">{t('broadcast.onlyExperts')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('broadcast.type')}</label>
              <Select value={broadcastType} onValueChange={(v) => v && setBroadcastType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">{t('broadcast.types.system')}</SelectItem>
                  <SelectItem value="alert">{t('broadcast.types.alert')}</SelectItem>
                  <SelectItem value="info">{t('broadcast.types.info')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('broadcast.titleLabel')}</label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={t('broadcast.titlePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('broadcast.messageLabel')}</label>
              <Textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="min-h-[100px]"
                placeholder={t('broadcast.messagePlaceholder')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBroadcastOpen(false)} disabled={sendNotification.isPending}>
              {t('broadcast.cancel')}
            </Button>
            <Button
              onClick={handleBroadcast}
              disabled={!broadcastTitle.trim() || !broadcastMessage.trim() || sendNotification.isPending}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {sendNotification.isPending ? t('broadcast.sending') : t('broadcast.send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
