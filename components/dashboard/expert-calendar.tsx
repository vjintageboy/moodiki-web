'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Phone, Video, MessageSquare } from 'lucide-react';
import { ExpertAppointmentWithUser } from '@/hooks/use-expert-dashboard';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';

interface ExpertCalendarProps {
  appointments: ExpertAppointmentWithUser[];
  isLoading?: boolean;
  onAppointmentClick?: (appointment: ExpertAppointmentWithUser) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getCallTypeIcon = (callType: string) => {
  switch (callType) {
    case 'video':
      return <Video className="w-4 h-4" />;
    case 'audio':
      return <Phone className="w-4 h-4" />;
    case 'chat':
      return <MessageSquare className="w-4 h-4" />;
    default:
      return null;
  }
};

export function ExpertCalendar({
  appointments,
  isLoading = false,
  onAppointmentClick,
}: ExpertCalendarProps) {
  const t = useTranslations('DashboardHome')
  const locale = useLocale()
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500">{t('noUpcomingAppointments')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0 divide-y">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => onAppointmentClick?.(appointment)}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left: Date & Time */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <Calendar className="w-4 h-4 text-gray-500" />
                {format(new Date(appointment.appointment_date), locale === 'vi' ? 'dd/MM/yyyy' : 'MMM dd, yyyy')}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Clock className="w-4 h-4 text-gray-500" />
                {format(new Date(appointment.appointment_date), 'HH:mm')} -
                {format(
                  new Date(
                    new Date(appointment.appointment_date).getTime() +
                      appointment.duration_minutes * 60000
                  ),
                  'HH:mm'
                )}
              </div>
            </div>

            {/* Center: User Info & Call Type */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                {appointment.user?.avatar_url && (
                  <img
                    src={appointment.user.avatar_url}
                    alt={appointment.user?.full_name || 'User'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {appointment.user?.full_name || t('unknownUser')}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {appointment.user?.email}
                  </p>
                </div>
              </div>

              {/* Call Type Badge */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                  {getCallTypeIcon(appointment.call_type)}
                  <span className="capitalize">{appointment.call_type}</span>
                </div>
              </div>
            </div>

            {/* Right: Status & Notes */}
            <div className="flex-shrink-0 text-right">
              <Badge className={cn('mb-2', getStatusColor(appointment.status))}>
                {t(`status.${appointment.status.toLowerCase()}` as any) || appointment.status}
              </Badge>

              {appointment.payment_status && (
                <div className="text-xs text-gray-600 mt-1">
                  {appointment.payment_status === 'paid' ? (
                    <span className="text-green-600">{t('paid')}</span>
                  ) : (
                    <span className="text-gray-500">{t('unpaid')}</span>
                  )}
                </div>
              )}

              {appointment.expert_base_price && (
                <div className="text-sm font-medium text-gray-900 mt-2">
                  {new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                    style: 'currency',
                    currency: locale === 'vi' ? 'VND' : 'USD',
                  }).format(locale === 'vi' ? appointment.expert_base_price * 1000 : appointment.expert_base_price / 100)}
                </div>
              )}
            </div>
          </div>

          {/* Notes if present */}
          {appointment.user_notes && (
            <div className="mt-3 pt-3 border-t text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">{t('notesLabel')}</p>
              <p className="line-clamp-2">{appointment.user_notes}</p>
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}
