'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  Users, UserCheck, Calendar, TrendingUp,
  DollarSign, Heart, BarChart3, RefreshCw,
  ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area,
} from 'recharts';
import {
  useUserGrowthData,
  useAppointmentsByStatus,
  useExpertsBySpecialization,
  useMoodTrendData,
} from '@/hooks/use-dashboard-charts';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

// KPI Card Component
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
                <p className={`text-xs ${
                  trend === 'up' ? 'text-emerald-500' :
                  trend === 'down' ? 'text-red-500' :
                  'text-muted-foreground'
                }`}>{subtext}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Chart skeleton
function ChartSkeleton({ height = 300 }: { height?: number }) {
  return <Skeleton style={{ height }} className="w-full rounded-lg" />;
}

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
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
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Platform performance metrics and trends
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={statsLoading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Users"
          value={stats?.totalUsers ?? '—'}
          subtext={stats?.newUsersThisMonth ? `+${stats.newUsersThisMonth} this month` : undefined}
          icon={Users}
          trend={stats?.newUsersThisMonth ? 'up' : 'neutral'}
          isLoading={statsLoading}
        />
        <KpiCard
          title="Approved Experts"
          value={stats?.totalExpertsApproved ?? '—'}
          subtext={stats?.pendingExpertApplications ? `${stats.pendingExpertApplications} pending` : undefined}
          icon={UserCheck}
          trend="neutral"
          isLoading={statsLoading}
        />
        <KpiCard
          title="Total Appointments"
          value={stats?.totalAppointments ?? '—'}
          subtext={stats?.appointmentsToday ? `${stats.appointmentsToday} today` : undefined}
          icon={Calendar}
          trend={stats?.appointmentsToday ? 'up' : 'neutral'}
          isLoading={statsLoading}
        />
        <KpiCard
          title="Total Revenue"
          value={stats?.totalRevenue ? `$${(stats.totalRevenue / 100).toFixed(2)}` : '$0'}
          subtext="From paid appointments"
          icon={DollarSign}
          trend={stats?.totalRevenue ? 'up' : 'neutral'}
          isLoading={statsLoading}
        />
        <KpiCard
          title="Avg Expert Rating"
          value={stats?.averageAppointmentRating ? `${stats.averageAppointmentRating.toFixed(1)} ★` : '—'}
          subtext="Out of 5.0"
          icon={TrendingUp}
          trend={stats?.averageAppointmentRating && stats.averageAppointmentRating >= 4 ? 'up' : 'neutral'}
          isLoading={statsLoading}
        />
        <KpiCard
          title="Meditations"
          value={stats?.totalMeditations ?? '—'}
          subtext="Available sessions"
          icon={Heart}
          trend="neutral"
          isLoading={statsLoading}
        />
        <KpiCard
          title="Community Posts"
          value={stats?.totalCommunityPosts ?? '—'}
          subtext="User discussions"
          icon={BarChart3}
          trend="neutral"
          isLoading={statsLoading}
        />
        <KpiCard
          title="This Week Appts"
          value={stats?.appointmentsThisWeek ?? '—'}
          subtext="Confirmed & completed"
          icon={Calendar}
          trend={stats?.appointmentsThisWeek && stats.appointmentsThisWeek > 0 ? 'up' : 'neutral'}
          isLoading={statsLoading}
        />
      </div>

      {/* Charts Row 1: User Growth + Appointments Status */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* User Growth - Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New registrations over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            {growthLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userGrowth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorUserGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" stroke={textColor} tick={{ fill: textColor, fontSize: 11 }} interval={1} />
                  <YAxis stroke={textColor} tick={{ fill: textColor, fontSize: 11 }} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v} users`, 'New Users']} />
                  <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2}
                    fill="url(#colorUserGrowth)" name="New Users" dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Appointments by Status - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments by Status</CardTitle>
            <CardDescription>Distribution of appointment statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {apptLoading ? <ChartSkeleton /> : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={300}>
                  <PieChart>
                    <Pie data={appointmentStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={110}
                      dataKey="count" paddingAngle={3}>
                      {appointmentStatus?.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v, name) => [`${v}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {appointmentStatus?.map((item, i) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-sm text-muted-foreground">{item.status}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">{item.count}</span>
                        <span className="text-xs text-muted-foreground ml-1">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Expert Specialization + Mood Trend */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Experts by Specialization */}
        <Card>
          <CardHeader>
            <CardTitle>Experts by Specialization</CardTitle>
            <CardDescription>Approved experts grouped by specialization</CardDescription>
          </CardHeader>
          <CardContent>
            {expertLoading ? <ChartSkeleton /> : expertSpec && expertSpec.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expertSpec} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" stroke={textColor} tick={{ fill: textColor, fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke={textColor} tick={{ fill: textColor, fontSize: 11 }} width={100} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v} experts`, 'Count']} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Experts">
                    {expertSpec.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                No specialization data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mood Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Mood Trend</CardTitle>
            <CardDescription>Average mood score over the last 30 days (1–5)</CardDescription>
          </CardHeader>
          <CardContent>
            {moodLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={moodTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" stroke={textColor} tick={{ fill: textColor, fontSize: 10 }}
                    interval={4} angle={-30} textAnchor="end" height={40} />
                  <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]}
                    stroke={textColor} tick={{ fill: textColor, fontSize: 11 }} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v} / 5`, 'Avg Mood']} />
                  <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2}
                    dot={false} activeDot={{ r: 5, fill: '#10b981' }} name="Avg Mood" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
