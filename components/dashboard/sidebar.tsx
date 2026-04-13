'use client'

import { Link, usePathname, useRouter } from '@/i18n/routing'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Calendar, 
  FileText, 
  Headphones, 
  BarChart3, 
  Settings,
  Lock,
  ChevronLeft,
  Menu,
  X,
  LogOut,
  Sparkles,
  MessageSquare,
  Bell,
  Clock,
  DollarSign,
  Receipt
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

/**
 * Route configuration with role-based access
 * roles: undefined = all roles, array = specific roles only
 */
interface Route {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  roles?: ('admin' | 'expert')[]
}

/**
 * Sidebar component with:
 * - Collapsible state with localStorage persistence
 * - Role-based menu visibility
 * - Active state highlighting
 * - User profile section at bottom
 * - Mobile responsive with overlay
 * - Dark mode support
 */
interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ onCollapsedChange }: SidebarProps = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAdmin, isExpert, loading, logout } = useAuth()
  const t = useTranslations('Sidebar')

  const routes: Route[] = [
    // --- ADMIN ROUTES ---
    { label: t('dashboard'), icon: LayoutDashboard, href: '/', roles: ['admin'] },
    { label: t('users'), icon: Users, href: '/users', roles: ['admin'] },
    { label: t('experts'), icon: UserCheck, href: '/experts', roles: ['admin'] },
    { label: t('meditations'), icon: Headphones, href: '/meditations', roles: ['admin'] },
    { label: t('posts'), icon: FileText, href: '/posts', roles: ['admin'] },
    { label: t('analytics'), icon: BarChart3, href: '/analytics', roles: ['admin'] },
    // Chat Monitor removed — private conversations between users/experts
    // are confidential and should not be accessible to admins
    { label: t('transactions'), icon: Receipt, href: '/admin/transactions', roles: ['admin'] },
    { label: t('notifications'), icon: Bell, href: '/notifications', roles: ['admin'] },

    // --- EXPERT ROUTES ---
    { label: t('dashboard'), icon: LayoutDashboard, href: '/', roles: ['expert'] },
    { label: t('calendar') || 'Calendar', icon: Calendar, href: '/availability', roles: ['expert'] },
    { label: t('patients') || 'Patients', icon: Users, href: '/patients', roles: ['expert'] },
    { label: t('sessions') || 'Sessions', icon: Clock, href: '/appointments', roles: ['expert'] },
    { label: t('payments') || 'Payments', icon: DollarSign, href: '/earnings', roles: ['expert'] },
    { label: t('analytics') || 'Analytics', icon: BarChart3, href: '/analytics', roles: ['expert', 'admin'] },

    // --- SHARED ROUTES ---
    { label: t('settings'), icon: Settings, href: '/settings' },
  ]
  
  // Sidebar state management
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  /**
   * Restore sidebar state from localStorage on mount
   */
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      try {
        setIsCollapsed(JSON.parse(saved))
      } catch (e) {
        setIsCollapsed(false)
        localStorage.removeItem('sidebar-collapsed')
      }
    }
  }, [])

  /**
   * Save sidebar state to localStorage
   */
  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
    onCollapsedChange?.(newState)
    // Dispatch custom event so same-tab listeners (layout) can update
    window.dispatchEvent(new CustomEvent('sidebar-collapsed-change', { detail: newState }))
  }

  /**
   * Close mobile sidebar on route change
   */
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  /**
   * Filter routes based on user role
   */
  const visibleRoutes = routes.filter(route => {
    if (!route.roles) return true
    if (isAdmin && route.roles.includes('admin')) return true
    if (isExpert && route.roles.includes('expert')) return true
    return false
  })

  /**
   * Get restricted routes (for user info)
   */
  const restrictedRoutes: Route[] = [] // Removed the lock block as requested by UX

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  // Check if route is active
  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true
    if (href !== '/' && pathname.startsWith(href)) return true
    return false
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <div
        className={cn(
          "flex flex-col h-full transition-all duration-300 ease-in-out bg-[#1e2a4f] text-gray-100 border-r border-white/10",
          "fixed inset-y-0 left-0 z-50 md:z-40",
          isCollapsed ? "w-20" : "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header with Logo and Toggle */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-gray-800",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {/* Logo (hidden when collapsed) */}
          {!isCollapsed && (
            <Link 
              href="/" 
              className="flex items-center gap-2 text-lg font-bold hover:opacity-80 transition flex-1 min-w-0"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <span className="text-xl font-black text-white tracking-tight ml-1 animate-in fade-in slide-in-from-left-2 duration-300">
                  Moodiki
                </span>
              )}
            </Link>
          )}

          {/* Toggle Buttons */}
          <div className="flex items-center gap-2">
            {/* Desktop collapse button */}
            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 hover:bg-white/10 rounded-lg transition text-indigo-300 hover:text-white"
              title={isCollapsed ? t('expand') : t('collapse')}
            >
              <ChevronLeft className={cn(
                "w-5 h-5 transition-transform duration-300",
                isCollapsed && "rotate-180"
              )} />
            </button>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1.5 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Menu Section */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <div className="space-y-2">
            {visibleRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  "text-sm font-medium whitespace-nowrap",
                  isActive(route.href)
                    ? "bg-white/10 text-white border-l-4 border-indigo-400 font-bold"
                    : "text-indigo-200/60 hover:text-white hover:bg-white/5"
                )}
                title={isCollapsed ? route.label : undefined}
              >
                <route.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{route.label}</span>}
              </Link>
            ))}
          </div>

          {/* Show restricted items info for experts */}
          {isExpert && restrictedRoutes.length > 0 && !isCollapsed && (
            <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-300 mb-2">
                    {t('adminOnlyFeatures')}
                  </p>
                  <ul className="text-xs text-blue-300/70 space-y-1">
                    {restrictedRoutes.map(route => (
                      <li key={route.href} className="flex items-center gap-1">
                        <span>•</span>
                        <span>{route.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Logout Section at Bottom */}
        {!loading && user && (
          <div className="p-4 mt-auto">
            <button
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "text-sm font-medium text-indigo-300/40 hover:text-red-400 hover:bg-red-500/10",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? t('logout') : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{t('logout')}</span>}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Toggle Button (Floating) */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed bottom-6 right-6 p-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 z-40 shadow-lg"
        title={t('toggleMenu')}
      >
        {isMobileOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>
    </>
  )
}
