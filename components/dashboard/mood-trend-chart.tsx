'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMoodTrendData } from '@/hooks/use-dashboard-charts';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function MoodTrendChart() {
  const { data, isLoading, error } = useMoodTrendData();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#d1d5db' : '#374151';
  const areaColor = isDark ? '#8b5cf6' : '#7c3aed';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mood Trend</CardTitle>
          <CardDescription>Average mood score over the last 30 days</CardDescription>
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
          <CardTitle>Mood Trend</CardTitle>
          <CardDescription>Average mood score over the last 30 days</CardDescription>
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
          <CardTitle>Mood Trend</CardTitle>
          <CardDescription>Average mood score over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No mood data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate average and min/max
  const scores = data.map((d) => d.score).filter((s) => s > 0);
  const averageScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood Trend</CardTitle>
        <CardDescription>Average daily mood score (1-5 scale) over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={areaColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={areaColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="date"
              stroke={textColor}
              style={{ fontSize: '12px' }}
              tick={{ fill: textColor }}
            />
            <YAxis
              domain={[1, 5]}
              stroke={textColor}
              style={{ fontSize: '12px' }}
              tick={{ fill: textColor }}
              label={{ value: 'Score (1-5)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${gridColor}`,
                borderRadius: '8px',
              }}
              labelStyle={{ color: textColor }}
              formatter={(value) => [
                typeof value === 'number' ? value.toFixed(1) : value,
                'Average Mood',
              ]}
              labelFormatter={(label) => `${label}`}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke={areaColor}
              fillOpacity={1}
              fill="url(#colorMood)"
              dot={{ fill: areaColor, r: 3 }}
              activeDot={{ r: 5 }}
              isAnimationActive={true}
              strokeWidth={2}
              name="Mood Score"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="text-xl font-bold">{averageScore}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Lowest</p>
            <p className="text-xl font-bold">{minScore.toFixed(1)}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Highest</p>
            <p className="text-xl font-bold">{maxScore.toFixed(1)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
