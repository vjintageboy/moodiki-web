'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  Phone,
  MessageSquare,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  useWeeklySessions,
  getWeekDays,
  WeeklySession,
} from '@/hooks/use-weekly-calendar';

// Re-export for consumers
export type { WeeklySession };

// ============================================================================
// CONFIG
// ============================================================================

const HOUR_START = 8; // 8:00 AM
const HOUR_END = 18;   // 6:00 PM
const HOUR_HEIGHT = 64; // px per hour
const TOTAL_HOURS = HOUR_END - HOUR_START;
const GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

// ============================================================================
// HELPERS
// ============================================================================

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getStatusColor(status: string): { bg: string; text: string; border: string; badge: string; dot: string } {
  switch (status) {
    case 'confirmed':
      return {
        bg: 'bg-emerald-50/80 dark:bg-emerald-950/20',
        text: 'text-emerald-900 dark:text-emerald-100',
        border: 'border-l-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
        dot: 'bg-emerald-500',
      };
    case 'pending':
      return {
        bg: 'bg-amber-50/80 dark:bg-amber-950/20',
        text: 'text-amber-900 dark:text-amber-100',
        border: 'border-l-amber-500',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
        dot: 'bg-amber-500',
      };
    case 'cancelled':
      return {
        bg: 'bg-red-50/80 dark:bg-red-950/20',
        text: 'text-red-900 dark:text-red-100',
        border: 'border-l-red-500',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        dot: 'bg-red-500',
      };
    default:
      return {
        bg: 'bg-slate-50/80 dark:bg-slate-900/20',
        text: 'text-slate-900 dark:text-slate-100',
        border: 'border-l-slate-400',
        badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        dot: 'bg-slate-400',
      };
  }
}

function getCallTypeIcon(callType: string) {
  switch (callType) {
    case 'video': return Video;
    case 'audio': return Phone;
    case 'chat': return MessageSquare;
    default: return Clock;
  }
}

function getCallTypeLabel(callType: string, t: (key: string) => string): string {
  switch (callType) {
    case 'video': return t('videoCall');
    case 'audio': return t('audioCall');
    case 'chat': return t('chatSession');
    default: return callType;
  }
}

function getSessionTypeLabel(session: WeeklySession, t: (key: string) => string): string {
  // Derive a session type label from notes or call_type
  if (session.user_notes) {
    return session.user_notes;
  }
  return getCallTypeLabel(session.call_type, t);
}

// ============================================================================
// SESSION BLOCK
// ============================================================================

interface SessionBlockProps {
  session: WeeklySession;
  onClick: (session: WeeklySession) => void;
}

function SessionBlock({ session, onClick }: SessionBlockProps) {
  const colors = getStatusColor(session.status);

  // Calculate position
  const startHour = session.start_time.getHours() + session.start_time.getMinutes() / 60;
  const durationMinutes = (session.end_time.getTime() - session.start_time.getTime()) / 60000;
  const topOffset = (startHour - HOUR_START) * HOUR_HEIGHT;
  const blockHeight = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 28);

  // Skip sessions outside visible hours
  if (startHour < HOUR_START || startHour >= HOUR_END) return null;

  return (
    <button
      onClick={() => onClick(session)}
      className={`absolute left-1 right-1 rounded-xl border-l-[6px] ${colors.border} ${colors.bg} ${colors.text} px-3 py-2 text-left transition-all hover:shadow-lg hover:brightness-105 hover:scale-[1.01] hover:z-20 cursor-pointer group overflow-hidden shadow-sm`}
      style={{
        top: `${topOffset}px`,
        height: `${blockHeight}px`,
        minHeight: '32px',
      }}
    >
      <div className="flex items-center gap-2 truncate">
        <span className="text-[13px] font-bold truncate tracking-tight">{session.patient.full_name}</span>
        {blockHeight < 40 && (
          <span className="text-[10px] font-medium opacity-60 ml-auto">
            {formatTime(session.start_time)}
          </span>
        )}
      </div>
      {blockHeight > 40 && (
        <div className="flex flex-col gap-0.5 mt-0.5">
          <div className="flex items-center gap-1 opacity-70">
            {session.call_type === 'video' && <Video className="h-3 w-3 flex-shrink-0" />}
            {session.call_type === 'audio' && <Phone className="h-3 w-3 flex-shrink-0" />}
            {session.call_type === 'chat' && <MessageSquare className="h-3 w-3 flex-shrink-0" />}
            {session.call_type !== 'video' && session.call_type !== 'audio' && session.call_type !== 'chat' && <Clock className="h-3 w-3 flex-shrink-0" />}
            <span className="text-[10px] truncate font-medium">
              {formatTime(session.start_time)} – {formatTime(session.end_time)}
            </span>
          </div>
          {blockHeight > 60 && (
            <div className="mt-1 flex items-center gap-1.5">
               <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
               <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{session.status}</span>
            </div>
          )}
        </div>
      )}
    </button>
  );
}

