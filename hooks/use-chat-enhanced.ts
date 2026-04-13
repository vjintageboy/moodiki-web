'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

/**
 * Create a new chat room between expert and patient (without appointment)
 */
export function useCreateDirectChatRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      expertId,
      patientId,
    }: {
      expertId: string
      patientId: string
    }) => {
      const supabase = createClient()

      // Check if room already exists
      const { data: existingRooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .is('appointment_id', null)
        .order('created_at', { ascending: false })
        .limit(1)

      // Since we can't directly filter by participants in one query,
      // we'll create the room and then add participants
      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          appointment_id: null, // Direct chat, no appointment
          status: 'active',
          last_message: null,
          last_message_time: new Date().toISOString(),
        })
        .select()
        .single()

      if (roomError) {
        console.error('Error creating chat room:', roomError)
        throw new Error(roomError.message)
      }

      // Add expert as participant
      const { error: expertParticipantError } = await supabase
        .from('chat_participants')
        .insert({
          room_id: newRoom.id,
          user_id: expertId,
        })

      if (expertParticipantError) {
        throw new Error(expertParticipantError.message)
      }

      // Add patient as participant
      const { error: patientParticipantError } = await supabase
        .from('chat_participants')
        .insert({
          room_id: newRoom.id,
          user_id: patientId,
        })

      if (patientParticipantError) {
        throw new Error(patientParticipantError.message)
      }

      return newRoom
    },
    onSuccess: () => {
      // Invalidate expert chat rooms
      queryClient.invalidateQueries({ queryKey: ['expert-chat-rooms'] })
      toast.success('Chat room created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create chat room: ${error.message}`)
    },
  })
}

/**
 * Pin/unpin a message
 */
export function useTogglePinMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      messageId,
      roomId,
      isPinned,
    }: {
      messageId: string
      roomId: string
      isPinned: boolean
    }) => {
      const supabase = createClient()

      const { error } = await supabase
        .from('messages')
        .update({
          is_pinned: !isPinned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)

      if (error) {
        console.error('Error toggling pin:', error)
        throw new Error(error.message)
      }

      return { messageId, roomId, isPinned: !isPinned }
    },
    onSuccess: (_, variables) => {
      // Invalidate room messages
      queryClient.invalidateQueries({
        queryKey: ['chat-room-messages', variables.roomId],
      })
      toast.success(
        variables.isPinned ? 'Message unpinned' : 'Message pinned'
      )
    },
    onError: (error) => {
      toast.error(`Failed to update message: ${error.message}`)
    },
  })
}

/**
 * Search messages within a room
 */
export function useSearchRoomMessages() {
  return {
    search: async (
      roomId: string,
      query: string
    ): Promise<Array<{
      id: string
      content: string
      created_at: string
      sender_id: string
    }>> => {
      if (!roomId || !query.trim()) return []

      const supabase = createClient()

      const { data, error } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id')
        .eq('room_id', roomId)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error searching messages:', error)
        throw new Error(error.message)
      }

      return data || []
    },
  }
}
