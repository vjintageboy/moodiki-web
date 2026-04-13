'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Appointment, User } from '@/lib/types/database.types';

// ============================================================================
// TYPES
// ============================================================================

export interface WeeklySession {
  id: string;
  patient: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  start_time: Date;
  end_time: Date;
  call_type: string;
  status: string;
  user_notes: string | null;
  expert_base_price: number | null;
  payment_status: string;
}

export interface MonthlyRevenuePoint {
  month: string; // e.g. "Apr 2026"
  revenue: number; // in cents
  sessions: number;
}

export interface WeeklyCalendarData {
  sessions: WeeklySession[];
  currentWeekStart: Date;
  currentWeekEnd: Date;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get the Monday of the week that contains the given date.
 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the Sunday (end) of the week.
 */
function getSunday(monday: Date): Date {
  const d = new Date(monday);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get abbreviated day name.
 */
function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Get month label for revenue chart.
 */
function getMonthLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ============================================================================
// HOOK: Weekly Sessions
// ============================================================================

/**
 * Fetch all sessions for the current week for a given expert.
 * Maps to: GET /sessions?expert_id={id}&date_from=...&date_to=...
 */
export function useWeeklySessions(expertId: string | undefined, weekOffset: number = 0) {
  return useQuery({
    queryKey: ['weekly-sessions', expertId, weekOffset],
    queryFn: async (): Promise<WeeklyCalendarData> => {
      if (!expertId) throw new Error('expertId is required');

      const supabase = createClient();

      // Calculate week boundaries
      const today = new Date();
      const todayMonday = getMonday(today);
      const weekMonday = new Date(todayMonday);
      weekMonday.setDate(weekMonday.getDate() + weekOffset * 7);
      const weekSunday = getSunday(weekMonday);

      // Fetch appointments for this week
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(
          `
          *,
          user:users!user_id(id, full_name, avatar_url)
        `
        )
        .eq('expert_id', expertId)
        .gte('appointment_date', weekMonday.toISOString())
        .lte('appointment_date', weekSunday.toISOString())
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      const sessions: WeeklySession[] = (appointments || []).map((apt) => {
        const startTime = new Date(apt.appointment_date);
        const endTime = new Date(startTime.getTime() + (apt.duration_minutes || 60) * 60000);

        return {
          id: apt.id,
          patient: {
            id: (apt as any).user?.id || '',
            full_name: (apt as any).user?.full_name || 'Unknown',
            avatar_url: (apt as any).user?.avatar_url || null,
          },
          start_time: startTime,
          end_time: endTime,
          call_type: apt.call_type,
          status: apt.status,
          user_notes: apt.user_notes,
          expert_base_price: apt.expert_base_price,
          payment_status: apt.payment_status,
        };
      });

      return {
        sessions,
        currentWeekStart: weekMonday,
        currentWeekEnd: weekSunday,
      };
    },
    enabled: !!expertId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ============================================================================
// HOOK: Monthly Revenue Aggregation
// ============================================================================

/**
 * Fetch monthly revenue aggregation for the last 6 months.
 * Maps to: GET /revenue?expert_id={id}&group_by=month
 */
export function useMonthlyRevenue(expertId: string | undefined) {
  return useQuery({
    queryKey: ['monthly-revenue', expertId],
    queryFn: async (): Promise<MonthlyRevenuePoint[]> => {
      if (!expertId) throw new Error('expertId is required');

      const supabase = createClient();

      // Calculate 6 months ago
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 5);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      // Fetch all paid/completed appointments in the date range
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_date, expert_base_price, payment_status, status')
        .eq('expert_id', expertId)
        .gte('appointment_date', startDate.toISOString())
        .lte('appointment_date', endDate.toISOString())
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      // Aggregate by month
      const monthMap = new Map<string, { revenue: number; sessions: number }>();

      // Initialize all 6 months
      for (let i = 0; i < 6; i++) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthMap.set(key, { revenue: 0, sessions: 0 });
        (monthMap as any).set(`${key}__label`, label);
      }

      // Sum up revenue (paid + completed appointments)
      for (const apt of appointments || []) {
        if (apt.payment_status === 'paid' && apt.status === 'completed' && apt.expert_base_price) {
          const date = new Date(apt.appointment_date);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (monthMap.has(key)) {
            const existing = monthMap.get(key)!;
            existing.revenue += apt.expert_base_price;
            existing.sessions += 1;
          }
        }
      }

      // Build result array
      const result: MonthlyRevenuePoint[] = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const data = monthMap.get(key)!;
        const label = (monthMap as any).get(`${key}__label`);
        result.push({
          month: label,
          revenue: data.revenue,
          sessions: data.sessions,
        });
      }

      return result;
    },
    enabled: !!expertId,
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================================================
// HOOK: Next Upcoming Session
// ============================================================================

/**
 * Fetch the very next upcoming session for an expert.
 * Maps to: GET /sessions?expert_id={id}&status=confirmed&upcoming=true&limit=1
 */
export function useNextSession(expertId: string | undefined) {
  return useQuery({
    queryKey: ['next-session', expertId],
    queryFn: async () => {
      if (!expertId) return null;

      const supabase = createClient();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('appointments')
        .select(
          `
          *,
          user:users!user_id(id, full_name, avatar_url)
        `
        )
        .eq('expert_id', expertId)
        .in('status', ['confirmed', 'pending'])
        .gte('appointment_date', now)
        .order('appointment_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        patient: {
          id: (data as any).user?.id || '',
          full_name: (data as any).user?.full_name || 'Unknown',
          avatar_url: (data as any).user?.avatar_url || null,
        },
        start_time: new Date(data.appointment_date),
        end_time: new Date(new Date(data.appointment_date).getTime() + (data.duration_minutes || 60) * 60000),
        call_type: data.call_type,
        status: data.status,
        user_notes: data.user_notes,
        duration_minutes: data.duration_minutes,
      };
    },
    enabled: !!expertId,
    staleTime: 1000 * 30, // 30 seconds — countdown needs freshness
    refetchInterval: 1000 * 30, // Refetch every 30 seconds for countdown
  });
}

// ============================================================================
// HOOK: Weekly Stats Summary
// ============================================================================

/**
 * Get quick stats for the current week.
 */
export function useWeeklyStats(expertId: string | undefined) {
  const { data: weekData, isLoading: weekLoading } = useWeeklySessions(expertId);

  const confirmedCount = weekData?.sessions.filter((s) => s.status === 'confirmed').length || 0;
  const pendingCount = weekData?.sessions.filter((s) => s.status === 'pending').length || 0;
  const completedCount = weekData?.sessions.filter((s) => s.status === 'completed').length || 0;
  const cancelledCount = weekData?.sessions.filter((s) => s.status === 'cancelled').length || 0;
  const weeklyRevenue = weekData?.sessions
    .filter((s) => s.payment_status === 'paid')
    .reduce((sum, s) => sum + (s.expert_base_price || 0), 0) || 0;

  return {
    totalSessions: weekData?.sessions.length || 0,
    confirmedCount,
    pendingCount,
    completedCount,
    cancelledCount,
    weeklyRevenue,
    isLoading: weekLoading,
  };
}

// ============================================================================
// HELPER: Week day columns
// ============================================================================

/**
 * Generate the 7 day columns for the current week.
 */
export function getWeekDays(weekStart: Date): Array<{
  date: Date;
  dayName: string;
  dayNum: number;
  isToday: boolean;
}> {
  const today = new Date();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push({
      date: d,
      dayName: getDayName(d),
      dayNum: d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
    });
  }
  return days;
}
