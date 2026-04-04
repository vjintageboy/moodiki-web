'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations, useLocale } from 'next-intl';
import {
  Users, UserCheck, Calendar, TrendingUp,
  DollarSign, Heart, BarChart3, RefreshCw,
  ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import {
  useUserGrowthData,
  useAppointmentsByStatus,
  useExpertsBySpecialization,
  useMoodTrendData,
} from '@/hooks/use-dashboard-charts';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

/* ================= HELPERS ================= */

function useFormatters() {
  const locale = useLocale();
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  return { number };
}

/* ================= COMPONENTS ================= */

function KpiCard({
  title, value, subtext, icon: Icon, trend, isLoading,
}: {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold">{value}</p>
            {subtext && (
              <div className="flex items-center gap-1 mt-2">
                {trend === 'up' && <ArrowUpRight className="w-3 h-3 text-emerald-500" />}
                {trend === 'down' && <ArrowDownRight className="w-3 h-3 text-red-500" />}
                {trend === 'neutral' && <Minus className="w-3 h-3 text-muted-foreground" />}
                <p className={`text-xs ${trend === 'up' ? 'text-emerald-500' :
                    trend === 'down' ? 'text-red-500' :
                      'text-muted-foreground'
                  }`}>
                  {subtext}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return <Skeleton style={{ height }} className="w-full rounded-lg" />;
}

/* ================= MAIN ================= */

export default function AnalyticsPage() {
  const t = useTranslations('Analytics');
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const { number } = useFormatters();
  const locale = useLocale();

  const { stats, isLoading: statsLoading, refetch } = useDashboardStats();
  const { data: userGrowth, isLoading: growthLoading } = useUserGrowthData();
  const { data: appointmentStatus, isLoading: apptLoading } = useAppointmentsByStatus();
  const { data: expertSpec, isLoading: expertLoading } = useExpertsBySpecialization();
  const { data: moodTrend, isLoading: moodLoading } = useMoodTrendData();

  useEffect(() => { setMounted(true); }, []);

  const isDark = mounted && theme === 'dark';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#d1d5db' : '#374151';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';

  const tooltipStyle = {
    contentStyle: { backgroundColor: tooltipBg, border: `1px solid ${gridColor}`, borderRadius: '8px' },
    labelStyle: { color: textColor },
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={statsLoading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title={t('kpi.totalUsers')}
          value={stats?.totalUsers ?? '—'}
          subtext={stats?.newUsersThisMonth
            ? t('kpi.newUsersThisMonth', { count: number.format(stats.newUsersThisMonth) })
            : undefined}
          icon={Users}
          trend="up"
          isLoading={statsLoading}
        />

        <KpiCard
          title={t('kpi.approvedExperts')}
          value={stats?.totalExpertsApproved ?? '—'}
          subtext={stats?.pendingExpertApplications
            ? t('kpi.pendingExperts', { count: number.format(stats.pendingExpertApplications) })
            : undefined}
          icon={UserCheck}
          isLoading={statsLoading}
        />

        <KpiCard
          title={t('kpi.totalAppointments')}
          value={stats?.totalAppointments ?? '—'}
          subtext={stats?.appointmentsToday
            ? t('kpi.appointmentsToday', { count: number.format(stats.appointmentsToday) })
            : undefined}
          icon={Calendar}
          isLoading={statsLoading}
        />

        <KpiCard
          title={t('kpi.totalRevenue')}
          value={stats?.totalRevenue
            ? formatCurrency(stats.totalRevenue, locale)
            : t('common.zeroCurrency')}
          subtext={t('kpi.revenueSubtext')}
          icon={DollarSign}
          isLoading={statsLoading}
        />

        <KpiCard
          title={t('kpi.avgRating')}
          value={stats?.averageAppointmentRating
            ? t('kpi.rating', { value: stats.averageAppointmentRating.toFixed(1) })
            : '—'}
          subtext={t('kpi.ratingSubtext')}
          icon={TrendingUp}
          isLoading={statsLoading}
        />

        <KpiCard
          title={t('kpi.meditations')}
          value={stats?.totalMeditations ?? '—'}
          subtext={t('kpi.meditationsSubtext')}
          icon={Heart}
          isLoading={statsLoading}
        />

        <KpiCard
          title={t('kpi.communityPosts')}
          value={stats?.totalCommunityPosts ?? '—'}
          subtext={t('kpi.postsSubtext')}
          icon={BarChart3}
          isLoading={statsLoading}
        />

        <KpiCard
          title={t('kpi.weeklyAppointments')}
          value={stats?.appointmentsThisWeek ?? '—'}
          subtext={t('kpi.weeklyAppointmentsSubtext')}
          icon={Calendar}
          isLoading={statsLoading}
        />
      </div>

      {/* USER GROWTH */}
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.userGrowth.title')}</CardTitle>
          <CardDescription>{t('charts.userGrowth.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {growthLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowth}>
                <CartesianGrid stroke={gridColor} />
                <XAxis dataKey="month" stroke={textColor} />
                <YAxis stroke={textColor} />
                <Tooltip {...tooltipStyle}
                  formatter={(v) => [t('charts.usersCount', { value: number.format(v as number) }), t('charts.newUsers')]}
                />
                <Area dataKey="users" stroke="#8b5cf6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* EMPTY STATE */}
      {!expertSpec?.length && (
        <div className="text-center text-muted-foreground">
          {t('empty.noSpecialization')}
        </div>
      )}
    </div>
  );
}