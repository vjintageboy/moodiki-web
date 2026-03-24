'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

function DashboardLoadingScreen() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Loading...</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Verifying access permissions</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, isAdmin, isExpert } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!isAdmin && !isExpert) {
      router.push('/unauthorized');
      return;
    }
  }, [user, loading, isAdmin, isExpert, router]);

  // Sync collapsed state: read initial value, then listen for changes from Sidebar
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
    // Custom event fired by Sidebar in same tab
    const handleCustom = (e: Event) => {
      setIsCollapsed((e as CustomEvent<boolean>).detail);
    };
    window.addEventListener('sidebar-collapsed-change', handleCustom);
    return () => window.removeEventListener('sidebar-collapsed-change', handleCustom);
  }, []);

  if (loading) {
    return <DashboardLoadingScreen />;
  }

  if (!user || (!isAdmin && !isExpert)) {
    return null;
  }

  const sidebarWidth = isCollapsed ? 'md:w-20' : 'md:w-72';
  const mainPadding = isCollapsed ? 'md:pl-20' : 'md:pl-72';

  return (
    <div className="h-full relative">
      {/* Desktop Sidebar */}
      <div className={`hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900 transition-all duration-300 ${sidebarWidth}`}>
        <Sidebar onCollapsedChange={setIsCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/80" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 transition-transform duration-300 md:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar onCollapsedChange={setIsCollapsed} />
      </div>

      <main className={`h-full flex flex-col transition-all duration-300 ${mainPadding}`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="p-6 md:p-8 overflow-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}
