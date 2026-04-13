'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { formatCurrency } from '@/lib/utils/currency';

// ============================================================================
// TYPES
// ============================================================================

interface RevenueDataPoint {
  month: string;
  revenue: number; // cents
  sessions: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function scaleRevenue(value: number, locale: string): string {
  return formatCurrency(value, locale);
}

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

const CustomRevenueTooltip = ({ active, payload, locale }: any) => {
  const t = (key: string) => key; // fallback

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded-xl shadow-lg min-w-[180px]">
        <p className="font-bold text-gray-900 dark:text-white text-sm mb-2">{data.month}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-emerald-500" /> Revenue
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {scaleRevenue(data.revenue, locale)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3 text-indigo-500" /> Sessions
            </span>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {data.sessions}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// ============================================================================
// COMPONENT
// ============================================================================

interface MonthlyRevenueChartProps {
  data: RevenueDataPoint[];
}

export function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  const t = useTranslations('RevenueChart');
  const locale = useLocale();

  // Calculate totals and trends
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalSessions = data.reduce((sum, d) => sum + d.sessions, 0);

  // Calculate month-over-month trend
  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  let trendPercent = 0;
  if (data.length >= 2) {
    const lastMonth = data[data.length - 1].revenue;
    const prevMonth = data[data.length - 2].revenue;
    if (prevMonth > 0) {
      trendPercent = ((lastMonth - prevMonth) / prevMonth) * 100;
      trend = lastMonth >= prevMonth ? 'up' : 'down';
    }
  }

  if (data.length === 0) {
    return (
      <Card className="border-none bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-950 dark:to-gray-900/50 shadow-sm overflow-hidden">
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          {t('noData')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-white dark:bg-gray-950 shadow-sm rounded-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
      <CardHeader className="pb-0 pt-6 px-6">
        <div className="flex items-center justify-between">
          <div>
             <CardTitle className="text-lg font-black text-slate-900 dark:text-white">
               {t('title') || 'Monthly Revenue Trends'}
             </CardTitle>
             <p className="text-xs text-slate-500 font-medium mt-1">Overview of your financial growth</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-bold py-1 px-3 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              Insights <TrendingUp className="h-3 w-3 ml-1.5 opacity-50" />
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-64 sm:h-80 p-0 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenueArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#818cf8" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              horizontal={true}
              stroke="#f1f5f9"
              className="dark:stroke-slate-800/50"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
              padding={{ left: 30, right: 30 }}
              dy={-20}
            />
            <YAxis
              hide={true}
              domain={['dataMin - 50000', 'dataMax + 50000']}
            />
            <Tooltip 
              content={<CustomRevenueTooltip locale={locale} />}
              cursor={{ stroke: '#818cf8', strokeWidth: 1, strokeDasharray: '4 4' }}
            />

            {/* Revenue area */}
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#6366f1"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorRevenueArea)"
              animationDuration={2000}
              activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
