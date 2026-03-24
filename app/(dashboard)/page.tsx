'use client';

import { useAuth } from '@/hooks/use-auth';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { ExpertDashboard } from '@/components/dashboard/expert-dashboard';

export default function DashboardPage() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Show admin dashboard for admins
  if (isAdmin) {
    return <AdminDashboard />;
  }

  // Show expert dashboard for experts
  if (user?.id) {
    return <ExpertDashboard expertId={user.id} />;
  }

  // Fallback
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Unable to load dashboard. Please refresh or contact support.
        </p>
      </div>
    </div>
  );
}
