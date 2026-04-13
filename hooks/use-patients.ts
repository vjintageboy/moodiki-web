'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types/database.types'

export interface PatientRecord {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  phone_number: string | null
  total_sessions: number
  last_session: string | null
  status: 'active' | 'completed' // Based on whether they have upcoming appointments
}

/**
 * Fetch unique patients for a specific expert
 * Aggregates appointment data to provide a summary per patient
 */
export function useExpertPatients(expertId: string | null | undefined) {
  return useQuery({
    queryKey: ['expert-patients', expertId],
    queryFn: async (): Promise<PatientRecord[]> => {
      if (!expertId) return []

      const supabase = createClient()

      // 1. Fetch all appointments for this expert with basic user info
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          user_id,
          appointment_date,
          status,
          user:users!user_id (
            id,
            full_name,
            email,
            avatar_url,
            phone_number
          )
        `)
        .eq('expert_id', expertId)
        .order('appointment_date', { ascending: false })

      if (error) {
        console.error('Error fetching patients data:', error)
        throw new Error(error.message)
      }

      if (!appointments) return []

      // 2. Process and group by user_id
      const patientMap = new Map<string, PatientRecord>()
      const now = new Date()

      appointments.forEach((apt) => {
        const userId = apt.user_id
        const user = apt.user as unknown as User
        
        if (!user) return

        const existing = patientMap.get(userId)
        const aptDate = new Date(apt.appointment_date)
        const isUpcoming = aptDate > now && apt.status !== 'cancelled'

        if (existing) {
          existing.total_sessions += 1
          if (isUpcoming) {
            existing.status = 'active'
          }
          // The query is ordered by date DESC, so the first one we hit is the latest
          if (!existing.last_session || aptDate > new Date(existing.last_session)) {
            existing.last_session = apt.appointment_date
          }
        } else {
          patientMap.set(userId, {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            avatar_url: user.avatar_url,
            phone_number: user.phone_number,
            total_sessions: 1,
            last_session: apt.appointment_date,
            status: isUpcoming ? 'active' : 'completed',
          })
        }
      })

      return Array.from(patientMap.values())
    },
    enabled: !!expertId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
