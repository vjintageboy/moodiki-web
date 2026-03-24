'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { eachMonthOfInterval, subMonths, format, eachDayOfInterval, subDays } from 'date-fns';

export interface UserGrowthData {
  month: string;
  users: number;
}

export interface AppointmentStatusData {
  status: string;
  count: number;
  percentage: number;
}

export interface ExpertSpecializationData {
  name: string;
  value: number;
}

export interface MoodTrendData {
  date: string;
  score: number;
}

/**
 * Fetch user growth data for the last 12 months
 */
export function useUserGrowthData() {
  return useQuery({
    queryKey: ['user-growth'],
    queryFn: async () => {
      const supabase = createClient();
      
      // Get last 12 months date range
      const endDate = new Date();
      const startDate = subMonths(endDate, 11);
      
      const { data, error } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthCounts = new Map<string, number>();
      
      // Initialize all months with 0
      eachMonthOfInterval({ start: startDate, end: endDate }).forEach((date) => {
        const monthKey = format(date, 'MMM yyyy');
        monthCounts.set(monthKey, 0);
      });

      // Count users by month
      if (data) {
        data.forEach((user) => {
          const date = new Date(user.created_at);
          const monthKey = format(date, 'MMM yyyy');
          monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
        });
      }

      return Array.from(monthCounts.entries()).map(([month, users]) => ({
        month,
        users,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch appointments grouped by status
 */
export function useAppointmentsByStatus() {
  return useQuery({
    queryKey: ['appointments-by-status'],
    queryFn: async () => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('appointments')
        .select('status');

      if (error) throw error;

      const statusCounts = {
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
      };

      if (data) {
        data.forEach((appointment) => {
          const status = appointment.status as keyof typeof statusCounts;
          if (status in statusCounts) {
            statusCounts[status]++;
          }
        });
      }

      const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

      const result: AppointmentStatusData[] = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));

      return result;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch experts grouped by specialization
 */
export function useExpertsBySpecialization() {
  return useQuery({
    queryKey: ['experts-by-specialization'],
    queryFn: async () => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('experts')
        .select('specialization')
        .eq('is_approved', true);

      if (error) throw error;

      const specializationCounts = new Map<string, number>();

      if (data) {
        data.forEach((expert) => {
          if (expert.specialization) {
            const count = specializationCounts.get(expert.specialization) || 0;
            specializationCounts.set(expert.specialization, count + 1);
          }
        });
      }

      return Array.from(specializationCounts.entries()).map(([name, value]) => ({
        name,
        value,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch mood trend data for the last 30 days
 */
export function useMoodTrendData() {
  return useQuery({
    queryKey: ['mood-trend'],
    queryFn: async () => {
      const supabase = createClient();
      
      // Get last 30 days
      const endDate = new Date();
      const startDate = subDays(endDate, 29);

      const { data, error } = await supabase
        .from('mood_entries')
        .select('mood_score, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date and calculate average
      const dateScores = new Map<string, { sum: number; count: number }>();

      // Initialize all dates with 0
      eachDayOfInterval({ start: startDate, end: endDate }).forEach((date) => {
        const dateKey = format(date, 'MMM d');
        dateScores.set(dateKey, { sum: 0, count: 0 });
      });

      // Aggregate scores by date
      if (data) {
        data.forEach((entry) => {
          const date = new Date(entry.created_at);
          const dateKey = format(date, 'MMM d');
          const current = dateScores.get(dateKey) || { sum: 0, count: 0 };
          dateScores.set(dateKey, {
            sum: current.sum + (entry.mood_score || 0),
            count: current.count + 1,
          });
        });
      }

      return Array.from(dateScores.entries()).map(([date, { sum, count }]) => ({
        date,
        score: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}
