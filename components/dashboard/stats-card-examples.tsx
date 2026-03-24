'use client'

import { StatsCard } from '@/components/dashboard/stats-card'
import { Users, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

/**
 * Example usage of the StatsCard component
 * Demonstrates all variations and props
 */
export function StatsCardExamples() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
      {/* Basic card with all props */}
      <StatsCard
        title="Total Users"
        value="1,234"
        icon={Users}
        description="+12% from last month"
        trend="up"
      />

      {/* Card with down trend */}
      <StatsCard
        title="Pending Experts"
        value={5}
        icon={AlertCircle}
        description="-23% from last week"
        trend="down"
      />

      {/* Card with neutral trend */}
      <StatsCard
        title="Active Sessions"
        value="42"
        icon={CheckCircle2}
        description="No change from yesterday"
        trend="neutral"
      />

      {/* Loading state */}
      <StatsCard
        title="Monthly Revenue"
        value="$12,450"
        icon={TrendingUp}
        description="+8% from last month"
        trend="up"
        isLoading={isLoading}
      />

      {/* Minimal card (no icon, no description) */}
      <StatsCard title="Total Visits" value="8,942" />

      {/* Numeric value (auto-formatted with toLocaleString) */}
      <StatsCard
        title="Conversion Rate"
        value={342}
        icon={TrendingUp}
        description="+5% improvement"
        trend="up"
      />

      {/* Custom className for layout control */}
      <StatsCard
        title="Support Tickets"
        value="127"
        icon={AlertCircle}
        description="-18% reduction"
        trend="down"
        className="md:col-span-2"
      />
    </div>
  )
}
