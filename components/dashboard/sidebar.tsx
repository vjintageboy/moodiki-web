'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  Bell
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

const routes: Route[] = [
  // Available to all authenticated users (admin and expert)
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Appointments', icon: Calendar, href: '/appointments' },
  
  // Admin only routes
  { label: 'Users', icon: Users, href: '/users', roles: ['admin'] },
  { label: 'Experts', icon: UserCheck, href: '/experts', roles: ['admin'] },
  
  // Available to all
  { label: 'Meditations', icon: Headphones, href: '/meditations' },
  { label: 'Posts', icon: FileText, href: '/posts' },
  
  // Admin only routes
  { label: 'Analytics', icon: BarChart3, href: '/analytics', roles: ['admin'] },
  { label: 'Chat Monitor', icon: MessageSquare, href: '/chats', roles: ['admin'] },
  
  // Available to all
  { label: 'Notifications', icon: Bell, href: '/notifications' },
  { label: 'Settings', icon: Settings, href: '/settings' },
]

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
      setIsCollapsed(JSON.parse(saved))
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
  const restrictedRoutes = routes.filter(route => {
    if (!route.roles) return false
    if (isAdmin && route.roles.includes('admin')) return false
    if (isExpert && route.roles.includes('expert')) return false
    return true
  })

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
          "flex flex-col h-full transition-all duration-300 ease-in-out bg-gray-900 text-gray-100 border-r border-gray-800",
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent truncate">
                Moodiki
              </span>
            </Link>
          )}

          {/* Toggle Buttons */}
          <div className="flex items-center gap-2">
            {/* Desktop collapse button */}
            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-gray-200"
              title={isCollapsed ? 'Expand' : 'Collapse'}
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
                    ? "bg-blue-500/20 text-blue-300 border-l-2 border-blue-500"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
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
                    Admin Only Features
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

        {/* User Profile Section at Bottom */}
        {!loading && user && (
          <div className="border-t border-gray-800 p-4 space-y-3">
            {/* User Info */}
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">
                {user.full_name
                  ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                  : user.email[0].toUpperCase()}
              </div>

              {/* User Details */}
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user.email}
                  </p>
                  {/* Role Badge */}
                  <div className="mt-1">
                    <span className={cn(
                      "inline-block px-2 py-0.5 rounded text-xs font-medium",
                      isAdmin 
                        ? "bg-red-500/20 text-red-300"
                        : "bg-green-500/20 text-green-300"
                    )}>
                      {isAdmin ? 'Admin' : 'Expert'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? 'Logout' : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Toggle Button (Floating) */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed bottom-6 right-6 p-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 z-40 shadow-lg"
        title="Toggle Menu"
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
