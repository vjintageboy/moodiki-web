'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Expert, ExpertAvailability, Appointment } from '@/lib/types/database.types';

// ============================================================================
// TYPES
// ============================================================================

export interface ExpertWithUser extends Expert {
  users?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface ExpertFilters {
  is_approved?: boolean;
  specialization?: string;
  search?: string;
}

export interface ExpertDetailStats {
  appointmentCount: number;
  totalEarnings: number;
  completedSessions: number;
  averageRating: number;
}

export interface AvailabilitySlot extends ExpertAvailability {
  dayName?: string;
}

export interface UpdateExpertPayload {
  bio?: string;
  specialization?: string;
  hourly_rate?: number;
  years_experience?: number;
  license_number?: string;
  license_url?: string;
  certificate_urls?: string[] | null;
  education?: string;
  university?: string;
  graduation_year?: number;
  title?: string;
}

export interface UpdateAvailabilityPayload {
  expertId: string;
  slots: Array<{
    id?: string; // undefined for new slots
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch experts list with optional filters
 * - Joins with users table to get email
 * - Optional filters: is_approved, specialization, search
 * - Sort by created_at desc
 * - 5-minute stale time
 */
export function useExperts(filters?: ExpertFilters) {
  return useQuery({
    queryKey: ['experts', filters],
    queryFn: async () => {
      const supabase = createClient();

      let query = supabase.from('experts').select(
        `
        *,
        users:id(id, email, full_name, avatar_url)
      `
      );

      // Apply filters
      if (filters?.is_approved !== undefined) {
        query = query.eq('is_approved', filters.is_approved);
      }

      if (filters?.specialization) {
        query = query.eq('specialization', filters.specialization);
      }

      if (filters?.search) {
        query = query.or(`bio.ilike.%${filters.search}%,education.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return (data as unknown as ExpertWithUser[]) || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch single expert with detailed stats
 * - Fetch expert with user details
 * - Include availability slots
 * - Include appointment count, earnings stats
 * - Enable only when id provided
 */
export function useExpert(id?: string) {
  return useQuery({
    queryKey: ['expert', id],
    queryFn: async () => {
      if (!id) return null;

      const supabase = createClient();

      // Fetch expert with user details
      const { data: expert, error: expertError } = await supabase
        .from('experts')
        .select(
          `
          *,
          users!experts_id_fkey(id, email, full_name, avatar_url)
        `
        )
        .eq('id', id)
        .single();

      if (expertError) throw expertError;

      if (!expert) return null;

      // Fetch stats
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, status, payment_status, expert_base_price')
        .eq('expert_id', id);

      if (appointmentsError) throw appointmentsError;

      // Calculate stats
      const completedSessions = (appointments || []).filter(
        (apt) => apt.status === 'completed'
      ).length;

      const totalEarnings = (appointments || [])
        .filter((apt) => apt.payment_status === 'paid')
        .reduce((sum, apt) => sum + (apt.expert_base_price || 0), 0);

      const stats: ExpertDetailStats = {
        appointmentCount: appointments?.length || 0,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        completedSessions,
        averageRating: expert.rating || 0,
      };

      return {
        ...expert,
        stats,
      };
    },
    enabled: !!id,
  });
}

/**
 * Fetch expert availability slots
 * - Query key: ['expert-availability', expertId]
 * - Fetch from expert_availability table
 * - Group by day_of_week
 * - Order by day, then start_time
 */
export function useExpertAvailability(expertId?: string) {
  return useQuery({
    queryKey: ['expert-availability', expertId],
    queryFn: async () => {
      if (!expertId) return [];

      const supabase = createClient();

      const { data, error } = await supabase
        .from('expert_availability')
        .select('*')
        .eq('expert_id', expertId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Map day numbers to names for display
      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];

      return (data as ExpertAvailability[]).map((slot) => ({
        ...slot,
        dayName: dayNames[slot.day_of_week],
      }));
    },
    enabled: !!expertId,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Update expert mutation
 * - Updates experts table
 * - Can update: bio, specialization, hourly_rate, years_experience, etc.
 * - Invalidate ['experts'] and ['expert', id]
 * - Show toast
 */
export function useUpdateExpert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateExpertPayload;
    }) => {
      const supabase = createClient();

      const { error } = await supabase
        .from('experts')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      return id;
    },
    onSuccess: (expertId) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      queryClient.invalidateQueries({ queryKey: ['expert', expertId] });

      toast.success('Expert updated successfully');
    },
    onError: (error) => {
      console.error('Update expert error:', error);
      toast.error('Failed to update expert');
    },
  });
}

/**
 * Delete expert mutation
 * - Delete from experts table (cascades)
 * - Confirmation required
 * - Invalidate ['experts']
 * - Show toast
 */
export function useDeleteExpert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expertId: string) => {
      // Confirmation check (caller should handle confirmation UI)
      const confirmed = window.confirm(
        'Are you sure you want to delete this expert? This action cannot be undone.'
      );

      if (!confirmed) {
        throw new Error('Deletion cancelled by user');
      }

      const supabase = createClient();

      const { error } = await supabase.from('experts').delete().eq('id', expertId);

      if (error) throw error;

      return expertId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experts'] });

      toast.success('Expert deleted successfully');
    },
    onError: (error: Error) => {
      if (error.message !== 'Deletion cancelled by user') {
        console.error('Delete expert error:', error);
        toast.error('Failed to delete expert');
      }
    },
  });
}

/**
 * Approve expert mutation
 * - Set is_approved = true
 * - Send notification (optional)
 * - Invalidate queries
 * - Show toast: "Expert approved successfully"
 */
export function useApproveExpert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expertId: string) => {
      const supabase = createClient();

      // Update approval status
      const { error } = await supabase
        .from('experts')
        .update({ is_approved: true })
        .eq('id', expertId);

      if (error) throw error;

      return expertId;
    },
    onSuccess: (expertId) => {
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      queryClient.invalidateQueries({ queryKey: ['expert', expertId] });

      toast.success('Expert approved successfully');
    },
    onError: (error) => {
      console.error('Approve expert error:', error);
      toast.error('Failed to approve expert');
    },
  });
}

/**
 * Reject expert mutation
 * - Can either set is_approved = false or delete record
 * - Accept optional reason parameter
 * - Send notification (optional)
 * - Invalidate queries
 * - Show toast
 */
export function useRejectExpert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      expertId,
      deleteRecord = false,
      reason,
    }: {
      expertId: string;
      deleteRecord?: boolean;
      reason?: string;
    }) => {
      const supabase = createClient();

      if (deleteRecord) {
        // Delete the expert record
        const { error } = await supabase.from('experts').delete().eq('id', expertId);
        if (error) throw error;
      } else {
        // Just set approval to false
        const { error } = await supabase
          .from('experts')
          .update({ is_approved: false })
          .eq('id', expertId);
        if (error) throw error;
      }

      return { expertId, deleteRecord, reason };
    },
    onSuccess: ({ deleteRecord }) => {
      queryClient.invalidateQueries({ queryKey: ['experts'] });

      const message = deleteRecord
        ? 'Expert application rejected and record deleted'
        : 'Expert rejected successfully';

      toast.success(message);
    },
    onError: (error) => {
      console.error('Reject expert error:', error);
      toast.error('Failed to reject expert');
    },
  });
}

/**
 * Update expert availability mutation
 * - Upsert availability slots
 * - Delete removed slots
 * - Validate no overlaps
 * - Invalidate ['expert-availability']
 */
export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expertId, slots }: UpdateAvailabilityPayload) => {
      const supabase = createClient();

      // Validate no overlapping slots
      const dayGroups = new Map<number, typeof slots>();
      for (const slot of slots) {
        const day = slot.day_of_week;
        if (!dayGroups.has(day)) {
          dayGroups.set(day, []);
        }
        dayGroups.get(day)!.push(slot);
      }

      // Check for overlaps within each day
      for (const [, daySlots] of dayGroups) {
        for (let i = 0; i < daySlots.length; i++) {
          for (let j = i + 1; j < daySlots.length; j++) {
            const slot1 = daySlots[i];
            const slot2 = daySlots[j];

            // Check if slots overlap
            const slot1Start = slot1.start_time;
            const slot1End = slot1.end_time;
            const slot2Start = slot2.start_time;
            const slot2End = slot2.end_time;

            if (
              !(slot1End <= slot2Start || slot1Start >= slot2End)
            ) {
              throw new Error(
                `Overlapping availability slots on day ${slot1.day_of_week}`
              );
            }
          }
        }
      }

      // Delete old slots for this expert
      const { error: deleteError } = await supabase
        .from('expert_availability')
        .delete()
        .eq('expert_id', expertId);

      if (deleteError) throw deleteError;

      // Insert new slots
      if (slots.length > 0) {
        const slotsToInsert = slots.map((slot) => ({
          expert_id: expertId,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
        }));

        const { error: insertError } = await supabase
          .from('expert_availability')
          .insert(slotsToInsert);

        if (insertError) throw insertError;
      }

      return expertId;
    },
    onSuccess: (expertId) => {
      queryClient.invalidateQueries({
        queryKey: ['expert-availability', expertId],
      });

      toast.success('Availability updated successfully');
    },
    onError: (error: Error) => {
      console.error('Update availability error:', error);
      toast.error(error.message || 'Failed to update availability');
    },
  });
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Get formatted availability grouped by day
 */
export function useFormattedAvailability(expertId?: string) {
  const { data: slots, ...query } = useExpertAvailability(expertId);

  const formatted = slots?.reduce(
    (acc, slot) => {
      const day = slot.dayName || `Day ${slot.day_of_week}`;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push({
        start: slot.start_time,
        end: slot.end_time,
      });
      return acc;
    },
    {} as Record<string, Array<{ start: string; end: string }>>
  );

  return { data: formatted, ...query };
}

/**
 * Batch operations for multiple experts
 */
export function useBatchApproveExperts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expertIds: string[]) => {
      const supabase = createClient();

      const { error } = await supabase
        .from('experts')
        .update({ is_approved: true })
        .in('id', expertIds);

      if (error) throw error;

      return expertIds;
    },
    onSuccess: (expertIds) => {
      queryClient.invalidateQueries({ queryKey: ['experts'] });

      expertIds.forEach((id) => {
        queryClient.invalidateQueries({ queryKey: ['expert', id] });
      });

      toast.success(`${expertIds.length} expert(s) approved successfully`);
    },
    onError: (error) => {
      console.error('Batch approve error:', error);
      toast.error('Failed to approve experts');
    },
  });
}

/**
 * Batch operations for deleting multiple experts
 */
export function useBatchDeleteExperts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expertIds: string[]) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${expertIds.length} expert(s)? This action cannot be undone.`
      );

      if (!confirmed) {
        throw new Error('Deletion cancelled by user');
      }

      const supabase = createClient();

      const { error } = await supabase.from('experts').delete().in('id', expertIds);

      if (error) throw error;

      return expertIds;
    },
    onSuccess: (expertIds) => {
      queryClient.invalidateQueries({ queryKey: ['experts'] });

      toast.success(`${expertIds.length} expert(s) deleted successfully`);
    },
    onError: (error: Error) => {
      if (error.message !== 'Deletion cancelled by user') {
        console.error('Batch delete error:', error);
        toast.error('Failed to delete experts');
      }
    },
  });
}
