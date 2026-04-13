import { createClient } from '@/lib/supabase/server';
import { Appointment, Expert } from '@/lib/types/database.types';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export interface ExpertDashboardData {
  stats: {
    totalAppointments: number;
    upcomingAppointments: number;
    completedSessions: number;
    averageRating: number;
    totalEarnings: number;
  };
  upcomingAppointments: any[];
  revenueData: {
    month: string;
    revenue: number;
  }[];
  profile: Expert | null;
}

/**
 * Fetch comprehensive expert dashboard data server-side
 */
export async function getExpertDashboardData(expertId: string): Promise<ExpertDashboardData> {
  const supabase = await createClient();

  const now = new Date();
  const sixMonthsAgo = startOfMonth(subMonths(now, 5));

  try {
    // Parallel fetching for performance
    const [
      allAppointmentsResult,
      upcomingAppointmentsResult,
      expertProfileResult,
    ] = await Promise.all([
      // 1. All appointments for stats and revenue
      supabase
        .from('appointments')
        .select('*')
        .eq('expert_id', expertId),
      
      // 2. Next 3 upcoming appointments with user details
      supabase
        .from('appointments')
        .select(`
          *,
          user:user_id(id, full_name, avatar_url)
        `)
        .eq('expert_id', expertId)
        .gte('appointment_date', now.toISOString())
        .order('appointment_date', { ascending: true })
        .limit(3),
      
      // 3. Expert profile
      supabase
        .from('experts')
        .select('*')
        .eq('id', expertId)
        .single(),
    ]);

    const allAppointments = allAppointmentsResult.data || [];
    const upcomingAppointments = upcomingAppointmentsResult.data || [];
    const expertProfile = expertProfileResult.data;

    // Calculate Stats
    const completedSessions = allAppointments.filter(a => a.status === 'completed');
    const totalEarnings = allAppointments
      .filter(a => a.payment_status === 'paid')
      .reduce((sum, a) => sum + (a.expert_base_price || 0), 0);
    
    // Aggregate Monthly Revenue (Last 6 Months)
    const revenueMap = new Map<string, number>();
    for (let i = 0; i < 6; i++) {
      const monthDate = subMonths(now, i);
      const monthKey = format(monthDate, 'MMM');
      revenueMap.set(monthKey, 0);
    }

    allAppointments
      .filter(a => a.payment_status === 'paid' && new Date(a.appointment_date) >= sixMonthsAgo)
      .forEach(a => {
        const monthKey = format(new Date(a.appointment_date), 'MMM');
        if (revenueMap.has(monthKey)) {
          revenueMap.set(monthKey, (revenueMap.get(monthKey) || 0) + (a.expert_base_price || 0));
        }
      });

    const revenueData = Array.from(revenueMap.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .reverse();

    return {
      stats: {
        totalAppointments: allAppointments.length,
        upcomingAppointments: allAppointments.filter(a => new Date(a.appointment_date) > now).length,
        completedSessions: completedSessions.length,
        totalEarnings: totalEarnings,
        averageRating: expertProfile?.rating || 0,
      },
      upcomingAppointments,
      revenueData,
      profile: expertProfile,
    };
  } catch (error) {
    console.error('[getExpertDashboardData] Error:', error);
    throw error;
  }
}
