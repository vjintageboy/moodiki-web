'use client'

import React, { useMemo } from 'react'
import { motion } from 'motion/react'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface StatsCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  description?: string
  trend?: 'up' | 'down' | 'neutral'
  isLoading?: boolean
  className?: string
}

// Skeleton loader component
function SkeletonLoader() {
  return (
    <div className="space-y-3">
      {/* Title skeleton */}
      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
      
      {/* Value skeleton */}
      <div className="h-8 w-32 bg-muted rounded animate-pulse" />
      
      {/* Description skeleton */}
      <div className="h-3 w-40 bg-muted rounded animate-pulse" />
    </div>
  )
}

// Animated number component
function AnimatedNumber({ value }: { value: string | number }) {
  const numValue = typeof value === 'string' ? parseInt(value.replace(/,/g, ''), 10) : value
  const displayValue = typeof value === 'string' ? value : numValue.toLocaleString()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="text-2xl font-bold text-foreground"
    >
      {displayValue}
    </motion.div>
  )
}

// Trend indicator component
function TrendIndicator({
  trend,
  description,
}: {
  trend?: 'up' | 'down' | 'neutral'
  description?: string
}) {
  const getTrendConfig = (
    trendType?: 'up' | 'down' | 'neutral'
  ): {
    icon: React.ReactNode
    color: string
    bgColor: string
  } => {
    switch (trendType) {
      case 'up':
        return {
          icon: <TrendingUp className="h-3 w-3" />,
          color: 'text-green-600 dark:text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-950/30',
        }
      case 'down':
        return {
          icon: <TrendingDown className="h-3 w-3" />,
          color: 'text-red-600 dark:text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-950/30',
        }
      case 'neutral':
        return {
          icon: <Minus className="h-3 w-3" />,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-950/30',
        }
      default:
        return {
          icon: null,
          color: 'text-muted-foreground',
          bgColor: 'bg-transparent',
        }
    }
  }

  const config = getTrendConfig(trend)

  if (!description) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={cn(
        'flex items-center gap-1.5 text-xs font-medium',
        'rounded px-2 py-1 w-fit',
        config.bgColor,
        config.color
      )}
    >
      {trend && config.icon}
      <span>{description}</span>
    </motion.div>
  )
}

// Icon container component
function IconContainer({ icon: Icon }: { icon?: LucideIcon }) {
  if (!Icon) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className={cn(
        'flex items-center justify-center',
        'h-12 w-12 rounded-lg',
        'bg-primary/10 dark:bg-primary/20',
        'text-primary dark:text-primary'
      )}
    >
      <Icon className="h-6 w-6" />
    </motion.div>
  )
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  isLoading = false,
  className,
}: StatsCardProps) {
  // Memoize to prevent unnecessary re-renders
  const displayValue = useMemo(() => {
    if (typeof value === 'string') return value
    return value.toLocaleString()
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -2 }}
      className={className}
    >
      <Card className="relative overflow-hidden group/stats-card h-full">
        {/* Background gradient effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/0 group-hover/stats-card:from-primary/5 group-hover/stats-card:to-primary/5 transition-colors duration-300" />

        {/* Content */}
        <div className="relative flex flex-col justify-between h-full p-6">
          {/* Top section: Title and Icon */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="flex-1"
            >
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {title}
              </p>
            </motion.div>

            {/* Icon on the right */}
            {Icon && <IconContainer icon={Icon} />}
          </div>

          {/* Middle section: Value or Skeleton */}
          {isLoading ? (
            <SkeletonLoader />
          ) : (
            <div className="mb-4">
              <AnimatedNumber value={displayValue} />
            </div>
          )}

          {/* Bottom section: Description with trend */}
          {!isLoading && (
            <div>
              <TrendIndicator trend={trend} description={description} />
            </div>
          )}
        </div>

        {/* Loading overlay shimmer effect */}
        {isLoading && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}
      </Card>
    </motion.div>
  )
}

export default StatsCard
