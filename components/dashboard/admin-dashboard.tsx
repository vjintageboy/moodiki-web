'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import type { DashboardStats } from '@/lib/queries/dashboard';

interface AdminDashboardProps {
  stats?: DashboardStats
}

/**
 * Admin Dashboard - Shows platform-wide statistics
 * 
 * Optimized to accept pre-fetched stats from server
 */
export function AdminDashboard({ stats }: AdminDashboardProps) {
  const t = useTranslations('DashboardHome');
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('adminDashboardTitle')}</h2>
        <p className="text-muted-foreground">
          {t('adminDashboardDescription')}
        </p>
      </div>
      <DashboardOverview stats={stats} />
    </div>
  );
}
