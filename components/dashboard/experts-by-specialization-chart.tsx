'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { useExpertsBySpecialization } from '@/hooks/use-dashboard-charts';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const COLORS = [
  '#3b82f6',    // blue
  '#ef4444',    // red
  '#10b981',    // emerald
  '#f59e0b',    // amber
  '#8b5cf6',    // violet
  '#ec4899',    // pink
  '#06b6d4',    // cyan
  '#6366f1',    // indigo
  '#14b8a6',    // teal
  '#84cc16',    // lime
];

export function ExpertsBySpecializationChart() {
  const { data, isLoading, error } = useExpertsBySpecialization();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';
  const textColor = isDark ? '#d1d5db' : '#374151';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Experts by Specialization</CardTitle>
          <CardDescription>Distribution of expert specializations</CardDescription>
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
          <CardTitle>Experts by Specialization</CardTitle>
          <CardDescription>Distribution of expert specializations</CardDescription>
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
          <CardTitle>Experts by Specialization</CardTitle>
          <CardDescription>Distribution of expert specializations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No expert data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Experts by Specialization</CardTitle>
        <CardDescription>Distribution across {data.length} specializations</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px',
              }}
              labelStyle={{ color: textColor }}
              formatter={(value) => [`${value} experts`, 'Count']}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px', color: textColor } as any}
              layout="vertical"
              align="right"
              verticalAlign="middle"
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Detailed breakdown */}
        <div className="mt-6 space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Breakdown</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {dataWithPercentage.map((item, index) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="text-xs">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-muted-foreground">
                    {item.value} ({item.percentage}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
