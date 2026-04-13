'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/stats-card';
import { WeeklySchedule, WeeklySession } from '@/components/dashboard/weekly-schedule';
import { SessionEditModal } from '@/components/dashboard/session-edit-modal';
import { NextSessionCard } from '@/components/dashboard/next-session-card';
import { MonthlyRevenueChart } from '@/components/dashboard/monthly-revenue-chart';
import { useWeeklyStats, useMonthlyRevenue } from '@/hooks/use-weekly-calendar';
import {
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Settings,
  Video,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Link as IntlLink } from '@/i18n/routing';
import { useRouter as useIntlRouter } from '@/i18n/routing';

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrencyValue(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: locale === 'vi' ? 'VND' : 'USD',
    minimumFractionDigits: 0,
  }).format(locale === 'vi' ? value * 1000 : value / 100);
}

// ============================================================================
// COMPONENT
// ============================================================================

interface ExpertDashboardProps {
  expertId: string;
}

export function ExpertDashboard({ expertId }: ExpertDashboardProps) {
  const t = useTranslations('DashboardHome');
  const tHeader = useTranslations('Header');
  const locale = useLocale();
  const router = useIntlRouter();

  // Selected session for modal
  const [selectedSession, setSelectedSession] = useState<WeeklySession | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Data hooks
  const stats = useWeeklyStats(expertId);
  const { data: revenueData, isLoading: revenueLoading } = useMonthlyRevenue(expertId);

  const handleSessionClick = (session: WeeklySession) => {
    setSelectedSession(session);
    setModalOpen(true);
  };

  const handleJoinSession = (sessionId: string) => {
    router.push(`/appointments/${sessionId}`);
  };

  const handleViewSession = (sessionId: string) => {
    router.push(`/appointments/${sessionId}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* ================================================================== */}
      {/* DASHBOARD HEADER                                                  */}
      {/* ================================================================== */}
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {t('weeklySchedule') || 'Weekly Schedule'}
        </h1>
        <p className="text-slate-500 font-medium text-sm">
          {t('expertDashboardSubtitle')}
        </p>
      </div>

      {/* ================================================================== */}
      {/* MAIN CONTENT: Calendar + Next Session                              */}
      {/* ================================================================== */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Calendar (spans 2 columns) */}
        <div className="lg:col-span-2">
          <WeeklySchedule
            expertId={expertId}
            onSessionClick={handleSessionClick}
          />
        </div>

        {/* Right Panel: Next Session */}
        <div>
          <NextSessionCard
            expertId={expertId}
            onJoinClick={handleJoinSession}
            onViewClick={handleViewSession}
          />

          {/* Quick Actions */}
          <Card className="mt-4 p-4 border-none bg-white dark:bg-gray-950 shadow-sm">
            <h3 className="font-bold text-sm mb-3">{t('quickActions')}</h3>
            <div className="space-y-2">
              <IntlLink href="/availability" className="block">
                <Button className="w-full justify-between group" variant="outline" size="sm">
                  <span className="flex items-center gap-2 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    {t('updateAvailability')}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-8px] group-hover:translate-x-0" />
                </Button>
              </IntlLink>
              <IntlLink href="/earnings" className="block">
                <Button className="w-full justify-between group" variant="outline" size="sm">
                  <span className="flex items-center gap-2 text-xs">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    {t('viewEarnings')}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-8px] group-hover:translate-x-0" />
                </Button>
              </IntlLink>
              <IntlLink href="/appointments" className="block">
                <Button className="w-full justify-between group" variant="outline" size="sm">
                  <span className="flex items-center gap-2 text-xs">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    {t('viewAllSessions')}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-8px] group-hover:translate-x-0" />
                </Button>
              </IntlLink>
              <IntlLink href="/settings" className="block">
                <Button className="w-full justify-between group" variant="outline" size="sm">
                  <span className="flex items-center gap-2 text-xs">
                    <Settings className="w-3.5 h-3.5 text-gray-500" />
                    {tHeader('settings')}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-8px] group-hover:translate-x-0" />
                </Button>
              </IntlLink>
            </div>
          </Card>

          {/* Quick Metrics */}
          <Card className="mt-4 p-4 border-none bg-blue-50/50 dark:bg-blue-950/20 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-blue-900 dark:text-blue-100">{t('weekOverview')}</h4>
              <span className="text-[10px] bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-100 px-2 py-0.5 rounded-full font-medium">Live</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-blue-700 dark:text-blue-300">
                <span className="text-xs">{t('completedLabel')}</span>
                <span className="font-black">{stats.completedCount}</span>
              </div>
              <div className="flex justify-between items-center text-blue-700 dark:text-blue-300">
                <span className="text-xs">{t('cancelledLabel')}</span>
                <span className="font-black text-red-600">{stats.cancelledCount}</span>
              </div>
              <div className="pt-3 border-t border-blue-200 dark:border-blue-900 flex justify-between items-center">
                <span className="font-bold text-blue-900 dark:text-blue-100 text-xs">{t('avgSessionsWeek')}</span>
                <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300 font-black">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {stats.totalSessions}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ================================================================== */}
      {/* MONTHLY REVENUE CHART                                              */}
      {/* ================================================================== */}
      <MonthlyRevenueChart data={revenueData || []} />

      {/* ================================================================== */}
      {/* SESSION EDIT MODAL                                                 */}
      {/* ================================================================== */}
      <SessionEditModal
        session={selectedSession}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
