'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { User, UserInsert } from '@/lib/types';
import { useCallback } from 'react';

/**
 * Filter options for fetching users
 */
export interface UserFilters {
  role?: string;
  search?: string;
  sortBy?: 'created_at' | 'email' | 'full_name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Response type for paginated user list
 */
export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * User profile with statistics
 */
export interface UserWithStats extends User {
  moodEntriesCount: number;
  appointmentsCount: number;
  postsCount: number;
}

/**
 * Fetch list of users with optional filters and pagination
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useUsers({
 *   role: 'user',
 *   search: 'john',
 *   sortBy: 'created_at',
 *   page: 1,
 *   limit: 20
 * });
 *
 * return (
 *   <div>
 *     {isLoading && <p>Loading...</p>}
 *     {data?.users.map(user => <p key={user.id}>{user.full_name}</p>)}
 *   </div>
 * );
 * ```
 */
export function useUsers(filters?: UserFilters) {
  const defaultFilters: UserFilters = {
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
    ...filters,
  };

  return useQuery({
    queryKey: ['users', defaultFilters],
    queryFn: async (): Promise<UserListResponse> => {
      const supabase = createClient();

      // Calculate offset for pagination
      const offset = ((defaultFilters.page || 1) - 1) * (defaultFilters.limit || 20);

      // Build query
      let query = supabase.from('users').select('*', { count: 'exact' });

      // Apply role filter
      if (defaultFilters.role) {
        query = query.eq('role', defaultFilters.role);
      }

      // Apply search filter
      if (defaultFilters.search) {
        query = query.or(
          `full_name.ilike.%${defaultFilters.search}%,email.ilike.%${defaultFilters.search}%`
        );
      }

      // Apply sorting
      const sortField = defaultFilters.sortBy || 'created_at';
      const ascending = defaultFilters.sortOrder === 'asc';
      query = query.order(sortField, { ascending });

      // Apply pagination
      query = query.range(offset, offset + (defaultFilters.limit || 20) - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      const total = count || 0;
      const limit = defaultFilters.limit || 20;
      const totalPages = Math.ceil(total / limit);

      return {
        users: data || [],
        total,
        page: defaultFilters.page || 1,
        limit,
        totalPages,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Fetch a single user with related statistics
 *
 * @param id - User ID (must be provided to enable the query)
 *
 * @example
 * ```tsx
 * const { data: user, isLoading } = useUser('user-123');
 *
 * if (isLoading) return <p>Loading user...</p>;
 *
 * return (
 *   <div>
 *     <h1>{user?.full_name}</h1>
 *     <p>Mood entries: {user?.moodEntriesCount}</p>
 *     <p>Appointments: {user?.appointmentsCount}</p>
 *     <p>Posts: {user?.postsCount}</p>
 *   </div>
 * );
 * ```
 */
export function useUser(id?: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async (): Promise<UserWithStats> => {
      if (!id) throw new Error('User ID is required');

      const supabase = createClient();

      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        throw userError;
      }

      if (!userData) {
        throw new Error('User not found');
      }

      // Fetch related statistics in parallel
      const [moodEntriesResult, appointmentsResult, postsResult] =
        await Promise.all([
          // Mood entries count
          supabase
            .from('mood_entries')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', id),

          // Appointments count
          supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .or(`user_id.eq.${id},expert_id.eq.${id}`),

          // Posts count
          supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', id),
        ]);

      return {
        ...userData,
        moodEntriesCount: moodEntriesResult.count || 0,
        appointmentsCount: appointmentsResult.count || 0,
        postsCount: postsResult.count || 0,
      };
    },
    enabled: !!id, // Only fetch if id is provided
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Create a new user with authentication
 *
 * @example
 * ```tsx
 * const createUser = useCreateUser();
 *
 * const handleCreate = async () => {
 *   try {
 *     await createUser.mutateAsync({
 *       email: 'user@example.com',
 *       password: 'secure-password',
 *       full_name: 'John Doe',
 *       role: 'user'
 *     });
 *   } catch (error) {
 *     console.error('Failed to create user:', error);
 *   }
 * };
 *
 * return (
 *   <div>
 *     <button
 *       onClick={handleCreate}
 *       disabled={createUser.isPending}
 *     >
 *       {createUser.isPending ? 'Creating...' : 'Create User'}
 *     </button>
 *   </div>
 * );
 * ```
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UserInsert & { password?: string }) => {
      const { password, ...userData } = data;

      if (!password || !userData.email) {
        throw new Error('Email and password are required to create a user');
      }

      // Call the secure Admin API route instead of client-side auth.signUp
      // This prevents the admin from being logged out.
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password,
          full_name: userData.full_name,
          role: userData.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user via Admin API');
      }

      return result.user;
    },
    onSuccess: (createdUser) => {
      // Invalidate the users list query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.setQueryData(['user', createdUser.id], createdUser);
      toast.success(`User ${createdUser.email} created successfully`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to create user: ${message}`);
    },
  });
}

/**
 * Update an existing user
 *
 * @example
 * ```tsx
 * const updateUser = useUpdateUser();
 *
 * const handleUpdate = async () => {
 *   try {
 *     await updateUser.mutateAsync({
 *       id: 'user-123',
 *       full_name: 'Jane Doe',
 *       avatar_url: 'https://example.com/avatar.jpg'
 *     });
 *   } catch (error) {
 *     console.error('Failed to update user:', error);
 *   }
 * };
 *
 * return (
 *   <button onClick={handleUpdate} disabled={updateUser.isPending}>
 *     {updateUser.isPending ? 'Updating...' : 'Update User'}
 *   </button>
 * );
 * ```
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<User> & { id: string }) => {
      const supabase = createClient();
      const { id, ...updateData } = data;

      // Only allow specific fields to be updated
      const allowedFields = [
        'full_name',
        'avatar_url',
        'role',
        'date_of_birth',
        'gender',
        'goals',
        'preferences',
        'streak_count',
        'longest_streak',
        'total_activities',
      ];

      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
      );

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(filteredData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }

      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      // Invalidate both the users list and individual user queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', updatedUser.id] });
      toast.success(`User ${updatedUser.email} updated successfully`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to update user: ${message}`);
    },
  });
}

/**
 * Delete a user
 *
 * Note: This mutation requires confirmation before deletion.
 * Implement confirmation in your component using a dialog or alert.
 *
 * @example
 * ```tsx
 * const deleteUser = useDeleteUser();
 *
 * const handleDelete = async (userId: string) => {
 *   if (!window.confirm('Are you sure you want to delete this user?')) {
 *     return;
 *   }
 *
 *   try {
 *     await deleteUser.mutateAsync({ id: userId });
 *   } catch (error) {
 *     console.error('Failed to delete user:', error);
 *   }
 * };
 *
 * return (
 *   <button
 *     onClick={() => handleDelete('user-123')}
 *     disabled={deleteUser.isPending}
 *   >
 *     {deleteUser.isPending ? 'Deleting...' : 'Delete User'}
 *   </button>
 * );
 * ```
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; email?: string }) => {
      const supabase = createClient();

      // Step 1: Delete from public.users (cascades to related data via foreign keys)
      const { error: deleteError } = await supabase.from('users').delete().eq('id', id);

      if (deleteError) {
        console.error('Error deleting user from public.users:', deleteError);
        throw deleteError;
      }

      // Step 2: Delete from auth.users using admin API
      // Note: This requires service role JWT - the delete from public.users
      // should cascade delete all related data through foreign key constraints
      // If additional cleanup is needed, it would be done here with proper admin credentials

      return id;
    },
    onSuccess: (deletedUserId, variables) => {
      // Remove the deleted user from the cache
      queryClient.removeQueries({ queryKey: ['user', deletedUserId] });

      // Invalidate the users list to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });

      const emailDisplay = variables.email ? ` (${variables.email})` : '';
      toast.success(`User${emailDisplay} deleted successfully`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to delete user: ${message}`);
    },
  });
}

/**
 * Hook to batch invalidate all user-related queries
 * Useful when performing operations that affect multiple user queries
 *
 * @example
 * ```tsx
 * const invalidateUsers = useInvalidateUsers();
 *
 * const handleBulkOperation = async () => {
 *   try {
 *     await someBulkOperation();
 *     invalidateUsers();
 *   } catch (error) {
 *     console.error('Bulk operation failed:', error);
 *   }
 * };
 * ```
 */
export function useInvalidateUsers() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  }, [queryClient]);
}

/**
 * Toggle user lock status
 *
 * @example
 * ```tsx
 * const toggleLock = useToggleUserLock();
 *
 * const handleToggle = async () => {
 *   await toggleLock.mutateAsync({ userId: '123', is_locked: true });
 * };
 * ```
 */
export function useToggleUserLock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, is_locked }: { userId: string; is_locked: boolean }) => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('users')
        .update({ is_locked })
        .eq('id', userId)
        .select('id, is_locked')
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to update user lock status');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate the users list so it refetches and updates the UI
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      
      toast.success(data.is_locked ? 'User locked successfully' : 'User unlocked successfully');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to update user lock status: ${message}`);
    }
  });
}
