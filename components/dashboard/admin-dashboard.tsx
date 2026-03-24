import React from 'react';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';

/**
 * Admin Dashboard - Shows platform-wide statistics
 */
export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your platform's key metrics.
        </p>
      </div>
      <DashboardOverview />
    </div>
  );
}
