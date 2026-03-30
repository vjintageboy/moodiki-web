'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type {
  Appointment,
  AppointmentStatusType,
  AppointmentFilterOptions,
  User,
  Expert,
  ChatRoom,
} from '@/lib/types/database.types'

/**
 * Extended appointment type with related data
 */
export interface AppointmentWithRelations extends Appointment {
  user?: User | null
  expert?: Expert | null
  expertUser?: User | null
  chatRoom?: ChatRoom | null
}

async function attachExpertUsers(
  appointments: AppointmentWithRelations[],
  supabase: ReturnType<typeof createClient>
): Promise<AppointmentWithRelations[]> {
  if (!appointments.length) {
    return appointments
  }

  const expertIds = [...new Set(appointments.map((apt) => apt.expert_id).filter(Boolean))]

  if (!expertIds.length) {
    return appointments
  }

  const { data: expertUsers, error: expertUsersError } = await supabase
    .from('users')
    .select('id, full_name, email, avatar_url, role')
    .in('id', expertIds)

  if (expertUsersError) {
    throw new Error(expertUsersError.message)
  }

  const expertMap = new Map((expertUsers || []).map((expertUser) => [expertUser.id, expertUser]))

  return appointments.map((appointment) => ({
    ...appointment,
    expertUser: (expertMap.get(appointment.expert_id) as User | undefined) || null,
  }))
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
}

/**
 * Fetch appointments list with optional filters and pagination
 * Joins with users and experts to get names and details
 * Supports filtering by status, call_type, payment_status, date_range, and expert_id
 * Sorted by appointment_date descending
 * 5-minute stale time
 */
export function useAppointments(
  filters?: AppointmentFilterOptions & PaginationParams & { enabled?: boolean }
) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: async (): Promise<AppointmentWithRelations[]> => {
      const supabase = createClient()

      let query = supabase.from('appointments').select(
        `
        *,
        user:users!user_id(id, full_name, email, avatar_url, role),
        expert:experts!expert_id(
          id,
          bio,
          specialization,
          hourly_rate,
          rating,
          total_reviews,
          is_approved,
          years_experience
        )
      `
      )

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.paymentStatus) {
        query = query.eq('payment_status', filters.paymentStatus)
      }

      if (filters?.expertId) {
        query = query.eq('expert_id', filters.expertId)
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
      }

      // Date range filter
      if (filters?.dateFrom && filters?.dateTo) {
        query = query
          .gte('appointment_date', filters.dateFrom)
          .lte('appointment_date', filters.dateTo)
      } else if (filters?.dateFrom) {
        query = query.gte('appointment_date', filters.dateFrom)
      } else if (filters?.dateTo) {
        query = query.lte('appointment_date', filters.dateTo)
      }

      // Apply sorting
      query = query.order('appointment_date', { ascending: false })

      // Apply pagination
      const page = filters?.page || 1
      const pageSize = filters?.pageSize || 20
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      query = query.range(from, to)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching appointments:', error)
        throw new Error(error.message)
      }

      const appointments = (data as AppointmentWithRelations[]) || []
      return await attachExpertUsers(appointments, supabase)
    },
    enabled: filters?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (garbage collection)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return {
    appointments: data || [],
    isLoading,
    error,
    isFetching,
    refetch,
  }
}

/**
 * Fetch a single appointment with full details
 * Includes user info, expert info, and chat room data if exists
 */
