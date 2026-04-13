'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { subDays, format, eachDayOfInterval } from 'date-fns'

export interface ExpertKPIs {
  personalRevenue: number
  totalSessions: number
  completedSessions: number
  avgRating: number
  completionRate: number
  appointmentsToday: number
  benchmarkPercentile: number // Mocked calculation based on revenue
  platformAvgRevenue: number
}

export interface RevenuePoint {
  date: string
  amount: number
}

export interface SessionTypeDist {
  type: string
  value: number
}

/**
 * Fetch performance metrics for a specific expert
 */
export function useExpertAnalytics(expertId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['expert-analytics', expertId],
    queryFn: async () => {
      if (!expertId) return null

      const supabase = createClient()
      const now = new Date()
      const startDate = subDays(now, 29)
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // 1. Fetch Expert Profile (for Rating)
      const { data: expert } = await supabase
        .from('experts')
        .select('rating, total_reviews')
        .eq('id', expertId)
        .single()

      // 2. Fetch All Appointments for this Expert
      const { data: appts } = await supabase
        .from('appointments')
        .select('expert_base_price, appointment_date, status, call_type, payment_status')
        .eq('expert_id', expertId)

      // 3. Fetch Platform Average for Benchmark (Mocked or simple aggregate)
      const { data: platformData } = await supabase
        .from('appointments')
        .select('expert_base_price')
        .eq('payment_status', 'paid')

      // Process KPIs
      const completedAppts = appts?.filter(a => a.status === 'completed') || []
      const paidAppts = appts?.filter(a => a.payment_status === 'paid') || []
      const personalRevenue = paidAppts.reduce((sum, a) => sum + (a.expert_base_price || 0), 0)
      
      const apptsToday = appts?.filter(a => {
        const d = new Date(a.appointment_date)
        return d >= todayStart && a.status !== 'cancelled'
      }).length || 0

      const completionRate = appts?.length 
        ? Math.round((completedAppts.length / appts.filter(a => a.status !== 'pending').length || 1) * 100) 
        : 0

      // Benchmark logic (simplified: compare with platform average revenue)
      const platformAvgRevenue = platformData?.length 
        ? platformData.reduce((sum, a) => sum + (a.expert_base_price || 0), 0) / (platformData.length / 10 || 1) // Mock average per expert
        : 0
      
      const benchmarkPercentile = personalRevenue > platformAvgRevenue ? 75 : 45 // Placeholder logic

      // Process Revenue Trend (30 days)
      const dailyRevenue = new Map<string, number>()
      eachDayOfInterval({ start: startDate, end: now }).forEach(date => {
        dailyRevenue.set(format(date, 'MMM d'), 0)
      })

      paidAppts.forEach(apt => {
        const dateKey = format(new Date(apt.appointment_date), 'MMM d')
        if (dailyRevenue.has(dateKey)) {
          dailyRevenue.set(dateKey, (dailyRevenue.get(dateKey) || 0) + (apt.expert_base_price || 0))
        }
      })

      const revenueTrend = Array.from(dailyRevenue.entries()).map(([date, amount]) => ({
        date,
        amount
      }))

      // Process Session Types
      const typeCounts: Record<string, number> = { chat: 0, video: 0, audio: 0 }
      appts?.forEach(a => {
        if (a.call_type in typeCounts) {
          typeCounts[a.call_type]++
        }
      })

      const sessionTypes = Object.entries(typeCounts).map(([type, value]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        value
      }))

      return {
        kpis: {
          personalRevenue,
          totalSessions: appts?.length || 0,
          completedSessions: completedAppts.length,
          avgRating: expert?.rating || 0,
          completionRate,
          appointmentsToday: apptsToday,
          benchmarkPercentile,
          platformAvgRevenue
        } as ExpertKPIs,
        revenueTrend,
        sessionTypes
      }
    },
    enabled: !!expertId && enabled,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}
