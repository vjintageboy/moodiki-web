'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Report } from '@/lib/types';
import type { PostWithAuthor } from './use-posts';

/**
 * Report a post
 */
export function useReportPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reason, userId }: { postId: string; reason: string; userId: string }) => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('reports')
        .insert({
          post_id: postId,
          user_id: userId,
          reason,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to report post');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['post-reports', data.post_id] });
      toast({
        title: 'Post Reported',
        description: 'Thank you for your report. Our team will review this post.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while reporting the post.',
        variant: 'destructive',
      });
    }
  });
}

/**
 * Get report count for a single post
 */
export function usePostReportCount(postId: string | null) {
  return useQuery({
    queryKey: ['post-reports', postId],
    queryFn: async () => {
      if (!postId) return 0;

      const supabase = createClient();
      const { count, error } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (error) {
        console.error('Error fetching report count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!postId,
  });
}

/**
 * Fetch all posts that have been reported with report details
 */
export function useReportedPosts() {
  return useQuery({
    queryKey: ['reported-posts'],
    queryFn: async () => {
      const supabase = createClient();

      // Get all reports with reasons
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          post_id,
          reason,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false });

      if (reportsError) {
        throw new Error(reportsError.message);
      }

      if (!reportsData || reportsData.length === 0) return [];

      // Group reports by post_id
      const reportsByPost: Record<string, { count: number; reasons: string[] }> = {};
      reportsData.forEach(r => {
        if (!reportsByPost[r.post_id]) {
          reportsByPost[r.post_id] = { count: 0, reasons: [] };
        }
        reportsByPost[r.post_id].count++;
        if (r.reason) reportsByPost[r.post_id].reasons.push(r.reason);
      });

      const reportedPostIds = Object.keys(reportsByPost);

      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_author_id_fkey (
            id,
            full_name,
            avatar_url,
            email
          )
        `)
        .in('id', reportedPostIds)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Attach report counts to posts
      return (posts as any[]).map(post => ({
        ...post,
        reportCount: reportsByPost[post.id]?.count || 0,
        reportReasons: reportsByPost[post.id]?.reasons || [],
      }));
    },
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Dismiss reports for a post (marks as reviewed)
 */
export function useDismissReports() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('post_id', postId);

      if (error) throw new Error(error.message || 'Failed to dismiss reports');
      return postId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reported-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
