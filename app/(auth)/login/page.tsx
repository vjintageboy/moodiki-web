'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

// Validation Schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().default(false),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const t = useTranslations('Login')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    setAuthError(null)

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        // Handle specific authentication errors
        if (authError.message.includes('Invalid login credentials')) {
          setAuthError('Invalid email or password. Please try again.')
        } else if (authError.message.includes('Email not confirmed')) {
          setAuthError('Please confirm your email before logging in.')
        } else if (authError.message.includes('User not found')) {
          setAuthError('No account found with this email address.')
        } else {
          setAuthError(authError.message || 'An error occurred during login. Please try again.')
        }
        toast.error(authError.message)
        return
      }

      if (!authData.user) {
        setAuthError('Login failed. Please try again.')
        toast.error('Login failed')
        return
      }

      // Fetch user role from users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        // User exists in auth but not in users table
        await supabase.auth.signOut()
        setAuthError('User profile not found. Please contact support.')
        toast.error('User profile not found')
        return
      }

      // Check if user has admin or expert role
      const userRole = profile?.role?.toLowerCase()
      if (userRole !== 'admin' && userRole !== 'expert') {
        // Sign out user if they don't have the right role
        await supabase.auth.signOut()
        setAuthError(
          `You don't have permission to access the admin panel. Your current role is: ${profile?.role || 'none'}`
        )
        toast.error('Insufficient permissions', {
          description: 'You need admin or expert access to use this panel.',
        })
        return
      }

      // Successful login
      toast.success('Login successful!', {
        description: `Welcome back, ${authData.user.email}`,
      })

      // Store remember me preference if checked
      if (data.rememberMe) {
        localStorage.setItem('rememberEmail', data.email)
      } else {
        localStorage.removeItem('rememberEmail')
      }

      // Redirect to dashboard
      router.push('/')
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setAuthError(errorMessage)
      toast.error('Login Error', {
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-gray-900 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Title Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('pageTitle')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('pageSubtitle')}
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">{t('cardTitle')}</CardTitle>
            <CardDescription>
              {t('cardDescription')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Error Banner */}
              {authError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-200">{authError}</p>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  {t('emailLabel')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    className={cn(
                      'pl-10 py-2 h-10',
                      errors.email && 'border-red-500 focus-visible:ring-red-500'
                    )}
                    {...register('email')}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                  {t('passwordLabel')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={cn(
                      'pl-10 pr-10 py-2 h-10',
                      errors.password && 'border-red-500 focus-visible:ring-red-500'
                    )}
                    {...register('password')}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  {...register('rememberMe')}
                  disabled={isSubmitting}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-normal text-gray-600 dark:text-gray-400 cursor-pointer"
                >
                    {t('rememberMe')}
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className={cn(
                  'w-full h-10 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold transition-all duration-200',
                  isSubmitting && 'opacity-80 cursor-not-allowed'
                )}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('signingIn')}
                  </>
                ) : (
                  t('signIn')
                )}
              </Button>

              {/* Footer Text */}
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            {t('needAccessFooter')}
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          🔒 Your login information is encrypted and secure
        </p>
      </div>
    </div>
  )
}
