'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useTranslations, useLocale } from 'next-intl';
import {
  Users, UserCheck, Calendar, TrendingUp,
  DollarSign, Heart, BarChart3, RefreshCw,
  ArrowUpRight, ArrowDownRight, Minus,
  PieChart as PieChartIcon, 
  Target,
  Award
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Lazy load recharts
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false });

import {
  useUserGrowthData,
  useExpertsBySpecialization,
  useRevenueData,
  useUserRetention,
  useExpertPerformance,
} from '@/hooks/use-dashboard-charts';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { useAuth } from '@/hooks/use-auth';
import { useExpertAnalytics } from '@/hooks/use-expert-analytics';

/* ================= HELPERS ================= */

function useFormatters() {
  const locale = useLocale();
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  return { number };
}

/* ================= COMPONENTS ================= */

function KpiCard({
  title, value, subtext, icon: Icon, trend, isLoading, color = "purple"
}: {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
  color?: "purple" | "blue" | "green" | "emerald" | "amber";
}) {
  const colorMap = {
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  };

  return (
    <Card className="relative overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
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
              <div className={`p-2 rounded-xl ${colorMap[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtext && (
              <div className="flex items-center gap-1 mt-2">
                {trend === 'up' && <ArrowUpRight className="w-3 h-3 text-emerald-500" />}
                {trend === 'down' && <ArrowDownRight className="w-3 h-3 text-red-500" />}
                {trend === 'neutral' && <Minus className="w-3 h-3 text-muted-foreground" />}
                <p className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-500' :
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
  return <Skeleton style={{ height }} className="w-full rounded-xl" />;
}

/* ================= MAIN ================= */

export default function AnalyticsPage() {
  const t = useTranslations('Analytics');
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const { number } = useFormatters();
  const locale = useLocale();
  const { isAdmin, isExpert, user } = useAuth();

  // 1. Fetching Data based on Role
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: userGrowth, isLoading: growthLoading } = useUserGrowthData();
  const { data: expertSpec } = useExpertsBySpecialization();
  const { data: revenueData, isLoading: revenueLoading } = useRevenueData();
  const { data: retentionData, isLoading: retentionLoading } = useUserRetention();
  const { data: expertPerf, isLoading: expertPerfLoading } = useExpertPerformance();

  // Expert Specific Data
  const { data: expertAnalytics, isLoading: expertLoading, refetch: refetchExpert } = useExpertAnalytics(user?.id, isExpert && !isAdmin);

  useEffect(() => { setMounted(true); }, []);

  const isDark = mounted && theme === 'dark';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#d1d5db' : '#374151';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';

  const tooltipStyle = {
    contentStyle: { backgroundColor: tooltipBg, border: `1px solid ${gridColor}`, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
    labelStyle: { color: textColor, fontWeight: 'bold' },
  };

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const handleRefresh = () => {
    if (isAdmin) refetchStats();
    if (isExpert) refetchExpert();
  };

  // --------------------------------------------------------------------------
  // RENDER EXPERT DASHBOARD
  // --------------------------------------------------------------------------
  if (isExpert && !isAdmin) {
    const kpis = expertAnalytics?.kpis;

    return (
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={expertLoading} className="gap-2 shadow-sm">
            <RefreshCw className={`w-4 h-4 ${expertLoading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>

        {/* Expert KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title={t('kpi.personalRevenue')}
            value={kpis ? formatCurrency(kpis.personalRevenue, locale) : '—'}
            subtext="Lifetime earnings"
            icon={DollarSign}
            color="emerald"
            isLoading={expertLoading}
          />
          <KpiCard
            title={t('kpi.totalSessions')}
            value={kpis?.totalSessions ?? '—'}
            subtext={`${kpis?.completedSessions || 0} completed`}
            icon={Calendar}
            color="blue"
            isLoading={expertLoading}
          />
          <KpiCard
            title={t('kpi.avgRating')}
            value={kpis?.avgRating ? t('kpi.rating', { value: kpis.avgRating.toFixed(1) }) : '—'}
            subtext={t('kpi.ratingSubtext')}
            icon={Award}
            color="amber"
            isLoading={expertLoading}
          />
          <KpiCard
            title="Completion Rate"
            value={kpis ? `${kpis.completionRate}%` : '—'}
            subtext="Post-acceptance reliability"
            icon={Target}
            color="purple"
            isLoading={expertLoading}
          />
        </div>

        {/* Main Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Trend */}
          <Card className="lg:col-span-2 shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                {t('charts.revenue.title')}
              </CardTitle>
              <CardDescription>{t('charts.revenue.desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {expertLoading ? <ChartSkeleton /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={expertAnalytics?.revenueTrend || []}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="date" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                    <Tooltip {...tooltipStyle} formatter={(v) => [formatCurrency(v as number, locale), t('charts.revenue.amount')]} />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Benchmark Widget */}
          <div className="space-y-8">
            <Card className="shadow-lg border-none bg-primary text-primary-foreground overflow-hidden relative">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Performance Benchmark
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Rank Status</span>
                    <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none">Top {100 - (kpis?.benchmarkPercentile || 45)}%</Badge>
                  </div>
                  <Progress value={kpis?.benchmarkPercentile || 0} className="h-2 bg-white/20" indicatorClassName="bg-white" />
                  <p className="text-xs text-primary-foreground/80 leading-relaxed font-medium">
                    {t('kpi.benchmark', { percent: kpis?.benchmarkPercentile || 0 })}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Platform Average</p>
                    <p className="text-xl font-bold">{formatCurrency(kpis?.platformAvgRevenue || 0, locale)}</p>
                  </div>
                  <TrendingUp className="h-10 w-10 opacity-20 absolute -right-2 -bottom-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-purple-500" />
                  {t('charts.sessionType.title')}
                </CardTitle>
                <CardDescription>Preference distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {expertLoading || !expertAnalytics?.sessionTypes ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <Skeleton className="h-40 w-40 rounded-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={expertAnalytics.sessionTypes}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expertAnalytics.sessionTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {expertAnalytics?.sessionTypes?.map((type, index) => (
                    <div key={type.type} className="flex items-center gap-2 text-xs font-medium">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-muted-foreground">{type.type}:</span>
                      <span>{type.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER ADMIN DASHBOARD (Default / Admin Role)
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchStats()} disabled={statsLoading} className="gap-2 shadow-sm">
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
          color="blue"
          isLoading={statsLoading}
        />

        <KpiCard
          title={t('kpi.totalAppointments')}
          value={stats?.totalAppointments ?? '—'}
          subtext={stats?.appointmentsToday
            ? t('kpi.appointmentsToday', { count: number.format(stats.appointmentsToday) })
            : undefined}
          icon={Calendar}
          color="green"
          isLoading={statsLoading}
        />

        <KpiCard
          title={t('kpi.totalRevenue')}
          value={stats?.totalRevenue
            ? formatCurrency(stats.totalRevenue, locale)
            : t('common.zeroCurrency')}
          subtext={t('kpi.revenueSubtext')}
          icon={DollarSign}
          color="emerald"
          isLoading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={t('kpi.avgRating')}
          value={stats?.averageAppointmentRating
            ? t('kpi.rating', { value: stats.averageAppointmentRating.toFixed(1) })
            : '—'}
          subtext={t('kpi.ratingSubtext')}
          icon={TrendingUp}
          color="amber"
          isLoading={statsLoading}
        />

        <KpiCard
          title={t('kpi.meditations')}
          value={stats?.totalMeditations ?? '—'}
          subtext={t('kpi.meditationsSubtext')}
          icon={Heart}
          color="purple"
          isLoading={statsLoading}
        />

        <KpiCard
          title={t('kpi.communityPosts')}
          value={stats?.totalCommunityPosts ?? '—'}
          subtext={t('kpi.postsSubtext')}
          icon={BarChart3}
          color="amber"
          isLoading={statsLoading}
        />

        <KpiCard
          title={t('kpi.weeklyAppointments')}
          value={stats?.appointmentsThisWeek ?? '—'}
          subtext={t('kpi.weeklyAppointmentsSubtext')}
          icon={Calendar}
          color="blue"
          isLoading={statsLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* USER GROWTH */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>{t('charts.userGrowth.title')}</CardTitle>
            <CardDescription>{t('charts.userGrowth.desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {growthLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userGrowth}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="month" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle}
                    formatter={(v) => [t('charts.usersCount', { value: number.format(v as number) }), t('charts.newUsers')]}
                  />
                  <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* REVENUE CHART */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>{t('charts.revenue.title')}</CardTitle>
            <CardDescription>{t('charts.revenue.desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="date" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle}
                    formatter={(v) => [formatCurrency(v as number, locale), t('charts.revenue.amount')]}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* EXPERT PERFORMANCE TABLE */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle>{t('charts.expertPerf.title')}</CardTitle>
          <CardDescription>{t('charts.expertPerf.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {expertPerfLoading ? <ChartSkeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                    <th className="text-left py-4 px-4">{t('charts.expertPerf.name')}</th>
                    <th className="text-left py-4 px-4">{t('charts.expertPerf.specialization')}</th>
                    <th className="text-right py-4 px-4">{t('charts.expertPerf.appointments')}</th>
                    <th className="text-right py-4 px-4">{t('charts.expertPerf.completed')}</th>
                    <th className="text-right py-4 px-4">{t('charts.expertPerf.revenue')}</th>
                    <th className="text-right py-4 px-4">{t('charts.expertPerf.rating')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expertPerf?.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">{t('charts.expertPerf.noData')}</td></tr>
                  ) : (
                    expertPerf?.map((expert) => (
                      <tr key={expert.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4 font-bold">{expert.name}</td>
                        <td className="py-4 px-4"><Badge variant="outline">{expert.specialization}</Badge></td>
                        <td className="py-4 px-4 text-right font-medium">{expert.totalAppointments}</td>
                        <td className="py-4 px-4 text-right">{expert.completedAppointments}</td>
                        <td className="py-4 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(expert.revenue, locale)}</td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {expert.ratingCount > 0 ? (
                              <>
                                <span className="font-bold">{expert.avgRating}</span>
                                <span className="text-yellow-500">★</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                            <span className="text-[10px] text-muted-foreground ml-1">({expert.ratingCount})</span>
                          </div>
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
    </div>
  );
}
