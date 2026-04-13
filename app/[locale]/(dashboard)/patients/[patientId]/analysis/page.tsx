'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTranslations, useLocale } from 'next-intl'
import { format, subDays } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'
import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Tag,
  Activity,
  Smile,
  Frown,
  Meh,
  AlertCircle,
  User,
  Mail,
  Phone,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { usePatientMoodAnalytics } from '@/hooks/use-patient-mood-analytics'

// Lazy load recharts
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false })
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false })

// Fetch patient user data
function usePatientUser(patientId: string | null) {
  return useQuery({
    queryKey: ['patient-user', patientId],
    queryFn: async () => {
      if (!patientId) return null
      const supabase = createClient()
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', patientId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!patientId,
  })
}

const MOOD_EMOJI = {
  1: { emoji: '😢', label: 'Terrible', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
  2: { emoji: '😞', label: 'Bad', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  3: { emoji: '😐', label: 'Okay', color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  4: { emoji: '🙂', label: 'Good', color: 'text-lime-500', bg: 'bg-lime-100 dark:bg-lime-900/30' },
  5: { emoji: '😄', label: 'Excellent', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

export default function PatientAnalysisPage() {
  const t = useTranslations('PatientAnalysis')
  const locale = useLocale()
  const dateLocale = locale === 'vi' ? vi : enUS
  const { theme } = useTheme()
  const params = useParams()
  const router = useRouter()
  const patientId = params?.patientId as string | undefined

  const { data: patientUser } = usePatientUser(patientId || null)
  const { data: analytics, isLoading } = usePatientMoodAnalytics(patientId || null)

  const [mounted, setMounted] = useState(false)
  useState(() => { setMounted(true) })

  const isDark = mounted && theme === 'dark'
  const gridColor = isDark ? '#374151' : '#e5e7eb'
  const textColor = isDark ? '#d1d5db' : '#374151'
  const tooltipBg = isDark ? '#1f2937' : '#ffffff'

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: tooltipBg,
      border: `1px solid ${gridColor}`,
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    },
    labelStyle: { color: textColor, fontWeight: 'bold' },
  }

  if (!patientId) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">{t('noPatientSelected')}</h2>
        <Button onClick={() => router.push('/patients')} variant="outline">
          {t('backToPatients')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/patients')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToPatients')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground mt-1">{t('description')}</p>
          </div>
        </div>
      </div>

      {/* Patient Info Card */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('patientInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || !patientUser ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2">
                <AvatarImage src={patientUser.avatar_url || ''} />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                  {(patientUser.full_name || 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-xl font-bold">{patientUser.full_name || 'Anonymous User'}</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {patientUser.email}
                  </span>
                  {patientUser.phone_number && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {patientUser.phone_number}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">{t('kpi.averageMood')}</p>
              <Activity className="h-5 w-5 text-primary" />
            </div>
            {isLoading || !analytics ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="space-y-1">
                <p className="text-3xl font-bold">
                  {analytics.averageMood.toFixed(1)}
                </p>
                <div className="flex items-center gap-1">
                  {analytics.averageMood >= 4 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : analytics.averageMood <= 2 ? (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  ) : (
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {analytics.averageMood >= 4 ? t('kpi.positive') : analytics.averageMood <= 2 ? t('kpi.concerning') : t('kpi.neutral')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">{t('kpi.totalEntries')}</p>
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            {isLoading || !analytics ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="space-y-1">
                <p className="text-3xl font-bold">{analytics.totalEntries}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.lastEntryDate
                    ? format(new Date(analytics.lastEntryDate), 'MMM dd, yyyy', { locale: dateLocale })
                    : t('kpi.noEntries')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">{t('kpi.streakDays')}</p>
              <Clock className="h-5 w-5 text-green-500" />
            </div>
            {isLoading || !analytics ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="space-y-1">
                <p className="text-3xl font-bold">{analytics.streakDays}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.streakDays >= 7 ? t('kpi.goodStreak') : t('kpi.keepTracking')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">{t('kpi.moodLevel')}</p>
              {analytics && analytics.averageMood >= 4 ? (
                <Smile className="h-5 w-5 text-green-500" />
              ) : analytics && analytics.averageMood <= 2 ? (
                <Frown className="h-5 w-5 text-red-500" />
              ) : (
                <Meh className="h-5 w-5 text-yellow-500" />
              )}
            </div>
            {isLoading || !analytics ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="space-y-2">
                <Progress value={(analytics.averageMood / 5) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {analytics.averageMood.toFixed(1)} / 5
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mood Trend Chart */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('charts.moodTrend')}
            </CardTitle>
            <CardDescription>{t('charts.moodTrendDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !analytics || analytics.moodTrend.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center">
                <Skeleton className="h-48 w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={analytics.moodTrend}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis
                    dataKey="date"
                    stroke={textColor}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => format(new Date(value), 'MMM d', { locale: dateLocale })}
                  />
                  <YAxis
                    stroke={textColor}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tickFormatter={(value) => MOOD_EMOJI[value as keyof typeof MOOD_EMOJI]?.emoji || value}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value: any) => [
                      `${MOOD_EMOJI[value as keyof typeof MOOD_EMOJI]?.emoji || ''} ${MOOD_EMOJI[value as keyof typeof MOOD_EMOJI]?.label || ''}`,
                      t('charts.mood'),
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMood)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Mood Distribution */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('charts.moodDistribution')}
            </CardTitle>
            <CardDescription>{t('charts.moodDistributionDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !analytics || analytics.moodDistribution.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center">
                <Skeleton className="h-48 w-48 rounded-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={analytics.moodDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis
                      dataKey="mood"
                      stroke={textColor}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => MOOD_EMOJI[value as keyof typeof MOOD_EMOJI]?.emoji || value}
                    />
                    <YAxis
                      stroke={textColor}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {analytics.moodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[5 - entry.mood]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {analytics.moodDistribution.map((dist) => (
                    <div key={dist.mood} className="flex items-center gap-3">
                      <span className="text-2xl">{MOOD_EMOJI[dist.mood as keyof typeof MOOD_EMOJI]?.emoji}</span>
                      <div className="flex-1">
                        <Progress value={dist.percentage} className="h-2" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground w-12 text-right">
                        {dist.percentage.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emotion Factors & Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Emotion Factors */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('factors.topEmotions')}
            </CardTitle>
            <CardDescription>{t('factors.topEmotionsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !analytics || analytics.topEmotionFactors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{t('factors.noFactors')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.topEmotionFactors.map((factor, index) => (
                  <div key={factor.factor} className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium capitalize">{factor.factor}</p>
                      <p className="text-xs text-muted-foreground">
                        {factor.count} {factor.count === 1 ? t('factors.time') : t('factors.times')}
                      </p>
                    </div>
                    <Badge variant="outline">{factor.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Tags */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {t('tags.topTags')}
            </CardTitle>
            <CardDescription>{t('tags.topTagsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !analytics || analytics.topTags.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{t('tags.noTags')}</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {analytics.topTags.map((tag) => (
                  <Badge key={tag.tag} variant="secondary" className="px-3 py-1.5 text-sm">
                    {tag.tag}
                    <span className="ml-2 text-xs opacity-60">×{tag.count}</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Mood Entries Table */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('recentEntries')}
          </CardTitle>
          <CardDescription>{t('recentEntriesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || !analytics || analytics.moodEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t('recentEntriesEmpty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                    <th className="text-left py-3 px-4">{t('table.date')}</th>
                    <th className="text-left py-3 px-4">{t('table.mood')}</th>
                    <th className="text-left py-3 px-4">{t('table.note')}</th>
                    <th className="text-left py-3 px-4">{t('table.factors')}</th>
                    <th className="text-left py-3 px-4">{t('table.tags')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {analytics.moodEntries.slice(0, 10).map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">
                        {format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm', { locale: dateLocale })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {MOOD_EMOJI[entry.mood_score as keyof typeof MOOD_EMOJI]?.emoji}
                          </span>
                          <span className="text-sm font-medium">
                            {MOOD_EMOJI[entry.mood_score as keyof typeof MOOD_EMOJI]?.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-[200px]">
                        {entry.note ? (
                          <p className="text-sm text-muted-foreground line-clamp-2">{entry.note}</p>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {entry.emotion_factors?.slice(0, 3).map((factor) => (
                            <Badge key={factor} variant="outline" className="text-[10px] py-0 px-1.5 h-5 capitalize">
                              {factor}
                            </Badge>
                          ))}
                          {entry.emotion_factors && entry.emotion_factors.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{entry.emotion_factors.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {entry.tags?.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] py-0 px-1.5 h-5">
                              {tag}
                            </Badge>
                          ))}
                          {entry.tags && entry.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{entry.tags.length - 3}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
