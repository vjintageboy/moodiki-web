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
import { useTranslations } from 'next-intl';
import { Link as IntlLink } from '@/i18n/routing';
import { useRouter as useIntlRouter } from '@/i18n/routing';

interface ExpertDashboardProps {
  expertId: string;
}

export function ExpertDashboard({ expertId }: ExpertDashboardProps) {
  const t = useTranslations('DashboardHome')
  const tHeader = useTranslations('Header')
  const router = useIntlRouter()
  const { data: stats, isLoading: statsLoading } = useExpertStats(expertId);
  const { data: appointments, isLoading: appointmentsLoading } =
    useExpertUpcomingAppointments(expertId);
  const { data: expertProfile, isLoading: profileLoading } =
    useExpertProfile(expertId);

  const { data: allAppointments } = useExpertAppointments(expertId);

  const isLoading = statsLoading || profileLoading;

  const handleAppointmentClick = (appointment: ExpertAppointmentWithUser) => {
    // Locale-aware navigation
    router.push(`/appointments?id=${appointment.id}`);
  };

  const recentActivities = allAppointments?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
            {t('welcomeBack', {
              title: expertProfile?.title ?? '',
              education: expertProfile?.education?.split(',')[0] ?? '',
            })}
        </h2>
        <p className="text-muted-foreground mt-1">
            {t('expertDashboardSubtitle')}
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title={t('totalAppointmentsTitle')}
          value={stats?.totalAppointments || 0}
          icon={Calendar}
          description={t('allTime')}
          trend={
            stats && stats.totalAppointments > 0
              ? 'up'
              : ('neutral' as const)
          }
          isLoading={isLoading}
        />
        <StatsCard
          title={t('upcomingTitle')}
          value={stats?.upcomingAppointments || 0}
          icon={Clock}
          description={t('next7Days')}
          trend={
            stats && stats.upcomingAppointments > 0 ? 'up' : ('neutral' as const)
          }
          isLoading={isLoading}
        />
        <StatsCard
          title={t('completedTitle')}
          value={stats?.completedSessions || 0}
          icon={CheckCircle}
          description={t('sessionsCompleted')}
          trend="up"
          isLoading={isLoading}
        />
        <StatsCard
          title={t('ratingTitle')}
          value={stats?.averageRating ? stats.averageRating.toFixed(1) : '0'}
          icon={Star}
          description={
            stats?.averageRating
              ? t('ratingExcellentReviews', {
                  tier:
                    stats.averageRating > 4.5
                      ? t('ratingTierExcellent')
                      : stats.averageRating > 4
                        ? t('ratingTierVeryGood')
                        : stats.averageRating > 3.5
                          ? t('ratingTierGood')
                          : t('ratingTierFair'),
                })
              : t('ratingNoReviewsYet')
          }
          trend={stats?.averageRating && stats.averageRating >= 4.5 ? 'up' : 'neutral'}
          isLoading={isLoading}
        />
        <StatsCard
          title={t('totalEarningsTitle')}
          value={`$${stats?.totalEarnings ? (stats.totalEarnings / 100).toFixed(2) : '0.00'}`}
          icon={DollarSign}
          description={t('paidAppointmentsShort')}
          trend={stats && stats.totalEarnings > 0 ? 'up' : ('neutral' as const)}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Appointments - 2 columns */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold">{t('upcomingAppointmentsHeading')}</h3>
            <IntlLink href="/appointments">
              <Button variant="ghost" size="sm">
                {t('viewAll')}
              </Button>
            </IntlLink>
          </div>
          <ExpertCalendar
            appointments={appointments || []}
            isLoading={appointmentsLoading}
            onAppointmentClick={handleAppointmentClick}
          />
        </div>

        {/* Quick Actions - 1 column */}
        <div>
          <h3 className="text-xl font-bold mb-4">{t('quickActionsHeading')}</h3>
          <div className="space-y-3">
            <IntlLink href="/availability" className="w-full">
              <Button className="w-full" variant="default">
                {t('updateAvailability')}
              </Button>
            </IntlLink>
            <IntlLink href="/earnings" className="w-full block">
              <Button className="w-full" variant="outline">
                {t('viewEarnings')}
              </Button>
            </IntlLink>
            <IntlLink href="/settings" className="w-full">
              <Button className="w-full" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                {tHeader('settings')}
              </Button>
            </IntlLink>
          </div>

          {/* Quick Stats Box */}
          <Card className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
            <h4 className="font-semibold text-gray-900 mb-3">{t('thisMonth')}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('sessionsCompletedLabel')}</span>
                <span className="font-medium">
                  {stats?.completedSessions || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('pendingConfirmationLabel')}</span>
                <span className="font-medium text-yellow-600">
                  {stats ? stats.totalAppointments - (stats.completedSessions || 0) - (stats.upcomingAppointments || 0) : 0}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                <span className="text-gray-700 font-medium">{t('avgRatingLabel')}</span>
                <span className="flex items-center gap-1 font-medium text-blue-600">
                  <Star className="w-4 h-4 fill-current" />
                  {stats?.averageRating ? stats.averageRating.toFixed(1) : t('notAvailable')}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{t('recentActivityHeading')}</h3>
          <IntlLink href="/appointments">
            <Button variant="ghost" size="sm">
              {t('viewAll')}
            </Button>
          </IntlLink>
        </div>
        
        {recentActivities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">{t('noRecentActivity')}</p>
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
                    {t('appointmentLabel', { status: apt.status })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t('sessionWithOn', {
                      name: apt.user?.full_name || t('aUser'),
                      date: format(new Date(apt.appointment_date), 'MMM d, yyyy'),
                    })}
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
