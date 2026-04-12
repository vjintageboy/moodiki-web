'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
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

// Lazy load recharts to reduce initial bundle size
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false });
import {
  useUserGrowthData,
  useExpertsBySpecialization,
  useRevenueData,
  useUserRetention,
  useExpertPerformance,
} from '@/hooks/use-dashboard-charts';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

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
  const { data: expertSpec } = useExpertsBySpecialization();
  const { data: revenueData, isLoading: revenueLoading } = useRevenueData();
  const { data: retentionData, isLoading: retentionLoading } = useUserRetention();
  const { data: expertPerf, isLoading: expertPerfLoading } = useExpertPerformance();

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

      {/* REVENUE CHART */}
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.revenue.title')}</CardTitle>
          <CardDescription>{t('charts.revenue.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {revenueLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid stroke={gridColor} />
                <XAxis dataKey="date" stroke={textColor} />
                <YAxis stroke={textColor} />
                <Tooltip {...tooltipStyle}
                  formatter={(v) => [formatCurrency(v as number, locale), t('charts.revenue.amount')]}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* USER RETENTION */}
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.retention.title')}</CardTitle>
          <CardDescription>{t('charts.retention.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {retentionLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={retentionData}>
                <CartesianGrid stroke={gridColor} />
                <XAxis dataKey="week" stroke={textColor} />
                <YAxis stroke={textColor} />
                <Tooltip {...tooltipStyle} />
                <Area dataKey="newUsers" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name={t('charts.retention.newUsers')} />
                <Area dataKey="returningUsers" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} name={t('charts.retention.returningUsers')} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* EXPERT PERFORMANCE TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.expertPerf.title')}</CardTitle>
          <CardDescription>{t('charts.expertPerf.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {expertPerfLoading ? <ChartSkeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('charts.expertPerf.name')}</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('charts.expertPerf.specialization')}</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('charts.expertPerf.appointments')}</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('charts.expertPerf.completed')}</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('charts.expertPerf.revenue')}</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('charts.expertPerf.rating')}</th>
                  </tr>
                </thead>
                <tbody>
                  {expertPerf?.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">{t('charts.expertPerf.noData')}</td></tr>
                  ) : (
                    expertPerf?.map((expert) => (
                      <tr key={expert.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{expert.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{expert.specialization}</td>
                        <td className="py-3 px-4 text-right">{expert.totalAppointments}</td>
                        <td className="py-3 px-4 text-right">{expert.completedAppointments}</td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(expert.revenue, locale)}</td>
                        <td className="py-3 px-4 text-right">
                          {expert.ratingCount > 0 ? (
                            <span className="text-yellow-600">{'★'.repeat(Math.round(expert.avgRating))}{'☆'.repeat(5 - Math.round(expert.avgRating))}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          <span className="text-xs text-muted-foreground ml-1">({expert.ratingCount})</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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