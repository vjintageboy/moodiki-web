'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';
import type { ChatRoom, Message, User } from '@/lib/types/database.types';

// Extended types for UI
export interface ChatRoomWithDetails extends ChatRoom {
  participants: {
    user: Pick<User, 'id' | 'full_name' | 'email' | 'avatar_url' | 'role'>;
  }[];
  appointment?: {
    id: string;
    appointment_date: string;
    status: string;
  };
}

export interface MessageWithSender extends Message {
  sender: Pick<User, 'id' | 'full_name' | 'email' | 'avatar_url' | 'role'>;
}

/**
 * Fetch messages for a specific chat room (Admin view).
 * Standalone hook to avoid Rules of Hooks violations.
 */
export function useChatAdminMessages(roomId: string | null) {
  const { isAdmin } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users(id, full_name, email, avatar_url, role)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as MessageWithSender[];
    },
    enabled: !!roomId && !!isAdmin,
  });
}

export function useChatAdmin() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const supabase = createClient();

  // 1. Fetch all chat rooms (Admin view)
  const chatRoomsQuery = useQuery({
    queryKey: ['admin-chat-rooms'],
    queryFn: async () => {
      // Step 1: fetch rooms without complex joins to avoid 400
      const { data: rooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (roomsError) {
        console.warn('chat_rooms query error:', roomsError.message);
        return [] as ChatRoomWithDetails[];
      }

      if (!rooms || rooms.length === 0) return [] as ChatRoomWithDetails[];

      // Step 2: fetch participants for each room
      const roomIds = rooms.map(r => r.id);

      const { data: participants } = await supabase
        .from('chat_participants')
        .select('room_id, user:users(id, full_name, email, avatar_url, role)')
        .in('room_id', roomIds);

      // Step 3: attach participants to rooms
      const result: ChatRoomWithDetails[] = rooms.map(room => ({
        ...room,
        participants: (participants || [])
          .filter(p => p.room_id === room.id)
          .map(p => ({ user: p.user as any })),
        appointment: undefined,
      }));

      return result;
    },
    enabled: !!isAdmin,
    retry: false,
  });

  // 3. Update room status (archive/close/active)
  const updateRoomStatus = useMutation({
    mutationFn: async ({ roomId, status }: { roomId: string, status: 'active' | 'archived' | 'closed' }) => {
      const { error } = await supabase
        .from('chat_rooms')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', roomId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chat-rooms'] });
    },
  });

  return {
    chatRooms: chatRoomsQuery.data || [],
    isLoadingRooms: chatRoomsQuery.isLoading,
    errorRooms: chatRoomsQuery.error,
    refetchRooms: chatRoomsQuery.refetch,
    updateRoomStatus,
  };
}

// 4. Hook for actual participating in a chat room (Realtime)
export function useChatRoom(roomId: string | null) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch initial messages
  const messagesQuery = useQuery({
    queryKey: ['chat-room-messages', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users(id, full_name, email, avatar_url, role)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as MessageWithSender[];
    },
    enabled: !!roomId,
  });

  // Setup Realtime Subscription
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch sender details for the new message
          const { data: senderData } = await supabase
            .from('users')
            .select('id, full_name, email, avatar_url, role')
            .eq('id', payload.new.sender_id)
            .single();

          const newMessage = {
            ...payload.new,
            sender: senderData,
          } as MessageWithSender;

          // Update query cache seamlessly
          queryClient.setQueryData<MessageWithSender[]>(
            ['chat-room-messages', roomId],
            (oldMessages) => {
              if (!oldMessages) return [newMessage];
              // Avoid duplicates if the sender mutation already added it optimistically
              if (oldMessages.find((m) => m.id === newMessage.id)) return oldMessages;
              return [...oldMessages, newMessage];
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase, queryClient]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !roomId) throw new Error('Not authenticated or no room selected');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          content,
          type: 'text',
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update the room's last message
      await supabase
        .from('chat_rooms')
        .update({
          last_message: content,
          last_message_time: new Date().toISOString()
        })
        .eq('id', roomId);

      return data;
    },
  });

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    sendMessage: sendMessage.mutateAsync,
    isSending: sendMessage.isPending,
  };
}

// 5. Fetch all chat rooms for a specific expert
export function useChatExpert(expertId: string | null | undefined) {
  const { isExpert } = useAuth();
  const supabase = createClient();

  const chatRoomsQuery = useQuery({
    queryKey: ['expert-chat-rooms', expertId],
    queryFn: async () => {
      if (!expertId) return [];
      
      // 1. Get all room IDs this expert is part of
      const { data: participantData, error: pError } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', expertId);
        
      if (pError) throw pError;
      
      const roomIds = participantData?.map(p => p.room_id) || [];
      if (roomIds.length === 0) return [];
      
      // 2. Fetch full details for those rooms
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          participants:chat_participants(
            user:users(id, full_name, email, avatar_url, role)
          ),
          appointment:appointments(id, appointment_date, status)
        `)
        .in('id', roomIds)
        .order('last_message_time', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as unknown as ChatRoomWithDetails[];
    },
    enabled: !!expertId && !!isExpert,
  });

  return {
    chatRooms: chatRoomsQuery.data || [],
    isLoadingRooms: chatRoomsQuery.isLoading,
    errorRooms: chatRoomsQuery.error,
    refetchRooms: chatRoomsQuery.refetch,
  };
}
