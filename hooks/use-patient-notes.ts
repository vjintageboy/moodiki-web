'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

/**
 * Patient note record for expert's internal notes
 */
export interface PatientNote {
  id: string
  expert_id: string
  patient_id: string
  note: string
  created_at: string
  updated_at: string
}

/**
 * Fetch patient notes created by a specific expert for a specific patient
 */
export function usePatientNotes(expertId: string | null | undefined, patientId: string | null | undefined) {
  return useQuery({
    queryKey: ['patient-notes', expertId, patientId],
    queryFn: async (): Promise<PatientNote[]> => {
      if (!expertId || !patientId) return []

      const supabase = createClient()

      const { data, error } = await supabase
        .from('patient_notes')
        .select('*')
        .eq('expert_id', expertId)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching patient notes:', error)
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!expertId && !!patientId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Create or update patient note mutation
 * Uses upsert to handle create/update in one operation
 */
export function useUpsertPatientNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      expertId,
      patientId,
      note,
    }: {
      expertId: string
      patientId: string
      note: string
    }) => {
      const supabase = createClient()

      // Check if note already exists
      const { data: existingNote } = await supabase
        .from('patient_notes')
        .select('id')
        .eq('expert_id', expertId)
        .eq('patient_id', patientId)
        .maybeSingle()

      let error
      if (existingNote) {
        // Update existing note
        const result = await supabase
          .from('patient_notes')
          .update({
            note,
            updated_at: new Date().toISOString(),
          })
          .eq('expert_id', expertId)
          .eq('patient_id', patientId)
        
        error = result.error
      } else {
        // Create new note
        const result = await supabase
          .from('patient_notes')
          .insert({
            expert_id: expertId,
            patient_id: patientId,
            note,
          })
        
        error = result.error
      }

      if (error) {
        console.error('Error upserting patient note:', error)
        throw new Error(error.message)
      }

      return { expertId, patientId, note }
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['patient-notes', variables.expertId, variables.patientId] 
      })
      
      toast.success('Patient note saved successfully')
    },
    onError: (error) => {
      toast.error(`Failed to save note: ${error.message}`)
    },
  })
}

/**
 * Delete patient note mutation
 */
export function useDeletePatientNote() {
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

      const { error } = await supabase
        .from('patient_notes')
        .delete()
        .eq('expert_id', expertId)
        .eq('patient_id', patientId)

      if (error) {
        console.error('Error deleting patient note:', error)
        throw new Error(error.message)
      }

      return { expertId, patientId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['patient-notes', variables.expertId, variables.patientId] 
      })
      
      toast.success('Note deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete note: ${error.message}`)
    },
  })
}
