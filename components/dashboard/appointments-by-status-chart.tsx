'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { useAppointmentsByStatus } from '@/hooks/use-dashboard-charts';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const STATUS_COLORS: Record<string, string> = {
  'Pending': '#fbbf24',      // amber
  'Confirmed': '#3b82f6',    // blue
  'Completed': '#10b981',    // emerald
  'Cancelled': '#ef4444',    // red
};

export function AppointmentsByStatusChart() {
  const t = useTranslations('DashboardHome')
  const { data, isLoading, error } = useAppointmentsByStatus();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#d1d5db' : '#374151';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('chartAppointmentsByStatusTitle')}</CardTitle>
          <CardDescription>{t('chartAppointmentsByStatusDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('chartAppointmentsByStatusTitle')}</CardTitle>
          <CardDescription>{t('chartAppointmentsByStatusDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {t('failedToLoadChartData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('chartAppointmentsByStatusTitle')}</CardTitle>
          <CardDescription>{t('chartAppointmentsByStatusDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {t('noAppointmentDataAvailable')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('chartAppointmentsByStatusTitle')}</CardTitle>
        <CardDescription>{t('chartAppointmentsByStatusDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="status"
              stroke={textColor}
              style={{ fontSize: '12px' }}
              tick={{ fill: textColor }}
            />
            <YAxis stroke={textColor} style={{ fontSize: '12px' }} tick={{ fill: textColor }} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${gridColor}`,
                borderRadius: '8px',
              }}
              labelStyle={{ color: textColor }}
              cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
              formatter={(value, name) => {
                if (name === 'count') {
                  return [t('appointmentsCount', { count: value as number }), t('countLabel')];
                }
                if (name === 'percentage') {
                  return [`${value}%`, t('percentageLabel')];
                }
                return value;
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', color: textColor } as any} />
            <Bar dataKey="count" name={t('countLabel')} radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Legend with counts and percentages */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {data.map((item) => (
            <div key={item.status} className="flex items-center space-x-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[item.status] || '#6b7280' }}
              />
              <div className="text-sm">
                <p className="font-medium">
                  {t(`status.${item.status.toLowerCase()}` as any) || item.status}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.count} ({item.percentage}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
