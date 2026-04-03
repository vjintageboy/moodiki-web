'use client';

import { useRecentAppointments } from '@/hooks/use-recent-activities';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CardSkeleton } from './skeleton-loaders';
import { Link } from '@/i18n/routing';
import { format } from 'date-fns';
import { Calendar, Users } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default';
    case 'confirmed':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
  }
}

export function RecentAppointments() {
  const t = useTranslations('DashboardHome')
  const locale = useLocale()
  const { data: appointments, isLoading, error } = useRecentAppointments();

  if (isLoading) return <CardSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-center">
        <div className="text-sm text-destructive">
          {t('recentAppointmentsError')}
        </div>
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {t('recentAppointmentsEmpty')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {appointments.map((appointment) => (
        <Link
          key={appointment.id}
          href={`/appointments/${appointment.id}`}
          className="block"
        >
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
            {/* User & Expert Avatars */}
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarImage src={appointment.user.avatar_url || undefined} />
                <AvatarFallback>{getInitials(appointment.user.full_name)}</AvatarFallback>
              </Avatar>
              <Avatar size="sm">
                <AvatarImage src={appointment.expert.avatar_url || undefined} />
                <AvatarFallback>{getInitials(appointment.expert.full_name)}</AvatarFallback>
              </Avatar>
            </div>

            {/* Names */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {appointment.user.full_name} → {appointment.expert.full_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(appointment.appointment_date), locale === 'vi' ? 'dd/MM/yyyy HH:mm' : 'MMM dd, yyyy HH:mm')}
              </p>
            </div>

            {/* Status Badge */}
            <Badge className={cn('capitalize', getStatusColor(appointment.status))}>
              {t(`status.${appointment.status.toLowerCase()}` as any) || appointment.status}
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}
