'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

interface DashboardClientLayoutProps {
  children: React.ReactNode
}

/**
 * Client-side interactive wrapper for dashboard layout
 * 
 * Handles:
 * - Sidebar open/close state (mobile)
 * - Sidebar collapsed state (desktop)
 * - Local storage sync
 */
export function DashboardClientLayout({ children }: DashboardClientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Sync collapsed state: read initial value, then listen for changes from Sidebar
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      try {
        setIsCollapsed(JSON.parse(saved))
      } catch (e) {
        setIsCollapsed(false)
        localStorage.removeItem('sidebar-collapsed')
      }
    }
    // Custom event fired by Sidebar in same tab
    const handleCustom = (e: Event) => {
      setIsCollapsed((e as CustomEvent<boolean>).detail)
    }
    window.addEventListener('sidebar-collapsed-change', handleCustom)
    return () => window.removeEventListener('sidebar-collapsed-change', handleCustom)
  }, [])

  const sidebarWidth = isCollapsed ? 'md:w-20' : 'md:w-72'
  const mainPadding = isCollapsed ? 'md:pl-20' : 'md:pl-72'

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

      <main className={`h-full flex flex-col transition-all duration-300 ${mainPadding} bg-[#f8fafc] dark:bg-[#0f172a]`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="p-6 md:p-10 overflow-auto flex-1 scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  )
}
