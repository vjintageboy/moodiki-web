'use client';

import React from 'react';
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your platform's key metrics.
        </p>
      </div>
      <DashboardOverview stats={stats} />
    </div>
  );
}
