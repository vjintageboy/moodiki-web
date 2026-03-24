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

  return useMutation({
    mutationFn: async (slot: { expert_id: string; start_time: string; end_time: string }) => {
      const { data, error } = await supabase
        .from('expert_availability')
        .insert([slot])
        .select()
        .single();

      if (error) {
        // Handle PostgreSQL GiST EXCLUDE Exeception
        if (error.code === '23P01') {
          throw new Error('This time slot overlaps with an existing availability block.');
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
