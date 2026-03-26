'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ExpertCalendar } from '@/components/dashboard/expert-calendar';
import {
  useExpertStats,
  useExpertUpcomingAppointments,
  useExpertProfile,
  useExpertAppointments,
  ExpertAppointmentWithUser,
} from '@/hooks/use-expert-dashboard';
import {
  Calendar,
  DollarSign,
  CheckCircle,
  Star,
  Settings,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface ExpertDashboardProps {
  expertId: string;
}

export function ExpertDashboard({ expertId }: ExpertDashboardProps) {
  const { data: stats, isLoading: statsLoading } = useExpertStats(expertId);
  const { data: appointments, isLoading: appointmentsLoading } =
    useExpertUpcomingAppointments(expertId);
  const { data: expertProfile, isLoading: profileLoading } =
    useExpertProfile(expertId);

  const { data: allAppointments } = useExpertAppointments(expertId);

  const isLoading = statsLoading || profileLoading;

  const handleAppointmentClick = (appointment: ExpertAppointmentWithUser) => {
    // Navigate to appointments tab/page
    window.location.href = `/dashboard/appointments?id=${appointment.id}`;
  };

  const recentActivities = allAppointments?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {expertProfile?.title ? `${expertProfile.title}` : ''}{' '}
          {expertProfile?.education?.split(',')[0]}
        </h2>
        <p className="text-muted-foreground mt-1">
          Here's your appointment summary and upcoming sessions.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total Appointments"
          value={stats?.totalAppointments || 0}
          icon={Calendar}
          description="All time"
          trend={
            stats && stats.totalAppointments > 0
              ? 'up'
              : ('neutral' as const)
          }
          isLoading={isLoading}
        />
        <StatsCard
          title="Upcoming"
          value={stats?.upcomingAppointments || 0}
          icon={Clock}
          description="Next 7 days"
          trend={
            stats && stats.upcomingAppointments > 0 ? 'up' : ('neutral' as const)
          }
          isLoading={isLoading}
        />
        <StatsCard
          title="Completed"
          value={stats?.completedSessions || 0}
          icon={CheckCircle}
          description="Sessions completed"
          trend="up"
          isLoading={isLoading}
        />
        <StatsCard
          title="Rating"
          value={stats?.averageRating ? stats.averageRating.toFixed(1) : '0'}
          icon={Star}
          description={
            stats?.averageRating
              ? `${stats.averageRating > 4.5 ? 'Excellent' : stats.averageRating > 4 ? 'Very Good' : stats.averageRating > 3.5 ? 'Good' : 'Fair'} reviews`
              : 'No reviews yet'
          }
          trend={stats?.averageRating && stats.averageRating >= 4.5 ? 'up' : 'neutral'}
          isLoading={isLoading}
        />
        <StatsCard
          title="Total Earnings"
          value={`$${stats?.totalEarnings ? (stats.totalEarnings / 100).toFixed(2) : '0.00'}`}
          icon={DollarSign}
          description="Paid appointments"
          trend={stats && stats.totalEarnings > 0 ? 'up' : ('neutral' as const)}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Appointments - 2 columns */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold">Upcoming Appointments</h3>
            <Link href="/appointments">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <ExpertCalendar
            appointments={appointments || []}
            isLoading={appointmentsLoading}
            onAppointmentClick={handleAppointmentClick}
          />
        </div>

        {/* Quick Actions - 1 column */}
        <div>
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/availability" className="w-full">
              <Button className="w-full" variant="default">
                Update Availability
              </Button>
            </Link>
            <Link href="/earnings" className="w-full block">
              <Button className="w-full" variant="outline">
                View Earnings
              </Button>
            </Link>
            <Link href="/settings" className="w-full">
              <Button className="w-full" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>

          {/* Quick Stats Box */}
          <Card className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
            <h4 className="font-semibold text-gray-900 mb-3">This Month</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sessions Completed</span>
                <span className="font-medium">
                  {stats?.completedSessions || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Confirmation</span>
                <span className="font-medium text-yellow-600">
                  {stats ? stats.totalAppointments - (stats.completedSessions || 0) - (stats.upcomingAppointments || 0) : 0}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                <span className="text-gray-700 font-medium">Avg. Rating</span>
                <span className="flex items-center gap-1 font-medium text-blue-600">
                  <Star className="w-4 h-4 fill-current" />
                  {stats?.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Recent Activity</h3>
          <Link href="/dashboard/appointments">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
        
        {recentActivities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((apt: ExpertAppointmentWithUser) => (
              <div key={apt.id} className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    apt.status === 'completed'
                      ? 'bg-green-500'
                      : apt.status === 'confirmed'
                        ? 'bg-blue-500'
                        : apt.status === 'cancelled'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                  }`}
                />
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    Appointment {apt.status}
                  </p>
                  <p className="text-sm text-gray-600">
                    Session with {apt.user?.full_name || 'a user'} on{' '}
                    {format(new Date(apt.appointment_date), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(apt.updated_at || apt.created_at || apt.appointment_date), 'MMM d, HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
