'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';
import type { Notification } from '@/lib/types/database.types';

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Fetch notifications for current user
  const notificationsQuery = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
  });

  // Mark single notification as read
  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Mark all notifications as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Admin: Send notification (with broadcast support)
  const sendNotification = useMutation({
    mutationFn: async ({
      userIds, title, message, type = 'system', target = 'all'
    }: {
      userIds: string[], title: string, message: string, type?: string, target?: string
    }) => {
      // If targeting all, call the broadcast API
      if (userIds[0] === '__ALL__') {
        const response = await fetch('/api/notifications/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, message, type, target }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send broadcast');
        }

        return await response.json();
      }

      // Otherwise send to specific users
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        metadata: { sender: user?.id }
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
    },
  });

  return {
    notifications: notificationsQuery.data || [],
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    refetch: notificationsQuery.refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    unreadCount: (notificationsQuery.data || []).filter(n => !n.is_read).length,
  };
}
