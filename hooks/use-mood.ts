import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';
import type { MoodEntry } from '@/lib/types/database.types';

export function useMoodTracking() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  // Fetch user's mood history
  const moodHistory = useQuery({
    queryKey: ['mood-history', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching mood history:', error);
        throw error;
      }

      return data as MoodEntry[];
    },
    enabled: !!userId,
  });

  // Check if today's mood has already been logged
  const todaysMood = useQuery({
    queryKey: ['todays-mood', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Get midnight today in ISO
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as MoodEntry | null;
    },
    enabled: !!userId,
  });

  // Mutation to add a new mood
  const addMood = useMutation({
    mutationFn: async (params: {
      mood_score: number;
      note?: string;
      emotion_factors?: string[];
      tags?: string[];
    }) => {
      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('add_mood_entry', {
        p_mood_score: params.mood_score,
        p_note: params.note || null,
        p_emotion_factors: params.emotion_factors || [],
        p_tags: params.tags || [],
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as MoodEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-history', userId] });
      queryClient.invalidateQueries({ queryKey: ['todays-mood', userId] });
      // Invalidate the auth query to refresh user's new streak_count and longest_streak
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      toast.success('Mood logged successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to log mood. Please try again.');
    },
  });

  return {
    moodHistory: moodHistory.data || [],
    isLoadingHistory: moodHistory.isLoading,
    todaysMood: todaysMood.data,
    hasLoggedToday: !!todaysMood.data,
    isLoadingTodaysMood: todaysMood.isLoading,
    addMood: addMood.mutateAsync,
    isAddingMood: addMood.isPending,
  };
}
