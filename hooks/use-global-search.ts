import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export type GlobalSearchResult = {
  type: 'user' | 'expert' | 'appointment' | 'notification' | string;
  id: string;
  title: string;
  subtitle: string;
  url_path: string;
};

export function useGlobalSearch(searchQuery: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['global-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim() === '') return [];

      const { data, error } = await supabase.rpc('admin_global_search', {
        search_query: searchQuery.trim(),
      });

      if (error) {
        console.error('Global search error:', error);
        throw error;
      }

      return (data as GlobalSearchResult[]) || [];
    },
    // Only run the query when there is a search term of at least 2 characters
    enabled: searchQuery.trim().length >= 2,
    staleTime: 60 * 1000, // Search results cache for 60 seconds
  });
}
