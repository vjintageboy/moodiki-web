'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Appointment } from '@/lib/types/database.types'

/**
 * Extended appointment data for patient session history
 */
export interface PatientSession {
  id: string
  appointment_date: string
  duration_minutes: number
  call_type: 'chat' | 'video' | 'audio'
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  payment_status: 'unpaid' | 'paid' | 'refunded'
  user_notes: string | null
  cancellation_reason: string | null
}

/**
 * Fetch all appointments (sessions) between an expert and a specific patient
 */
export function usePatientSessions(expertId: string | null | undefined, patientId: string | null | undefined) {
  return useQuery({
    queryKey: ['patient-sessions', expertId, patientId],
    queryFn: async (): Promise<PatientSession[]> => {
      if (!expertId || !patientId) return []

      const supabase = createClient()

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          duration_minutes,
          call_type,
          status,
          payment_status,
          user_notes,
          cancellation_reason
        `)
        .eq('expert_id', expertId)
        .eq('user_id', patientId)
        .order('appointment_date', { ascending: false })

      if (error) {
        console.error('Error fetching patient sessions:', error)
        throw new Error(error.message)
      }

      return (data || []) as PatientSession[]
    },
    enabled: !!expertId && !!patientId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