export function useAppointment(id: string | null | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['appointment', id],
    queryFn: async (): Promise<AppointmentWithRelations | null> => {
      if (!id) return null

      const supabase = createClient()

      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .select(
          `
          *,
          user:users!user_id(id, full_name, email, avatar_url, role, streak_count),
          expert:experts!expert_id(
            id,
            bio,
            specialization,
            hourly_rate,
            rating,
            total_reviews,
            is_approved,
            years_experience,
            title,
            license_number
          )
        `
        )
        .eq('id', id)
        .single()

      if (appointmentError) {
        console.error('Error fetching appointment:', appointmentError)
        throw new Error(appointmentError.message)
      }

      // Fetch chat room data if exists
      if (appointmentData?.id) {
        const { data: expertUserData } = await supabase
          .from('users')
          .select('id, full_name, email, avatar_url, role')
          .eq('id', appointmentData.expert_id)
          .maybeSingle()

        const { data: chatRoomData } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('appointment_id', appointmentData.id)
          .maybeSingle()

        return {
          ...appointmentData,
          expertUser: (expertUserData as User | null) || undefined,
          chatRoom: chatRoomData || undefined,
        } as AppointmentWithRelations
      }

      return appointmentData as AppointmentWithRelations
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return {
    appointment: data || null,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Cancel appointment mutation
 * Updates status to 'cancelled' and sets cancellation details
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      reason,
      cancelledBy,
      cancelledRole,
      refundStatus = 'none',
    }: {
      id: string
      reason: string
      cancelledBy: string
      cancelledRole: 'admin' | 'expert' | 'user'
      refundStatus?: string
    }) => {
      const supabase = createClient()

      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled' as AppointmentStatusType,
          cancelled_at: new Date().toISOString(),
          cancelled_by: cancelledBy,
          cancelled_role: cancelledRole,
          cancellation_reason: reason,
          refund_status: refundStatus,
        })
        .eq('id', id)

      if (error) {
        console.error('Error cancelling appointment:', error)
        throw new Error(error.message)
      }

      return id
    },
    onSuccess: (appointmentId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

      toast.success('Appointment cancelled successfully')
    },
    onError: (error) => {
      toast.error(`Failed to cancel appointment: ${error.message}`)
    },
  })
}

/**
 * Reschedule appointment mutation
 * Updates appointment_date and optionally duration
 * Validates new date/time is in the future
 */
export function useRescheduleAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      newDate,
      newDuration,
    }: {
      id: string
      newDate: string
      newDuration?: number
    }) => {
      // Validate new date is in the future
      const newDateObj = new Date(newDate)
      const now = new Date()

      if (newDateObj <= now) {
        throw new Error('Appointment date must be in the future')
      }

      const supabase = createClient()

      const updateData: Record<string, unknown> = {
        appointment_date: newDate,
        updated_at: new Date().toISOString(),
      }

      if (newDuration && newDuration > 0) {
        updateData.duration_minutes = newDuration
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.error('Error rescheduling appointment:', error)
        throw new Error(error.message)
      }

      return id
    },
    onSuccess: (appointmentId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] })

      toast.success('Appointment rescheduled successfully')
    },
    onError: (error) => {
      toast.error(`Failed to reschedule appointment: ${error.message}`)
    },
  })
}

/**
 * Update appointment status mutation
 * Validates status transitions: pending → confirmed → completed
 * Cannot transition from cancelled or completed states
 */
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient()

  const validTransitions: Record<AppointmentStatusType, AppointmentStatusType[]> =
    {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    }

  return useMutation({
    mutationFn: async ({
      id,
      newStatus,
    }: {
      id: string
      newStatus: AppointmentStatusType
    }) => {
      // Fetch current appointment to validate transition
      const supabase = createClient()

      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('status')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch appointment: ${fetchError.message}`)
      }

      const currentStatus = appointment?.status as AppointmentStatusType
      const allowedTransitions = validTransitions[currentStatus] || []

      // Validate transition
      if (!allowedTransitions.includes(newStatus)) {
        throw new Error(
          `Cannot transition from "${currentStatus}" to "${newStatus}"`
        )
      }

      // Update status
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) {
        console.error('Error updating appointment status:', updateError)
        throw new Error(updateError.message)
      }

      return id
    },
    onSuccess: (appointmentId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

      toast.success('Appointment status updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update appointment status: ${error.message}`)
    },
  })
}

/**
 * Create/update appointment notes mutation
 * Updates the user_notes field
 */
export function useUpdateAppointmentNotes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      notes,
    }: {
      id: string
      notes: string
    }) => {
      const supabase = createClient()

      const { error } = await supabase
        .from('appointments')
        .update({
          user_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        console.error('Error updating appointment notes:', error)
        throw new Error(error.message)
      }

      return id
    },
    onSuccess: (appointmentId) => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })

      toast.success('Notes updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update notes: ${error.message}`)
    },
  })
}

/**
 * Update appointment payment status mutation
 * Updates payment_status and optionally sets payment transaction IDs
 */
export function useUpdateAppointmentPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      paymentStatus,
      paymentId,
      paymentTransId,
    }: {
      id: string
      paymentStatus: 'unpaid' | 'paid' | 'refunded'
      paymentId?: string | null
      paymentTransId?: string | null
    }) => {
      const supabase = createClient()

      const updateData: Record<string, unknown> = {
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      }

      if (paymentId !== undefined) {
        updateData.payment_id = paymentId
      }

      if (paymentTransId !== undefined) {
        updateData.payment_trans_id = paymentTransId
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.error('Error updating appointment payment:', error)
        throw new Error(error.message)
      }

      return id
    },
    onSuccess: (appointmentId) => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

      toast.success('Payment status updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update payment status: ${error.message}`)
    },
  })
}

