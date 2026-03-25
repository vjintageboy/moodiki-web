'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Post } from '@/lib/types/database.types';

const supabase = createClient();

interface PostWithAuthor extends Post {
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  };
}

// Fetch all posts with optional filters
export function usePosts(filters?: {
  category?: string;
  search?: string;
  authorId?: string;
}) {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: async () => {
      let query = supabase
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
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.authorId) {
        query = query.eq('author_id', filters.authorId);
      }

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PostWithAuthor[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Fetch single post by ID
export function usePost(id: string | null) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
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
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as PostWithAuthor;
    },
    enabled: !!id,
  });
}

// Delete post (admin only)
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post-stats'] });
    },
  });
}

// Toggle post visibility (hide / unhide) — admin moderation
export function useTogglePostVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_hidden }: { id: string; is_hidden: boolean }) => {
      const { data, error } = await supabase
        .from('posts')
        .update({ is_hidden })
        .eq('id', id)
        .select('id, is_hidden')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', data.id] });
    },
  });
}

// Update post (admin can moderate content)
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Post>;
    }) => {
      const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] });
    },
  });
}

// Get post statistics
export function usePostStats() {
  return useQuery({
    queryKey: ['post-stats'],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('category, likes_count, comment_count');

      if (error) throw error;

      const total = posts.length;
      const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
      const totalComments = posts.reduce((sum, p) => sum + (p.comment_count || 0), 0);
      const byCategory: Record<string, number> = {};

      posts.forEach((p) => {
        if (p.category) {
          byCategory[p.category] = (byCategory[p.category] || 0) + 1;
        }
      });

      return {
        total,
        totalLikes,
        totalComments,
        byCategory,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get post comments
export function usePostComments(postId: string | null) {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      if (!postId) return [];

      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          user:users!post_comments_user_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });
}

// Delete comment (admin moderation)
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments'] });
    },
  });
}
