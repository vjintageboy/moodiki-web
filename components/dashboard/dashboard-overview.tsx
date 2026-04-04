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
import { Link } from '@/i18n/routing'
import type { DashboardStats } from '@/lib/queries/dashboard'
import { useTranslations, useLocale } from 'next-intl'
import { formatCurrency } from '@/lib/utils/currency'

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
  const t = useTranslations('DashboardHome')
  const locale = useLocale()
  const isLoading = !stats

  return (
    <div className="space-y-8 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboardOverviewTitle')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('dashboardOverviewDescription')}
          </p>
        </div>
      </div>

      {/* Primary Stats Grid - Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users Card */}
        <StatsCard
          title={t('totalUsersTitle')}
          value={stats?.totalUsers ?? '---'}
          icon={Users}
          description={
            stats && stats.newUsersThisMonth > 0
              ? t('newUsersThisMonth', { count: stats.newUsersThisMonth })
              : undefined
          }
          trend={stats && stats.newUsersThisMonth > 0 ? 'up' : 'neutral'}
          isLoading={isLoading}
        />

        {/* Approved Experts Card */}
        <StatsCard
          title={t('approvedExpertsTitle')}
          value={stats?.totalExpertsApproved ?? '---'}
          icon={UserCheck}
          description={
            stats && stats.totalExpertsApproved > 0
              ? t('approvedExpertsAvailable', { count: stats.totalExpertsApproved })
              : undefined
          }
          trend={stats && stats.totalExpertsApproved > 5 ? 'up' : 'neutral'}
          isLoading={isLoading}
        />

        {/* Pending Expert Applications Card */}
        <StatsCard
          title={t('pendingApprovalsTitle')}
          value={stats?.pendingExpertApplications ?? '---'}
          icon={AlertCircle}
          description={
            stats && stats.pendingExpertApplications > 0
              ? t('pendingApprovalsWaiting', {
                  count: stats.pendingExpertApplications,
                })
              : t('allCaughtUp')
          }
          trend={stats && stats.pendingExpertApplications > 5 ? 'up' : 'down'}
          isLoading={isLoading}
        />

        {/* Total Appointments Card */}
        <StatsCard
          title={t('totalAppointmentsTitle')}
          value={stats?.totalAppointments ?? '---'}
          icon={Calendar}
          description={
            stats && stats.appointmentsToday > 0
              ? t('appointmentsToday', { count: stats.appointmentsToday })
              : undefined
          }
          trend={stats && stats.totalAppointments > 100 ? 'up' : 'neutral'}
          isLoading={isLoading}
        />
      </div>

      {/* Engagement Metrics Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">{t('engagementMetricsTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Appointments This Week */}
          <StatsCard
            title={t('appointmentsThisWeekTitle')}
            value={stats?.appointmentsThisWeek ?? '---'}
            icon={Calendar}
            description={
              stats && stats.appointmentsThisWeek > 0
                ? t('appointmentsThisWeekScheduled', {
                    count: stats.appointmentsThisWeek,
                  })
                : t('noAppointments')
            }
            trend={stats && stats.appointmentsThisWeek > 10 ? 'up' : 'neutral'}
            isLoading={isLoading}
          />

          {/* Community Posts */}
          <StatsCard
            title={t('communityPostsTitle')}
            value={stats?.totalCommunityPosts ?? '---'}
            icon={MessageSquare}
            description={t('communityPostsDescription')}
            trend={stats && stats.totalCommunityPosts > 50 ? 'up' : 'neutral'}
            isLoading={isLoading}
          />

          {/* Meditation Content */}
          <StatsCard
            title={t('guidedMeditationsTitle')}
            value={stats?.totalMeditations ?? '---'}
            icon={Music}
            description={t('guidedMeditationsDescription')}
            trend="neutral"
            isLoading={isLoading}
          />

          {/* Active Chat Rooms */}
          <StatsCard
            title={t('activeChatRoomsTitle')}
            value={stats?.activeChatRooms ?? '---'}
            icon={MessageCircle}
            description={t('activeChatRoomsDescription')}
            trend={stats && stats.activeChatRooms > 5 ? 'up' : 'neutral'}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Financial & Quality Metrics */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">{t('platformPerformanceTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Revenue */}
          <StatsCard
            title={t('totalRevenueTitle')}
            value={
              stats?.totalRevenue
                ? formatCurrency(stats.totalRevenue, locale)
                : '---'
            }
            icon={DollarSign}
            description={
              stats && stats.totalRevenue > 0
                ? t('paidAppointments', { count: stats.totalAppointments })
                : t('noRevenueYet')
            }
            trend={stats && stats.totalRevenue > 1000 ? 'up' : 'neutral'}
            isLoading={isLoading}
          />

          {/* Average Rating */}
          <StatsCard
            title={t('averageAppointmentRatingTitle')}
            value={
              stats?.averageAppointmentRating
                ? stats.averageAppointmentRating.toFixed(1)
                : '---'
            }
            icon={TrendingUp}
            description={
              stats && stats.averageAppointmentRating
                ? t('outOfFiveStars')
                : t('noRatingsYet')
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
        <h2 className="text-2xl font-bold mb-6">{t('analyticsTitle')}</h2>
        
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
        <h2 className="text-2xl font-bold mb-6">{t('recentActivitiesTitle')}</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Appointments Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('recentAppointmentsTitle')}</CardTitle>
                <Link
                  href="/appointments"
                  className="text-sm text-primary hover:underline"
                >
                  {t('viewAll')} →
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
                <CardTitle>{t('pendingExpertsTitle')}</CardTitle>
                <Link
                  href="/experts"
                  className="text-sm text-primary hover:underline"
                >
                  {t('viewAll')} →
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
              <CardTitle>{t('latestUserRegistrationsTitle')}</CardTitle>
              <Link
                href="/users"
                className="text-sm text-primary hover:underline"
              >
                {t('viewAll')} →
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

