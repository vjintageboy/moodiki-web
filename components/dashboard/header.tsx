'use client'

import { useRouter, usePathname } from '@/i18n/routing'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LogOut, User, Shield, Bell, Search, Menu, ChevronRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { GlobalSearch } from '@/components/dashboard/global-search'
import { useAuth } from '@/hooks/use-auth'
import { useLocale, useTranslations } from 'next-intl'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'

interface HeaderProps {
  onMenuClick?: () => void
}

/**
 * Extract and format page title from pathname
 * Examples: /dashboard/users → "Users", /dashboard → "Dashboard"
 */
function extractPageTitle(
  pathname: string,
  dashboardLabel: string,
  segmentLabelMap: Record<string, string>,
): string {
  // Remove leading/trailing slashes
  let path = pathname.replace(/^\/+|\/+$/g, '')
  
  if (!path || path === 'dashboard') {
    return dashboardLabel
  }
  
  // Get the last segment of the path
  const segments = path.split('/')
  const lastSegment = segments[segments.length - 1]

  if (segmentLabelMap[lastSegment]) {
    return segmentLabelMap[lastSegment]
  }
  
  // Capitalize each word
  return lastSegment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Generate breadcrumb trail from pathname
 * Example: /dashboard/users/123 → [{ label: 'Dashboard', href: '/' }, { label: 'Users', href: '/users' }]
 */
function generateBreadcrumbs(
  pathname: string,
  dashboardLabel: string,
  segmentLabelMap: Record<string, string>,
) {
  const segments = pathname
    .split('/')
    .filter(Boolean)
  
  const breadcrumbs = []
  
  // Always start with Dashboard
  breadcrumbs.push({
    label: dashboardLabel,
    href: '/'
  })
  
  // Add other segments (but not IDs)
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    // Skip numeric IDs and common params
    if (!segment.match(/^\d+$/) && segment !== 'dashboard') {
      const href = '/' + segments.slice(0, i + 1).join('/')
      breadcrumbs.push({
        label:
          segmentLabelMap[segment] ||
          segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
        href
      })
    }
  }
  
  return breadcrumbs
}

export function Header({ onMenuClick }: HeaderProps) {
  const tHeader = useTranslations('Header')
  const tSidebar = useTranslations('Sidebar')
  const locale = useLocale()

  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, isAdmin, isExpert, loading } = useAuth()
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const segmentLabelMap = {
    appointments: tSidebar('appointments'),
    users: tSidebar('users'),
    experts: tSidebar('experts'),
    analytics: tSidebar('analytics'),
    meditations: tSidebar('meditations'),
    posts: tSidebar('posts'),
    settings: tSidebar('settings'),
    notifications: tSidebar('notifications'),
    chats: tSidebar('chats'),
    availability: tSidebar('availability'),
    earnings: tSidebar('earnings'),
  }

  const pageTitle = extractPageTitle(pathname, tSidebar('dashboard'), segmentLabelMap)
  const breadcrumbs = generateBreadcrumbs(pathname, tSidebar('dashboard'), segmentLabelMap)

  const switchLocale = (nextLocale: 'en' | 'vi') => {
    if (nextLocale === locale) {
      return
    }

    router.replace(pathname, { locale: nextLocale })
    router.refresh()
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getInitials = (name?: string, email?: string): string => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return 'U'
  }

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) markAsRead.mutate(id)
    setNotificationsOpen(false)
    router.push('/notifications')
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 lg:h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      {/* Left section: Hamburger + Page Title */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Mobile hamburger menu */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label={tHeader('toggleSidebar')}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Page title */}
        <div className="hidden md:flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Center section: Global Search (hidden on small screens) */}
      <div className="hidden md:flex md:flex-1 md:justify-center md:max-w-sm">
        <GlobalSearch />
      </div>

      {/* Right section: Icons + User Menu */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="inline-flex items-center rounded-md border">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 rounded-none px-2 text-xs ${locale === 'en' ? 'bg-accent' : ''}`}
            onClick={() => switchLocale('en')}
            aria-label={tHeader('switchToEnglish')}
          >
            EN
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 rounded-none px-2 text-xs ${locale === 'vi' ? 'bg-accent' : ''}`}
            onClick={() => switchLocale('vi')}
            aria-label={tHeader('switchToVietnamese')}
          >
            VI
          </Button>
        </div>

        {/* Mobile search button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label={tHeader('openSearch')}
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications dropdown */}
        <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <DropdownMenuTrigger
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={tHeader('notifications')}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between py-2">
              <span>{tHeader('notifications')}</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} {tHeader('new')}
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {notifications.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                    className={`px-3 py-3 hover:bg-accent cursor-pointer border-b last:border-b-0 transition-colors ${
                      !notification.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="flex gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!notification.is_read ? 'font-semibold text-foreground' : 'font-medium'}`}>
                          {notification.title}
                        </p>
                        <p className={`text-xs truncate mt-0.5 ${!notification.is_read ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true,
                            locale: locale === 'vi' ? vi : enUS
                          })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                {tHeader('noNotifications')}
              </div>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer justify-center text-xs text-muted-foreground w-full flex"
              onClick={() => {
                setNotificationsOpen(false)
                router.push('/notifications')
              }}
            >
              {tHeader('viewAllNotifications')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Avatar className="h-8 w-8">
              {user?.avatar_url && (
                <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
              )}
              <AvatarFallback className="bg-blue-500 text-white text-xs font-semibold">
                {getInitials(user?.full_name, user?.email)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-1 py-2">
              <div className="text-sm font-semibold">
                {user?.full_name || tHeader('user')}
              </div>
              <div className="text-xs text-muted-foreground">
                {user?.email}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Shield className="h-3 w-3" />
                <span className="text-xs capitalize font-medium text-blue-600 dark:text-blue-400">
                  {isAdmin ? tHeader('admin') : isExpert ? tHeader('expert') : tHeader('user')}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => router.push('/settings')}
            >
              <User className="mr-2 h-4 w-4" />
              <span>{tHeader('profile')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => router.push('/settings')}
            >
              <Shield className="mr-2 h-4 w-4" />
              <span>{tHeader('settings')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{tHeader('logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile search bar (expanded) */}
      {searchOpen && (
        <div className="absolute top-14 left-0 right-0 md:hidden border-b bg-background px-4 py-3 animate-in fade-in slide-in-from-top-2">
          <GlobalSearch />
        </div>
      )}
    </header>
  )
}
