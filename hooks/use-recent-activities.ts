'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

/**
 * Recent Appointment data structure
 */
export interface RecentAppointment {
  id: string;
  appointment_date: string;
  status: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  expert: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

/**
 * Pending Expert data structure
 */
export interface PendingExpert {
  id: string;
  full_name: string;
  avatar_url: string | null;
  specialization: string;
  years_experience: number;
  rating: number;
}

/**
 * Recent User data structure
 */
export interface RecentUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

/**
 * Fetch the 10 most recent appointments with user and expert details
 */
export function useRecentAppointments() {
  return useQuery({
    queryKey: ['recent-appointments'],
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('appointments')
        .select(
          `
          id,
          appointment_date,
          status,
          expert_id,
          user:users!user_id (
            id,
            full_name,
            avatar_url
          )
        `
        )
        .order('appointment_date', { ascending: false })
        .limit(10);

      if (error) throw error;

      type RecentAppointmentRow = {
        id: string;
        appointment_date: string;
        status: string;
        expert_id: string;
        user: RecentAppointment['user'] | null;
      };

      const rows = (data ?? []) as unknown as RecentAppointmentRow[];
      const expertIds = [...new Set(rows.map((row) => row.expert_id).filter(Boolean))];

      const expertsById = new Map<string, RecentAppointment['expert']>();
      if (expertIds.length > 0) {
        const { data: expertUsers, error: expertUsersError } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .in('id', expertIds);

        if (expertUsersError) throw expertUsersError;

        for (const expertUser of expertUsers ?? []) {
          expertsById.set(expertUser.id, {
            id: expertUser.id,
            full_name: expertUser.full_name,
            avatar_url: expertUser.avatar_url,
          });
        }
      }

      return rows
        .filter((row) => row.user)
        .map((row) => ({
          id: row.id,
          appointment_date: row.appointment_date,
          status: row.status,
          user: row.user as RecentAppointment['user'],
          expert: expertsById.get(row.expert_id) ?? {
            id: row.expert_id,
            full_name: 'Unknown expert',
            avatar_url: null,
          },
        }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch approved experts (is_approved = true)
 */
export function useApprovedExperts() {
  return useQuery({
    queryKey: ['approved-experts'],
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('experts')
        .select(
          `
          id,
          bio,
          specialization,
          hourly_rate,
          rating,
          total_reviews,
          is_approved,
          years_experience,
          license_number,
          license_url,
          certificate_urls,
          education,
          university,
          graduation_year,
          title,
          created_at,
          updated_at,
          users (
            id,
            email,
            full_name,
            avatar_url
          )
        `
        )
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as any[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch pending expert applications (is_approved = false)
 */
export function usePendingExperts() {
  return useQuery({
    queryKey: ['pending-experts'],
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('experts')
        .select(
          `
          id,
          bio,
          specialization,
          years_experience,
          hourly_rate,
          rating,
          title,
          license_number,
          license_url,
          certificate_urls,
          created_at,
          users (
            id,
            email,
            full_name,
            avatar_url
          )
        `
        )
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as any[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes — pending list changes more frequently
  });
}

/**
 * Fetch the 5 most recent user registrations
 */
export function useRecentUsers() {
  return useQuery({
    queryKey: ['recent-users'],
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url, created_at')
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return data as RecentUser[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Approve a pending expert application
 */
export function useApproveExpert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expertId: string) => {
      const supabase = createClient();

      // Try with rejection_reason: null (clears any prior rejection); fall back if column doesn't exist yet
      const { error } = await supabase
        .from('experts')
        .update({ is_approved: true, rejection_reason: null })
        .eq('id', expertId);

      if (error) {
        if (error.code === '42703' || error.message?.includes('rejection_reason')) {
          // Column doesn't exist yet — update without it
          const { error: fallbackError } = await supabase
            .from('experts')
            .update({ is_approved: true })
            .eq('id', expertId);
          if (fallbackError) throw fallbackError;
        } else {
          throw error;
        }
      }

      return expertId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-experts'] });
      queryClient.invalidateQueries({ queryKey: ['approved-experts'] });
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      toast.success('Expert approved successfully');
    },
    onError: (error) => {
      console.error('Approve expert error:', error);
      toast.error('Failed to approve expert');
    },
  });
}

/**
 * Reject a pending expert application
 */
export function useRejectExpert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expertId, reason }: { expertId: string; reason?: string }) => {
      const supabase = createClient();

      // Soft-reject: keep the record, set is_approved = false and store reason
      const { error } = await supabase
        .from('experts')
        .update({
          is_approved: false,
          rejection_reason: reason?.trim() || null,
        })
        .eq('id', expertId);

      if (error) {
        if (error.code === '42703' || error.message?.includes('rejection_reason')) {
          // Column doesn't exist yet — update without it
          const { error: fallbackError } = await supabase
            .from('experts')
            .update({ is_approved: false })
            .eq('id', expertId);
          if (fallbackError) throw fallbackError;
        } else {
          throw error;
        }
      }

      return expertId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-experts'] });
      queryClient.invalidateQueries({ queryKey: ['rejected-experts'] });
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      toast.success('Expert application rejected');
    },
    onError: (error) => {
      console.error('Reject expert error:', error);
      toast.error('Failed to reject expert');
    },
  });
}

/**
 * Suspend an approved expert (set is_approved = false)
 */
export function useSuspendExpert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expertId: string) => {
      const supabase = createClient();

      const { error } = await supabase
        .from('experts')
        .update({ is_approved: false })
        .eq('id', expertId);

      if (error) throw error;

      return expertId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approved-experts'] });
      queryClient.invalidateQueries({ queryKey: ['rejected-experts'] });
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      toast.success('Expert suspended successfully');
    },
    onError: (error) => {
      console.error('Suspend expert error:', error);
      toast.error('Failed to suspend expert');
    },
  });
}

/**
 * Reactivate a suspended/rejected expert
 */
export function useReactivateExpert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expertId: string) => {
      const supabase = createClient();

      const { error } = await supabase
        .from('experts')
        .update({ is_approved: true, rejection_reason: null })
        .eq('id', expertId);

      if (error) throw error;

      return expertId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approved-experts'] });
      queryClient.invalidateQueries({ queryKey: ['rejected-experts'] });
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      toast.success('Expert reactivated successfully');
    },
    onError: (error) => {
      console.error('Reactivate expert error:', error);
      toast.error('Failed to reactivate expert');
    },
  });
}

/**
 * Delete a rejected expert permanently
 */
export function useDeleteExpertPermanently() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expertId: string) => {
      const supabase = createClient();

      const { error } = await supabase.from('experts').delete().eq('id', expertId);

      if (error) throw error;

      return expertId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approved-experts'] });
      queryClient.invalidateQueries({ queryKey: ['rejected-experts'] });
      queryClient.invalidateQueries({ queryKey: ['pending-experts'] });
      queryClient.invalidateQueries({ queryKey: ['experts'] });
      toast.success('Expert deleted permanently');
    },
    onError: (error) => {
      console.error('Delete expert error:', error);
      toast.error('Failed to delete expert');
    },
  });
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}