/**
 * Get appointment count by status
 * Useful for dashboard metrics
 */
export function useAppointmentCountByStatus() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['appointment-count-by-status'],
    queryFn: async () => {
      const supabase = createClient()

      const statuses: AppointmentStatusType[] = [
        'pending',
        'confirmed',
        'completed',
        'cancelled',
      ]

      const counts = await Promise.all(
        statuses.map(async (status) => {
          const { count, error } = await supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('status', status)

          if (error) {
            console.error(`Error counting ${status} appointments:`, error)
            return { status, count: 0 }
          }

          return { status, count: count || 0 }
        })
      )

      return counts.reduce(
        (acc, item) => {
          acc[item.status] = item.count
          return acc
        },
        {} as Record<AppointmentStatusType, number>
      )
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })

  return {
    counts: data,
    isLoading,
    error,
  }
}

/**
 * Get appointments for a specific expert
 * Useful for expert dashboard
 */
export function useExpertAppointments(
  expertId: string | null | undefined,
  filters?: Omit<AppointmentFilterOptions, 'expertId'> & PaginationParams
) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['expert-appointments', expertId, filters],
    queryFn: async (): Promise<AppointmentWithRelations[]> => {
      if (!expertId) return []

      const supabase = createClient()

      let query = supabase
        .from('appointments')
        .select(
          `
          *,
          user:users!user_id(id, full_name, email, avatar_url),
          expert:experts!expert_id(id, specialization)
        `
        )
        .eq('expert_id', expertId)

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.paymentStatus) {
        query = query.eq('payment_status', filters.paymentStatus)
      }

      if (filters?.dateFrom && filters?.dateTo) {
        query = query
          .gte('appointment_date', filters.dateFrom)
          .lte('appointment_date', filters.dateTo)
      } else if (filters?.dateFrom) {
        query = query.gte('appointment_date', filters.dateFrom)
      } else if (filters?.dateTo) {
        query = query.lte('appointment_date', filters.dateTo)
      }

      query = query.order('appointment_date', { ascending: false })

      // Apply pagination
      const page = filters?.page || 1
      const pageSize = filters?.pageSize || 20
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      query = query.range(from, to)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching expert appointments:', error)
        throw new Error(error.message)
      }

      return (data as AppointmentWithRelations[]) || []
    },
    enabled: !!expertId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return {
    appointments: data || [],
    isLoading,
    error,
    isFetching,
    refetch,
  }
}

/**
 * Get appointments for a specific user
 * Useful for user dashboard
 */
export function useUserAppointments(
  userId: string | null | undefined,
  filters?: Omit<AppointmentFilterOptions, 'userId'> & PaginationParams
) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['user-appointments', userId, filters],
    queryFn: async (): Promise<AppointmentWithRelations[]> => {
      if (!userId) return []

      const supabase = createClient()

      let query = supabase
        .from('appointments')
        .select(
          `
          *,
          expert:experts!expert_id(
            id,
            specialization,
            hourly_rate,
            rating
          )
        `
        )
        .eq('user_id', userId)

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.paymentStatus) {
        query = query.eq('payment_status', filters.paymentStatus)
      }

      if (filters?.expertId) {
        query = query.eq('expert_id', filters.expertId)
      }

      if (filters?.dateFrom && filters?.dateTo) {
        query = query
          .gte('appointment_date', filters.dateFrom)
          .lte('appointment_date', filters.dateTo)
      } else if (filters?.dateFrom) {
        query = query.gte('appointment_date', filters.dateFrom)
      } else if (filters?.dateTo) {
        query = query.lte('appointment_date', filters.dateTo)
      }

      query = query.order('appointment_date', { ascending: false })

      // Apply pagination
      const page = filters?.page || 1
      const pageSize = filters?.pageSize || 20
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      query = query.range(from, to)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching user appointments:', error)
        throw new Error(error.message)
      }

      const appointments = (data as AppointmentWithRelations[]) || []
      return await attachExpertUsers(appointments, supabase)
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return {
    appointments: data || [],
    isLoading,
    error,
    isFetching,
    refetch,
  }
}