// ============================================================================
// WEEKLY CALENDAR
// ============================================================================

interface WeeklyScheduleProps {
  expertId: string;
  onSessionClick?: (session: WeeklySession) => void;
}

export function WeeklySchedule({ expertId, onSessionClick }: WeeklyScheduleProps) {
  const t = useTranslations('WeeklyCalendar');
  const [weekOffset, setWeekOffset] = useState(0);

  const { data, isLoading } = useWeeklySessions(expertId, weekOffset);
  const weekDays = data ? getWeekDays(data.currentWeekStart) : getWeekDays(new Date());

  // Group sessions by day
  const sessionsByDay = useMemo(() => {
    if (!data) return new Map<number, WeeklySession[]>();
    const map = new Map<number, WeeklySession[]>();
    for (const session of data.sessions) {
      const dayIndex = session.start_time.getDay(); // 0=Sun
      // Convert to Mon=0 .. Sun=6
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      if (!map.has(adjustedIndex)) map.set(adjustedIndex, []);
      map.get(adjustedIndex)!.push(session);
    }
    return map;
  }, [data]);

  // Generate hour labels
  const hourLabels = Array.from({ length: TOTAL_HOURS }, (_, i) => {
    const hour = HOUR_START + i;
    return `${String(hour).padStart(2, '0')}:00`;
  });

  const weekLabel = data
    ? `${data.currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${data.currentWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : '';

  return (
    <Card className="border-none bg-white dark:bg-gray-950 shadow-sm rounded-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5 text-indigo-500" />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('title')}</h3>
            <p className="text-xs text-muted-foreground">{weekLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setWeekOffset((p) => p - 1)}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(0)}
            className="text-xs"
          >
            {t('today')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setWeekOffset((p) => p + 1)}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 px-6 py-3 border-b border-slate-50 dark:border-slate-800/30 bg-slate-50/30 dark:bg-slate-900/10">
        {(['confirmed', 'pending', 'cancelled'] as const).map((status) => {
          const c = getStatusColor(status);
          return (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${c.dot}`} />
              <span className="text-[11px] font-semibold text-slate-500/80 capitalize">{status}</span>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-800">
            <div className="p-3 text-center text-xs font-medium text-muted-foreground border-r border-gray-50 dark:border-gray-800">
              {t('time')}
            </div>
            {weekDays.map((day, i) => (
              <div
                key={i}
                className={`p-3 text-center border-r border-gray-50 dark:border-gray-800 last:border-r-0 transition-colors ${
                  day.isToday
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/30'
                    : ''
                }`}
              >
                <div className={`text-xs font-semibold uppercase tracking-wide ${
                  day.isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'
                }`}>
                  {day.dayName}
                </div>
                <div className={`text-lg font-bold mt-0.5 ${
                  day.isToday
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {day.dayNum}
                </div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-8 relative">
            {/* Time labels column */}
            <div className="border-r border-gray-50 dark:border-gray-800">
              {hourLabels.map((label, i) => (
                <div
                  key={i}
                  className="flex items-start justify-center pt-1 text-[10px] font-mono text-muted-foreground"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIndex) => {
              const daySessions = sessionsByDay.get(dayIndex) || [];
              return (
                <div
                  key={dayIndex}
                  className={`relative border-r border-gray-50 dark:border-gray-800 last:border-r-0 ${
                    day.isToday
                      ? 'bg-indigo-50/30 dark:bg-indigo-950/20'
                      : ''
                  }`}
                  style={{ height: `${GRID_HEIGHT}px` }}
                >
                  {/* Horizontal hour lines */}
                  {hourLabels.map((_, i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800/50"
                      style={{ top: `${i * HOUR_HEIGHT}px` }}
                    />
                  ))}

                  {/* Current time indicator */}
                  {day.isToday && (
                    <CurrentTimeIndicator />
                  )}

                  {/* Session blocks */}
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                      {t('loading')}
                    </div>
                  ) : (
                    daySessions.map((session) => (
                      <SessionBlock
                        key={session.id}
                        session={session}
                        onClick={onSessionClick ?? (() => {})}
                      />
                    ))
                  )}

                  {/* Empty state */}
                  {!isLoading && daySessions.length === 0 && day.isToday && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground opacity-50">{t('noSessions')}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// CURRENT TIME INDICATOR
// ============================================================================

function CurrentTimeIndicator() {
  const [now, setNow] = useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const minutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = HOUR_START * 60;
  const topOffset = ((minutes - startMinutes) / 60) * HOUR_HEIGHT;

  if (minutes < HOUR_START * 60 || minutes > HOUR_END * 60) return null;

  return (
    <div
      className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
      style={{ top: `${topOffset}px` }}
    >
      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
      <div className="flex-1 h-0.5 bg-red-500/70" />
    </div>
  );
}
