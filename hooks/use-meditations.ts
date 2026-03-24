'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Meditation } from '@/lib/types/database.types';

const supabase = createClient();

// Fetch all meditations with optional filters
export function useMeditations(filters?: {
  category?: string;
  level?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['meditations', filters],
    queryFn: async () => {
      let query = supabase
        .from('meditations')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.level) {
        query = query.eq('level', filters.level);
      }

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Meditation[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch single meditation by ID
export function useMeditation(id: string | null) {
  return useQuery({
    queryKey: ['meditation', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('meditations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Meditation;
    },
    enabled: !!id,
  });
}

// Create new meditation
export function useCreateMeditation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meditation: Partial<Meditation>) => {
      const { data, error } = await supabase
        .from('meditations')
        .insert([meditation])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meditations'] });
    },
  });
}

// Update meditation
export function useUpdateMeditation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Meditation>;
    }) => {
      const { data, error } = await supabase
        .from('meditations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meditations'] });
      queryClient.invalidateQueries({ queryKey: ['meditation', variables.id] });
    },
  });
}

// Delete meditation
export function useDeleteMeditation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('meditations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meditations'] });
    },
  });
}

// Upload audio file to Supabase storage
export async function uploadMeditationAudio(
  file: File,
  meditationId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${meditationId}-${Date.now()}.${fileExt}`;
  const filePath = `meditations/audio/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('meditation-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from('meditation-files').getPublicUrl(filePath);

  return publicUrl;
}

// Upload thumbnail image to Supabase storage
export async function uploadMeditationThumbnail(
  file: File,
  meditationId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${meditationId}-${Date.now()}.${fileExt}`;
  const filePath = `meditations/thumbnails/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('meditation-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from('meditation-files').getPublicUrl(filePath);

  return publicUrl;
}

// Delete file from storage
export async function deleteMeditationFile(url: string): Promise<void> {
  try {
    // Extract file path from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/meditation-files/');
    if (pathParts.length < 2) return;

    const filePath = pathParts[1];

    await supabase.storage.from('meditation-files').remove([filePath]);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

// Get meditation statistics
export function useMeditationStats() {
  return useQuery({
    queryKey: ['meditation-stats'],
    queryFn: async () => {
      const { data: meditations, error } = await supabase
        .from('meditations')
        .select('category, level');

      if (error) throw error;

      const total = meditations.length;
      const byCategory: Record<string, number> = {};
      const byLevel: Record<string, number> = {};

      meditations.forEach((m) => {
        if (m.category) {
          byCategory[m.category] = (byCategory[m.category] || 0) + 1;
        }
        if (m.level) {
          byLevel[m.level] = (byLevel[m.level] || 0) + 1;
        }
      });

      return {
        total,
        byCategory,
        byLevel,
      };
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
