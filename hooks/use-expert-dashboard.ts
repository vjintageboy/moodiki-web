import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Appointment, Expert } from '@/lib/types/database.types';

export interface ExpertStats {
  totalAppointments: number;
  upcomingAppointments: number;
  completedSessions: number;
  averageRating: number;
  totalEarnings: number;
}

export interface ExpertAppointmentWithUser extends Appointment {
  user?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

/**
 * Fetch expert statistics
 */
export function useExpertStats(expertId: string) {
  return useQuery({
    queryKey: ['expert-stats', expertId],
    queryFn: async () => {
      const supabase = createClient();

      // Fetch all appointments for this expert
      const { data: allAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('expert_id', expertId);

      if (appointmentsError) throw appointmentsError;

      // Calculate upcoming appointments (future dates)
      const now = new Date();
      const upcomingAppointments = (allAppointments || []).filter(
        (apt) => new Date(apt.appointment_date) > now
      );

      // Calculate completed sessions
      const completedSessions = (allAppointments || []).filter(
        (apt) => apt.status === 'completed'
      );

      // Calculate total earnings (paid appointments)
      const totalEarnings = (allAppointments || [])
        .filter((apt) => apt.payment_status === 'paid')
        .reduce((sum, apt) => sum + (apt.expert_base_price || 0), 0);

      // Fetch expert profile for rating
      const { data: expertData, error: expertError } = await supabase
        .from('experts')
        .select('rating')
        .eq('id', expertId)
        .single();

      if (expertError && expertError.code !== 'PGRST116') throw expertError;

      const stats: ExpertStats = {
        totalAppointments: allAppointments?.length || 0,
        upcomingAppointments: upcomingAppointments.length,
        completedSessions: completedSessions.length,
        averageRating: expertData?.rating || 0,
        totalEarnings,
      };

      return stats;
    },
    enabled: !!expertId,
  });
}

/**
 * Fetch expert's appointments with user details
 */
export function useExpertAppointments(expertId: string) {
  return useQuery({
    queryKey: ['expert-appointments', expertId],
    queryFn: async () => {
      const supabase = createClient();

      // Fetch appointments with user details
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(
          `
          *,
          user:user_id(id, full_name, email, avatar_url)
        `
        )
        .eq('expert_id', expertId)
        .order('appointment_date', { ascending: false });

      if (error) throw error;

      return (appointments || []) as ExpertAppointmentWithUser[];
    },
    enabled: !!expertId,
  });
}

/**
 * Fetch upcoming appointments for expert (next 7 days)
 */
export function useExpertUpcomingAppointments(expertId: string) {
  return useQuery({
    queryKey: ['expert-upcoming-appointments', expertId],
    queryFn: async () => {
      const supabase = createClient();

      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(
          `
          *,
          user:user_id(id, full_name, email, avatar_url)
        `
        )
        .eq('expert_id', expertId)
        .gte('appointment_date', now.toISOString())
        .lte('appointment_date', nextWeek.toISOString())
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      return (appointments || []) as ExpertAppointmentWithUser[];
    },
    enabled: !!expertId,
  });
}

/**
 * Fetch expert profile info
 */
export function useExpertProfile(expertId: string) {
  return useQuery({
    queryKey: ['expert-profile', expertId],
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('experts')
        .select('*')
        .eq('id', expertId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Expert | null;
    },
    enabled: !!expertId,
  });
}
