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

/**
 * Fetch daily revenue for the last 30 days from appointments table
 */
export function useRevenueData() {
  return useQuery({
    queryKey: ['daily-revenue'],
    queryFn: async () => {
      const supabase = createClient();

      const endDate = new Date();
      const startDate = subDays(endDate, 29);

      // Use appointments table with payment_status=paid (no 'transactions' table)
      const { data, error } = await supabase
        .from('appointments')
        .select('expert_base_price, appointment_date')
        .eq('payment_status', 'paid')
        .gte('appointment_date', startDate.toISOString())
        .lte('appointment_date', endDate.toISOString())
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      // Group by date
      const dailyRevenue = new Map<string, number>();

      eachDayOfInterval({ start: startDate, end: endDate }).forEach((date) => {
        const dateKey = format(date, 'MMM d');
        dailyRevenue.set(dateKey, 0);
      });

      if (data) {
        data.forEach((tx) => {
          const date = new Date(tx.appointment_date);
          const dateKey = format(date, 'MMM d');
          const current = dailyRevenue.get(dateKey) || 0;
          dailyRevenue.set(dateKey, current + (tx.expert_base_price || 0));
        });
      }

      return Array.from(dailyRevenue.entries()).map(([date, amount]) => ({
        date,
        amount: Math.round(amount),
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch user retention data (cohort-style: new vs returning users by week)
 */
export function useUserRetention() {
  return useQuery({
    queryKey: ['user-retention'],
    queryFn: async () => {
      const supabase = createClient();

      // Get last 8 weeks of user activity
      const endDate = new Date();
      const startDate = subDays(endDate, 56);

      const { data, error } = await supabase
        .from('mood_entries')
        .select('user_id, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by week
      const weeklyData = new Map<string, { newUsers: number; returningUsers: number }>();

      // Get user signup dates to determine new vs returning
      const { data: usersData } = await supabase
        .from('users')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString());

      const newUserIds = new Set(usersData?.map(u => u.id) || []);

      // Initialize weeks
      for (let i = 7; i >= 0; i--) {
        const weekStart = subDays(endDate, i * 7);
        const weekKey = format(weekStart, 'MMM d');
        weeklyData.set(weekKey, { newUsers: 0, returningUsers: 0 });
      }

      // Count unique active users per week
      const userFirstSeen = new Map<string, string>();

      if (data) {
        data.forEach((entry) => {
          const date = new Date(entry.created_at);
          const daysAgo = Math.floor((endDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          const weekIndex = Math.floor(daysAgo / 7);
          const weekStart = subDays(endDate, weekIndex * 7);
          const weekKey = format(weekStart, 'MMM d');

          const current = weeklyData.get(weekKey) || { newUsers: 0, returningUsers: 0 };

          if (!userFirstSeen.has(entry.user_id)) {
            userFirstSeen.set(entry.user_id, weekKey);
            if (newUserIds.has(entry.user_id)) {
              current.newUsers++;
            } else {
              current.returningUsers++;
            }
          } else {
            current.returningUsers++;
          }

          weeklyData.set(weekKey, current);
        });
      }

      return Array.from(weeklyData.entries())
        .map(([week, counts]) => ({
          week,
          ...counts,
        }))
        .reverse();
    },
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Fetch expert performance data (top experts by appointments and revenue)
 */
export function useExpertPerformance() {
  return useQuery({
    queryKey: ['expert-performance'],
    queryFn: async () => {
      const supabase = createClient();

      // Fetch approved experts with their user info (no fkey name needed)
      const { data: expertsData, error: expertsError } = await supabase
        .from('experts')
        .select(`
          id,
          specialization,
          rating,
          total_reviews,
          users(id, full_name, email)
        `)
        .eq('is_approved', true);

      if (expertsError) throw expertsError;
      if (!expertsData || expertsData.length === 0) return [];

      const expertIds = expertsData.map(e => e.id);

      // Get appointment stats per expert (use expert_base_price not amount)
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('expert_id, expert_base_price, status')
        .in('expert_id', expertIds);

      const expertStats = expertsData.map(expert => {
        const expertAppts = appointmentsData?.filter(a => a.expert_id === expert.id) || [];
        const completedAppts = expertAppts.filter(a => a.status === 'completed');
        const totalRevenue = completedAppts.reduce((sum, a) => sum + (a.expert_base_price || 0), 0);
        const user = (expert.users as any);

        return {
          id: expert.id,
          name: user?.full_name || user?.email || 'Unknown',
          specialization: expert.specialization || 'General',
          totalAppointments: expertAppts.length,
          completedAppointments: completedAppts.length,
          revenue: totalRevenue,
          // Use rating from experts table directly (stored after reviews)
          avgRating: expert.rating ? Math.round((expert.rating as number) * 10) / 10 : 0,
          ratingCount: expert.total_reviews || 0,
        };
      });

      return expertStats.sort((a, b) => b.revenue - a.revenue);
    },
    staleTime: 1000 * 60 * 10,
  });
}
