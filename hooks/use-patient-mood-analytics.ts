'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { MoodEntry } from '@/lib/types/database.types'

/**
 * Mood analytics data for a specific patient
 */
export interface PatientMoodAnalytics {
  moodEntries: MoodEntry[]
  averageMood: number
  moodTrend: { date: string; mood: number }[]
  topEmotionFactors: { factor: string; count: number }[]
  topTags: { tag: string; count: number }[]
  moodDistribution: { mood: number; count: number; percentage: number }[]
  totalEntries: number
  lastEntryDate: string | null
  streakDays: number
}

/**
 * Fetch and analyze mood data for a specific patient (for expert view)
 */
export function usePatientMoodAnalytics(patientId: string | null | undefined) {
  return useQuery({
    queryKey: ['patient-mood-analytics', patientId],
    queryFn: async (): Promise<PatientMoodAnalytics> => {
      if (!patientId) {
        return {
          moodEntries: [],
          averageMood: 0,
          moodTrend: [],
          topEmotionFactors: [],
          topTags: [],
          moodDistribution: [],
          totalEntries: 0,
          lastEntryDate: null,
          streakDays: 0,
        }
      }

      const supabase = createClient()

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', patientId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching patient mood data:', error)
        throw new Error(error.message)
      }

      const entries = data || []
      const totalEntries = entries.length

      if (totalEntries === 0) {
        return {
          moodEntries: [],
          averageMood: 0,
          moodTrend: [],
          topEmotionFactors: [],
          topTags: [],
          moodDistribution: [],
          totalEntries: 0,
          lastEntryDate: null,
          streakDays: 0,
        }
      }

      // Calculate average mood
      const averageMood =
        entries.reduce((sum, entry) => sum + entry.mood_score, 0) / totalEntries

      // Calculate mood trend (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const recentEntries = entries.filter(
        (entry) => new Date(entry.created_at) >= thirtyDaysAgo
      )

      const moodTrendMap = new Map<string, number>()
      recentEntries.forEach((entry) => {
        const dateKey = new Date(entry.created_at).toLocaleDateString('en-CA') // YYYY-MM-DD
        if (!moodTrendMap.has(dateKey)) {
          moodTrendMap.set(dateKey, entry.mood_score)
        }
      })

      const moodTrend = Array.from(moodTrendMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, mood]) => ({ date, mood }))

      // Calculate emotion factors frequency
      const emotionFactorCount = new Map<string, number>()
      entries.forEach((entry) => {
        entry.emotion_factors?.forEach((factor: string) => {
          emotionFactorCount.set(factor, (emotionFactorCount.get(factor) || 0) + 1)
        })
      })

      const topEmotionFactors = Array.from(emotionFactorCount.entries())
        .map(([factor, count]) => ({ factor, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Calculate tags frequency
      const tagCount = new Map<string, number>()
      entries.forEach((entry) => {
        entry.tags?.forEach((tag: string) => {
          tagCount.set(tag, (tagCount.get(tag) || 0) + 1)
        })
      })

      const topTags = Array.from(tagCount.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15)

      // Calculate mood distribution
      const moodCount = new Map<number, number>()
      for (let i = 1; i <= 5; i++) {
        moodCount.set(i, 0)
      }
      entries.forEach((entry) => {
        moodCount.set(entry.mood_score, (moodCount.get(entry.mood_score) || 0) + 1)
      })

      const moodDistribution = Array.from(moodCount.entries())
        .map(([mood, count]) => ({
          mood,
          count,
          percentage: totalEntries > 0 ? (count / totalEntries) * 100 : 0,
        }))
        .sort((a, b) => b.mood - a.mood)

      // Calculate streak (consecutive days with mood entries)
      let streakDays = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() - i)
        const dateStr = checkDate.toISOString().split('T')[0]

        const hasEntry = entries.some(
          (entry) => new Date(entry.created_at).toISOString().split('T')[0] === dateStr
        )

        if (hasEntry) {
          streakDays++
        } else if (i > 0) {
          break
        }
      }

      return {
        moodEntries: entries,
        averageMood,
        moodTrend,
        topEmotionFactors,
        topTags,
        moodDistribution,
        totalEntries,
        lastEntryDate: entries[0]?.created_at || null,
        streakDays,
      }
    },
    enabled: !!patientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
