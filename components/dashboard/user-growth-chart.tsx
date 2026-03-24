'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useUserGrowthData } from '@/hooks/use-dashboard-charts';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function UserGrowthChart() {
  const { data, isLoading, error } = useUserGrowthData();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#d1d5db' : '#374151';
  const lineColor = isDark ? '#60a5fa' : '#3b82f6';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>New user registrations over time</CardDescription>
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
          <CardTitle>User Growth</CardTitle>
          <CardDescription>New user registrations over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Failed to load chart data
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>New user registrations over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
        <CardDescription>New user registrations over the last 12 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="month"
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
              itemStyle={{ color: lineColor }}
              formatter={(value) => [`${value} users`, 'New Users']}
              labelFormatter={(label) => `${label}`}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px', color: textColor } as any}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="users"
              stroke={lineColor}
              dot={{ fill: lineColor, r: 4 }}
              activeDot={{ r: 6 }}
              name="New Users"
              isAnimationActive={true}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
