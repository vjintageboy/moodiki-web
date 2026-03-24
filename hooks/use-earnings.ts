import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export type EarningSummary = {
  date_group: string;
  daily_earnings: number;
  total_sessions: number;
};

export function useExpertEarnings(expertId: string | undefined, startDate: string, endDate: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['expert-earnings', expertId, startDate, endDate],
    queryFn: async () => {
      if (!expertId) return [];

      const { data, error } = await supabase.rpc('get_expert_earnings_summary', {
        p_expert_id: expertId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) {
        console.error('Error fetching earnings:', error);
        throw error;
      }

      // Convert daily_earnings from cents to dollars if necessary, based on your DB storage.
      // Assuming it's in cents integer:
      return (data || []).map((row: any) => ({
        ...row,
        daily_earnings: row.daily_earnings / 100, // convert back to standard currency format
      })) as EarningSummary[];
    },
    enabled: !!expertId && !!startDate && !!endDate,
  });
}
