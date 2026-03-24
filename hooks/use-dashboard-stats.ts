'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './use-auth'

export interface DashboardStats {
  totalUsers: number
  totalExpertsApproved: number
  pendingExpertApplications: number
  totalAppointments: number
  appointmentsToday: number
  appointmentsThisWeek: number
  totalMeditations: number
  totalCommunityPosts: number
  activeChatRooms: number
  totalRevenue: number
  averageAppointmentRating: number
  newUsersThisMonth: number
}

/**
 * Fetch dashboard statistics from Supabase
 * Uses Tanstack Query for caching and automatic refetching
 * Only accessible to admin users
 */
export function useDashboardStats() {
  const { isAdmin, loading: authLoading } = useAuth()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const supabase = createClient()

      try {
        // Get current date
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        // Fetch all statistics in parallel
        const [
          usersResult,
          expertsApprovedResult,
          pendingExpertsResult,
          totalAppointmentsResult,
          appointmentsTodayResult,
          appointmentsWeekResult,
          meditationsResult,
          postsResult,
          chatRoomsResult,
          revenueResult,
          appointmentRatingResult,
          newUsersMonthResult,
        ] = await Promise.all([
          // Total users count
          supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .in('role', ['user', 'expert', 'admin']),

          // Total approved experts
          supabase
            .from('experts')
            .select('id', { count: 'exact', head: true })
            .eq('is_approved', true),

          // Pending expert applications
          supabase
            .from('experts')
            .select('id', { count: 'exact', head: true })
            .eq('is_approved', false),

          // Total appointments (all time)
          supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .in('status', ['confirmed', 'completed', 'pending']),

          // Appointments today
          supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .gte('appointment_date', todayStart.toISOString())
            .lt('appointment_date', new Date(todayStart.getTime() + 24 * 60 * 60 * 1000).toISOString())
            .in('status', ['confirmed', 'completed']),

          // Appointments this week
          supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .gte('appointment_date', weekStart.toISOString())
            .in('status', ['confirmed', 'completed']),

          // Total meditations
          supabase
            .from('meditations')
            .select('id', { count: 'exact', head: true }),

          // Total community posts
          supabase
            .from('posts')
            .select('id', { count: 'exact', head: true }),

          // Active chat rooms (not archived/closed)
          supabase
            .from('chat_rooms')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active'),

          // Revenue: sum of expert_base_price where payment_status = 'paid'
          supabase
            .from('appointments')
            .select('expert_base_price')
            .eq('payment_status', 'paid'),

          // Average expert rating
          supabase
            .from('experts')
            .select('rating')
            .not('rating', 'is', null),

          // New users this month
          supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', monthStart.toISOString())
            .eq('role', 'user'),
        ])

        // Calculate revenue (sum of prices)
        let totalRevenue = 0
        if (revenueResult.data && Array.isArray(revenueResult.data)) {
          totalRevenue = revenueResult.data.reduce((sum, record) => {
            return sum + (record.expert_base_price || 0)
          }, 0)
        }

        // Calculate average rating
        let averageRating = 0
        if (appointmentRatingResult.data && Array.isArray(appointmentRatingResult.data)) {
          const ratings = appointmentRatingResult.data
            .map((r) => r.rating)
            .filter((r) => r !== null) as number[]
          if (ratings.length > 0) {
            averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length
          }
        }

        return {
          totalUsers: usersResult.count || 0,
          totalExpertsApproved: expertsApprovedResult.count || 0,
          pendingExpertApplications: pendingExpertsResult.count || 0,
          totalAppointments: totalAppointmentsResult.count || 0,
          appointmentsToday: appointmentsTodayResult.count || 0,
          appointmentsThisWeek: appointmentsWeekResult.count || 0,
          totalMeditations: meditationsResult.count || 0,
          totalCommunityPosts: postsResult.count || 0,
          activeChatRooms: chatRoomsResult.count || 0,
          totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimals
          averageAppointmentRating: Math.round(averageRating * 100) / 100,
          newUsersThisMonth: newUsersMonthResult.count || 0,
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
        throw err
      }
    },
    enabled: !authLoading && isAdmin, // Only fetch if admin and auth is loaded
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  return {
    stats: data || null,
    isLoading: authLoading || isLoading,
    error,
    refetch,
  }
}
