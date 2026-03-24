'use client'

import Link from 'next/link'
import { AlertTriangle, Home, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-md w-full px-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Heading and Message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Access Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              You do not have permission to access this page.
            </p>
          </div>

          {/* Explanation */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4 text-left space-y-2">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Who can access the admin panel?
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 ml-4">
              <li>• <span className="font-medium">Admins</span> - Full access to all features</li>
              <li>• <span className="font-medium">Experts</span> - Access to their dashboard and appointments</li>
            </ul>
            <p className="text-xs text-blue-700 dark:text-blue-400 pt-2 border-t border-blue-200 dark:border-blue-800">
              If you believe this is an error, please contact the administrator.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Support */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Need help?{' '}
              <a href="mailto:support@mentalhealth.app" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
