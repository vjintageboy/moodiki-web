import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Appointment, CallTypeType } from '@/lib/types/database.types';

export type AvailableSlot = {
  start_time: string;
  end_time: string;
};

export function useAvailableSlots(expertId: string, date: Date | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['available-slots', expertId, date?.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!expertId || !date) return [];

      const targetDate = date.toISOString().split('T')[0];

      const { data, error } = await supabase.rpc('get_available_slots', {
        p_expert_id: expertId,
        p_date: targetDate,
      });

      if (error) {
        console.error('Error fetching available slots:', error);
        throw error;
      }

      return (data as AvailableSlot[]) || [];
    },
    enabled: !!expertId && !!date,
  });
}

export function useBookAppointment() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      expertId: string;
      startTime: string;
      durationMinutes: number;
      callType: CallTypeType;
      userNotes: string;
    }) => {
      const { data, error } = await supabase.rpc('book_appointment', {
        p_user_id: params.userId,
        p_expert_id: params.expertId,
        p_start_time: params.startTime,
        p_duration_minutes: params.durationMinutes,
        p_call_type: params.callType,
        p_user_notes: params.userNotes,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as Appointment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots', variables.expertId] });
      toast.success('Appointment booked successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to book appointment');
    },
  });
}
