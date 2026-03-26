'use client'

import { StatsCard } from '@/components/dashboard/stats-card'
import {
  Users,
  UserCheck,
  Calendar,
  MessageSquare,
  Music,
  MessageCircle,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { RecentAppointments } from '@/components/dashboard/recent-appointments'
import { PendingExpertsCards } from '@/components/dashboard/pending-experts-cards'
import { RecentUsers } from '@/components/dashboard/recent-users'
import { UserGrowthChart } from '@/components/dashboard/user-growth-chart'
import { AppointmentsByStatusChart } from '@/components/dashboard/appointments-by-status-chart'
import { ExpertsBySpecializationChart } from '@/components/dashboard/experts-by-specialization-chart'
import { MoodTrendChart } from '@/components/dashboard/mood-trend-chart'
import Link from 'next/link'
import type { DashboardStats } from '@/lib/queries/dashboard'

interface DashboardOverviewProps {
  stats?: DashboardStats
}

/**
 * Dashboard Stats Overview - Client Component
 * 
 * Optimized to receive pre-fetched stats from server
 * No client-side data fetching needed
 */
export function DashboardOverview({ stats }: DashboardOverviewProps) {
  const isLoading = !stats

  return (
    <div className="space-y-8 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2">
            Key metrics and statistics for your platform
          </p>
        </div>
      </div>

      {/* Primary Stats Grid - Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users Card */}
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers ?? '---'}
          icon={Users}
          description={
            stats && stats.newUsersThisMonth > 0
              ? `+${stats.newUsersThisMonth} this month`
              : undefined
          }
          trend={stats && stats.newUsersThisMonth > 0 ? 'up' : 'neutral'}
          isLoading={isLoading}
        />

        {/* Approved Experts Card */}
        <StatsCard
          title="Approved Experts"
          value={stats?.totalExpertsApproved ?? '---'}
          icon={UserCheck}
          description={
            stats && stats.totalExpertsApproved > 0
              ? `${stats.totalExpertsApproved} available`
              : undefined
          }
          trend={stats && stats.totalExpertsApproved > 5 ? 'up' : 'neutral'}
          isLoading={isLoading}
        />

        {/* Pending Expert Applications Card */}
        <StatsCard
          title="Pending Approvals"
          value={stats?.pendingExpertApplications ?? '---'}
          icon={AlertCircle}
          description={
            stats && stats.pendingExpertApplications > 0
              ? `${stats.pendingExpertApplications} waiting`
              : 'All caught up'
          }
          trend={stats && stats.pendingExpertApplications > 5 ? 'up' : 'down'}
          isLoading={isLoading}
        />

        {/* Total Appointments Card */}
        <StatsCard
          title="Total Appointments"
          value={stats?.totalAppointments ?? '---'}
          icon={Calendar}
          description={
            stats && stats.appointmentsToday > 0
              ? `${stats.appointmentsToday} today`
              : undefined
          }
          trend={stats && stats.totalAppointments > 100 ? 'up' : 'neutral'}
          isLoading={isLoading}
        />
      </div>

      {/* Engagement Metrics Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Engagement Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Appointments This Week */}
          <StatsCard
            title="Appointments This Week"
            value={stats?.appointmentsThisWeek ?? '---'}
            icon={Calendar}
            description={
              stats && stats.appointmentsThisWeek > 0
                ? `${stats.appointmentsThisWeek} scheduled`
                : 'No appointments'
            }
            trend={stats && stats.appointmentsThisWeek > 10 ? 'up' : 'neutral'}
            isLoading={isLoading}
          />

          {/* Community Posts */}
          <StatsCard
            title="Community Posts"
            value={stats?.totalCommunityPosts ?? '---'}
            icon={MessageSquare}
            description="User discussions"
            trend={stats && stats.totalCommunityPosts > 50 ? 'up' : 'neutral'}
            isLoading={isLoading}
          />

          {/* Meditation Content */}
          <StatsCard
            title="Guided Meditations"
            value={stats?.totalMeditations ?? '---'}
            icon={Music}
            description="Available sessions"
            trend="neutral"
            isLoading={isLoading}
          />

          {/* Active Chat Rooms */}
          <StatsCard
            title="Active Chat Rooms"
            value={stats?.activeChatRooms ?? '---'}
            icon={MessageCircle}
            description="Live conversations"
            trend={stats && stats.activeChatRooms > 5 ? 'up' : 'neutral'}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Financial & Quality Metrics */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Platform Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Revenue */}
          <StatsCard
            title="Total Revenue"
            value={
              stats?.totalRevenue
                ? `$${(stats.totalRevenue / 100).toFixed(2)}`
                : '---'
            }
            icon={DollarSign}
            description={
              stats && stats.totalRevenue > 0
                ? `${stats.totalAppointments} paid appointments`
                : 'No revenue yet'
            }
            trend={stats && stats.totalRevenue > 1000 ? 'up' : 'neutral'}
            isLoading={isLoading}
          />

          {/* Average Rating */}
          <StatsCard
            title="Average Appointment Rating"
            value={
              stats?.averageAppointmentRating
                ? stats.averageAppointmentRating.toFixed(1)
                : '---'
            }
            icon={TrendingUp}
            description={
              stats && stats.averageAppointmentRating
                ? `Out of 5.0 stars`
                : 'No ratings yet'
            }
            trend={
              stats && stats.averageAppointmentRating >= 4.5
                ? 'up'
                : stats && stats.averageAppointmentRating >= 4.0
                  ? 'neutral'
                  : 'down'
            }
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Analytics</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          <UserGrowthChart />
          <AppointmentsByStatusChart />
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <ExpertsBySpecializationChart />
          <MoodTrendChart />
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Recent Activities</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Appointments Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Appointments</CardTitle>
                <Link
                  href="/dashboard/appointments"
                  className="text-sm text-primary hover:underline"
                >
                  View All →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <RecentAppointments />
            </CardContent>
          </Card>

          {/* Pending Experts Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Pending Experts</CardTitle>
                <Link
                  href="/dashboard/experts/pending"
                  className="text-sm text-primary hover:underline"
                >
                  View All →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <PendingExpertsCards />
            </CardContent>
          </Card>
        </div>

        {/* Recent Users Card - Full Width */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Latest User Registrations</CardTitle>
              <Link
                href="/dashboard/users"
                className="text-sm text-primary hover:underline"
              >
                View All →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <RecentUsers />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

