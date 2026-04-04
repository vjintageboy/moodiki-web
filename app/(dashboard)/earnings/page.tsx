'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useExpertEarnings } from '@/hooks/use-earnings';
import { useExpertAppointments } from '@/hooks/use-appointments';
import { ExportTransactionsDialog } from '@/components/dashboard/export-transactions-dialog';
import { formatCurrency } from '@/lib/utils/currency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, TrendingUp, Activity, CalendarDays, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subDays } from 'date-fns';
import { useTranslations, useLocale } from 'next-intl';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';


export default function EarningsPage() {
  const t = useTranslations('EarningsPage');
  const locale = useLocale();
  const { user, isExpert, loading: authLoading } = useAuth();
  
  // Default to the last 30 days
  const [startDate, setStartDate] = React.useState<string>(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = React.useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );

  const { data: earningsData, isLoading: earningsLoading } = useExpertEarnings(
    isExpert ? user?.id : undefined,
    startDate,
    endDate
  );

  // For Export functionality
  const [isExportDialogOpen, setIsExportDialogOpen] = React.useState(false);
  const { appointments: exportData, isLoading: isExportLoading } = useExpertAppointments(
    isExpert ? user?.id : undefined,
    {
      dateFrom: startDate,
      dateTo: endDate,
      paymentStatus: 'paid',
      pageSize: 1000,
    }
  );

  if (authLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isExpert) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <h2 className="text-xl font-semibold text-foreground mb-2">{t('unauthorized.title')}</h2>
        <p>{t('unauthorized.message')}</p>
      </div>
    );
  }

  // Calculate aggregates
  const totalEarnings = earningsData?.reduce((acc, curr) => acc + curr.daily_earnings, 0) || 0;
  const totalSessions = earningsData?.reduce((acc, curr) => acc + curr.total_sessions, 0) || 0;

  // Format data for Recharts
  const chartData = (earningsData || []).map(d => ({
    name: format(new Date(d.date_group), 'dd/MM'),
    Earnings: d.daily_earnings,
    Sessions: d.total_sessions,
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-2 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 px-2">
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-black text-muted-foreground mb-1 pl-1">{t('filter.from')}</label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 w-32 text-xs border-none bg-accent/50 rounded-lg font-bold"
              />
            </div>
            <span className="text-muted-foreground mt-4 font-bold">-</span>
            <div className="flex flex-col">
              <label className="text-[10px] uppercase font-black text-muted-foreground mb-1 pl-1">{t('filter.to')}</label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 w-32 text-xs border-none bg-accent/50 rounded-lg font-bold"
              />
            </div>
          </div>
          
          <div className="w-px h-8 bg-border hidden sm:block mx-1" />

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsExportDialogOpen(true)}
            className="h-10 rounded-xl gap-2 font-bold border-emerald-500/20 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95"
          >
            <Download className="h-4 w-4" />
            <span className="hidden lg:inline">{t('export.button') || 'Xuất dữ liệu'}</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Tổng thu nhập */}
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-900/50 border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{t('kpi.currentPeriod')}</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(totalEarnings, locale)}
            </div>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-1">
              {t('kpi.currentPeriodDesc')}
            </p>
          </CardContent>
        </Card>
        
        {/* Số buổi */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-900/50 border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">{t('kpi.completedSessions')}</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{totalSessions}</div>
            <p className="text-xs text-blue-600/70 dark:text-blue-500/70 mt-1">{t('kpi.completedSessionsDesc')}</p>
          </CardContent>
        </Card>

        {/* Trung bình mỗi buổi */}
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-900/50 border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-violet-800 dark:text-violet-300">{t('kpi.averagePerSession')}</CardTitle>
            <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-700 dark:text-violet-400">
              {formatCurrency(totalSessions > 0 ? totalEarnings / totalSessions : 0, locale)}
            </div>
            <p className="text-xs text-violet-600/70 dark:text-violet-500/70 mt-1">{t('kpi.averagePerSessionDesc')}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle>{t('charts.dailyEarnings')}</CardTitle>
          <CardDescription>
            {t('charts.desc', { 
              start: format(new Date(startDate), locale === 'vi' ? 'dd/MM/yyyy' : 'MM/dd/yyyy'), 
              end: format(new Date(endDate), locale === 'vi' ? 'dd/MM/yyyy' : 'MM/dd/yyyy') 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            {earningsLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-accent/20 rounded-lg border border-dashed">
                <TrendingUp className="h-12 w-12 opacity-20 mb-2" />
                <p>{t('empty.noData')}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#888' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#888' }}
                    tickFormatter={(value) => {
                      const isVND = locale === 'vi';
                      const scaledValue = isVND ? value : value / 100;
                      return new Intl.NumberFormat(isVND ? 'vi-VN' : 'en-US', { notation: 'compact' }).format(scaledValue) + (isVND ? '₫' : '$')
                    }}
                    width={72}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                    contentStyle={{ borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.12)' }}
                    formatter={(value: any, name: any) => {
                      if (name === 'Earnings' && typeof value === 'number') return [formatCurrency(value, locale), t('charts.earnings')];
                      return [value, name];
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  />
                  <Bar 
                    dataKey="Earnings" 
                    fill="url(#earningsGradient)"
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={56}
                    animationDuration={1200}
                  />
                  <defs>
                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
      
      <ExportTransactionsDialog 
        isOpen={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        data={exportData}
        overrideTitle={t('export.title') || 'Xuất báo cáo thu nhập'}
        overrideDescription={t('export.description') || 'Tải xuống lịch sử giao dịch và doanh thu cá nhân của bạn.'}
      />
    </div>
  );
}
