import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export type AvailabilitySlot = {
  id: string;
  expert_id: string;
  start_time: string;
  end_time: string;
  created_at: string;
};

export function useExpertAvailability(expertId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['expert-availability', expertId],
    queryFn: async () => {
      if (!expertId) return [];

      const { data, error } = await supabase
        .from('expert_availability')
        .select('*')
        .eq('expert_id', expertId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching availability:', error);
        throw error;
      }

      return (data as AvailabilitySlot[]) || [];
    },
    enabled: !!expertId,
  });
}

export function useCreateAvailabilityMutation() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Note: payload omits expert_id entirely to prevent spoofing.
  // The PostgreSQL RPC automatically injects auth.uid().
  return useMutation({
    mutationFn: async (slot: { start_time: string; end_time: string }) => {
      // Use secure RPC instead of direct insert
      const { data, error } = await supabase.rpc('add_expert_availability', {
        p_start_time: slot.start_time,
        p_end_time: slot.end_time
      });

      if (error) {
        // Handle PostgreSQL EXCLUDE/CHECK exceptions nicely
        if (error.code === '23P01') {
          throw new Error('This time slot overlaps with an existing availability block.');
        } else if (error.message.includes('valid_duration_minimum')) {
          throw new Error('Availability block must be at least 15 minutes long.');
        } else if (error.message.includes('in the past')) {
          throw new Error('Cannot schedule availability slots in the past.');
        }
        throw new Error(error.message);
      }

      return data as AvailabilitySlot;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expert-availability', data.expert_id] });
      toast.success('Availability block added successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add availability block');
    },
  });
}

export function useDeleteAvailabilityMutation() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, expert_id }: { id: string; expert_id: string }) => {
      const { error } = await supabase
        .from('expert_availability')
        .delete()
        .eq('id', id);

      // Note: RLS ensures only the owner can delete, so id alone is structurally safe

      if (error) {
        throw new Error(error.message);
      }
      return { id, expert_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expert-availability', data.expert_id] });
      toast.success('Availability block removed.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove availability');
    },
  });
}

export function useCreateBulkAvailabilityMutation() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slots: { start_time: string; end_time: string }[]) => {
      const { data, error } = await supabase.rpc('add_expert_availability_bulk', {
        p_slots: slots
      });

      if (error) {
        if (error.code === '23P01') {
          throw new Error('One or more of the generated time slots overlaps with an existing availability block.');
        } else if (error.message.includes('valid_duration_minimum')) {
          throw new Error('All availability blocks must be at least 15 minutes long.');
        } else if (error.message.includes('in the past')) {
          throw new Error('Cannot schedule availability slots in the past.');
        }
        throw new Error(error.message);
      }

      return data as AvailabilitySlot[];
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['expert-availability', data[0].expert_id] });
        toast.success(`Successfully added ${data.length} recurring availability block(s)!`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate bulk availability');
    },
  });
}
