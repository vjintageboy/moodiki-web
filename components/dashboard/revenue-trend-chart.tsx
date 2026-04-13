'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from 'next-intl';

interface RevenueTrendChartProps {
  data: {
    month: string;
    revenue: number;
  }[];
  title: string;
}

const CustomTooltip = ({ active, payload, label, locale }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-lg shadow-lg">
        <p className="font-bold text-gray-900 dark:text-white mb-1">{label}</p>
        <p className="text-blue-600 dark:text-blue-400 font-medium">
          {locale === 'vi' 
            ? `${(payload[0].value * 1000).toLocaleString('vi-VN')} ₫`
            : `$${(payload[0].value / 100).toFixed(2)}`
          }
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueTrendChart({ data, title }: RevenueTrendChartProps) {
  const locale = useLocale();

  const formatYAxis = (value: number) => {
    if (locale === 'vi') {
      return `${(value * 1000).toLocaleString('vi-VN')} ₫`;
    }
    return `$${(value / 100).toFixed(0)}`;
  };

  return (
    <Card className="h-full border-none bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-950 dark:to-gray-900/50 shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#e5e7eb" 
              className="dark:stroke-gray-800"
            />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              dy={10}
            />
            <YAxis 
              hide={true} // Keep it clean,Tooltip provides info
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip locale={locale} />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
