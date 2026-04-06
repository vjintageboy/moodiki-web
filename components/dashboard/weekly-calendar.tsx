'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { format, startOfWeek, addDays, getHours, getMinutes, isSameDay, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Video, Phone, MessageSquare, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { AppointmentWithRelations } from '@/hooks/use-appointments';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface WeeklyCalendarProps {
  data: AppointmentWithRelations[];
  actions?: (item: AppointmentWithRelations) => React.ReactNode;
}

const START_HOUR = 6;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

function getInitials(name: string | null | undefined, fallback = 'U'): string {
  if (!name) return fallback;
  return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
}

// Logic to process overlaps and assign columns
function processOverlaps(events: AppointmentWithRelations[]) {
  const sorted = [...events].sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
  const columns: AppointmentWithRelations[][] = [];

  sorted.forEach(event => {
    let placed = false;
    const eventStart = new Date(event.appointment_date).getTime();
    for (const col of columns) {
      const lastEvent = col[col.length - 1];
      const lastEnd = new Date(lastEvent.appointment_date).getTime() + (lastEvent.duration_minutes * 60000);
      if (eventStart >= lastEnd) {
        col.push(event);
        placed = true;
        break;
      }
    }
    if (!placed) columns.push([event]);
  });

  return sorted.map(event => {
    const colIndex = columns.findIndex(col => col.includes(event));
    return {
      event,
      left: `${(colIndex / columns.length) * 100}%`,
      width: `${100 / columns.length}%`
    };
  });
}

export function WeeklyCalendar({ data, actions }: WeeklyCalendarProps) {
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? vi : enUS;
  const t = useTranslations('Appointments');
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<AppointmentWithRelations | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time indicator every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const appointmentsThisWeek = data.filter(target => {
    const d = new Date(target.appointment_date);
    return d >= weekStart && d < addDays(weekStart, 7);
  });

  const handleNextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));

  const getCallTypeIcon = (callType: string) => {
    switch (callType) {
      case 'video': return <Video className="h-3 w-3" />;
      case 'audio': return <Phone className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700 dark:bg-blue-800 dark:border-blue-900';
      case 'pending': return 'bg-orange-500 border-orange-600 text-white hover:bg-orange-600 dark:bg-orange-700 dark:border-orange-800';
      case 'cancelled': return 'bg-gray-400 border-gray-500 text-white hover:bg-gray-500 dark:bg-gray-700 dark:border-gray-800';
      default: return 'bg-slate-600 border-slate-700 text-white hover:bg-slate-700 dark:bg-slate-800 dark:border-slate-900';
    }
  };

  // Mini Calendar State
  const [miniCalendarDate, setMiniCalendarDate] = useState(currentDate);
  const monthStart = startOfMonth(miniCalendarDate);
  const monthEnd = endOfMonth(monthStart);
  
  // Get all days to render in mini calendar, padding start to Monday (1)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0 is Sunday, 1 is Monday...
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; 

  const handleMiniPrevMonth = () => setMiniCalendarDate(prev => subMonths(prev, 1));
  const handleMiniNextMonth = () => setMiniCalendarDate(prev => addMonths(prev, 1));

  const handleMiniDayClick = (day: Date) => {
    setCurrentDate(day);
    setMiniCalendarDate(day);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-4 items-start w-full">
      {/* LEFT PANE: Weekly Schedule Container */}
      <div className="flex-1 flex flex-col h-[800px] border rounded-xl overflow-hidden bg-white dark:bg-gray-950 shadow-[0px_2px_10px_rgba(0,0,0,0.05)] w-full">
        {/* Header Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
              {locale === 'vi' ? 'Lịch cá nhân' : 'Personal Schedule'}
            </h2>
          </div>
        </div>

        {appointmentsThisWeek.length === 0 && (
           <div className="absolute inset-x-0 bottom-0 top-[73px] flex flex-col items-center justify-center bg-gray-50/10 dark:bg-gray-900/10 z-30 pointer-events-none opacity-80">
              <CalendarIcon className="h-10 w-10 text-gray-400 mb-3" />
              <p className="text-gray-500 font-medium">{t('empty.noAppointments')}</p>
           </div>
        )}

        {/* Calendar Grid Container */}
        <div className="flex flex-1 overflow-auto relative scroll-smooth bg-white dark:bg-gray-950 rounded-b-xl">
          {/* Left Time Column (Sticky) */}
          <div className="sticky left-0 w-[72px] flex flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 z-40">
            <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center bg-white dark:bg-gray-950">
               <Clock className="w-5 h-5 text-gray-400 mb-1" />
               <span className="text-[10px] font-medium text-gray-400">GMT+7</span>
            </div>
            {HOURS.map(hour => (
              <div key={hour} className="h-[80px] relative border-b border-gray-100 dark:border-gray-800/50">
                <span className="absolute -top-[10px] left-0 right-0 text-center text-[13px] text-gray-900 dark:text-gray-400 font-bold">
                  {hour.toString()}:00
                </span>
              </div>
            ))}
          </div>

          {/* Days and Grid */}
          <div className="flex flex-1 min-w-[700px]">
            {weekDays.map((day) => {
              const isToday = isSameDay(day, currentTime);
              const isSelectedDay = isSameDay(day, currentDate);
              const daysAppointments = appointmentsThisWeek.filter(a => isSameDay(new Date(a.appointment_date), day));
              const positionedEvents = processOverlaps(daysAppointments);
              
              return (
                <div key={day.toISOString()} className="flex-1 flex flex-col min-w-[100px] border-r border-gray-200 dark:border-gray-800 last:border-r-0">
                  {/* Day Header */}
                  <div className="sticky top-0 bg-white dark:bg-gray-950 z-30 border-b border-gray-200 dark:border-gray-800 h-16 flex flex-col items-center justify-center">
                    <span className={cn('text-sm font-semibold tracking-tight', isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100')}>
                      {format(day, 'dd/MM/yyyy')}
                    </span>
                    <span className={cn('text-xs font-medium uppercase', isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500')}>
                      {format(day, 'EEE', { locale: dateLocale })}
                    </span>
                  </div>

                  {/* Day Grid Lines & Appointments */}
                  <div className={cn("relative flex-1", isSelectedDay ? "bg-blue-50/30 dark:bg-blue-900/5" : "")}>
                    {/* Grid background lines */}
                    {HOURS.map(hour => (
                       <div key={hour} className="h-[80px] border-b border-gray-100 dark:border-gray-800/50 transition-colors group">
                         <div className="w-full h-full hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors" />
                       </div>
                    ))}

                    {/* Red Time Indicator Line */}
                    {isToday && (
                      <div 
                        className="absolute left-0 right-0 h-[2px] bg-red-400 z-20 flex items-center"
                        style={{ 
                          top: `${
                            (currentTime.getHours() - START_HOUR > 0 ? (currentTime.getHours() - START_HOUR) : 0) * 80 
                            + (currentTime.getMinutes() / 60) * 80 
                          }px`,
                          display: currentTime.getHours() >= START_HOUR && currentTime.getHours() <= END_HOUR ? 'flex' : 'none'
                        }}
                      >
                        <div className="w-2 h-2 rounded-full bg-red-400 -ml-1" />
                      </div>
                    )}

                    {/* Absolutely positioned appointments */}
                    {positionedEvents.map(({ event, left, width }) => {
                      const dateObj = new Date(event.appointment_date);
                      const hours = getHours(dateObj);
                      const minutes = getMinutes(dateObj);
                      
                      if (hours < START_HOUR || hours > END_HOUR) return null;

                      const topPixels = ((hours - START_HOUR) * 80) + ((minutes / 60) * 80);
                      const heightPixels = Math.max((event.duration_minutes / 60) * 80, 32);

                      return (
                        <div 
                          key={event.id}
                          className={cn(
                            "absolute rounded-sm border p-0 shadow-sm text-[11px] cursor-pointer hover:brightness-110 transition-all overflow-hidden z-10 m-[1px] flex flex-col",
                            getStatusColor(event.status)
                          )}
                          style={{ top: `${topPixels}px`, height: `${heightPixels - 2}px`, left, width: `calc(${width} - 2px)` }}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="bg-black/20 text-white font-semibold px-1.5 py-0.5 truncate shrink-0">
                            Lịch hẹn
                          </div>
                          <div className="px-1.5 py-1 text-center bg-white dark:bg-gray-900 border-x border-b border-transparent text-gray-800 dark:text-gray-200 h-full flex flex-col overflow-hidden">
                             <div className="font-semibold truncate w-full text-blue-900 dark:text-blue-300">
                               {format(dateObj, 'HH:mm')} - {format(new Date(dateObj.getTime() + event.duration_minutes * 60000), 'HH:mm')}
                             </div>
                             <div className="truncate w-full font-medium">({event.duration_minutes}m)</div>
                             <div className="truncate w-full mt-0.5 font-medium">{event.user?.full_name || 'Client'}</div>
                             <div className="mt-auto flex items-center justify-center gap-1 opacity-80 pt-1">
                               {getCallTypeIcon(event.call_type)}
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Mini Month Calendar Side Panel */}
      <div className="hidden xl:flex flex-col w-[300px] shrink-0 bg-white dark:bg-gray-950 rounded-xl shadow-[0px_2px_10px_rgba(0,0,0,0.05)] border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="bg-[#1e2a4f] text-white p-3.5 flex justify-between items-center">
           <span className="font-bold text-sm">
             {locale === 'vi' ? 'Tháng ' : ''}{format(miniCalendarDate, locale === 'vi' ? 'M-yyyy' : 'MMMM yyyy')}
           </span>
           <div className="flex gap-1.5">
             <button onClick={handleMiniPrevMonth} className="p-1 hover:bg-white/20 rounded-md transition-colors">
               <ChevronLeft className="w-4 h-4" />
             </button>
             <button onClick={handleMiniNextMonth} className="p-1 hover:bg-white/20 rounded-md transition-colors">
               <ChevronRight className="w-4 h-4" />
             </button>
           </div>
        </div>
        
        <div className="p-4 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['T2','T3','T4','T5','T6','T7','Cn'].map(d => (
               <div key={d} className="text-[11px] font-semibold text-gray-500 uppercase py-1">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for padding */}
            {Array.from({length: paddingDays}).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}
            
            {/* Actual Days */}
            {monthDays.map(day => {
               const isSelected = isSameDay(day, currentDate);
               const isToday = isSameDay(day, new Date());
               
               return (
                 <button
                   key={day.toISOString()}
                   onClick={() => handleMiniDayClick(day)}
                   className={cn(
                     "h-8 text-[13px] font-medium rounded-full flex items-center justify-center transition-all",
                     isSelected ? "bg-orange-500 text-white shadow-sm font-bold" :
                     isToday ? "bg-blue-100 text-blue-700 font-bold dark:bg-blue-900 dark:text-blue-200" :
                     "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                   )}
                 >
                   {format(day, 'd')}
                 </button>
               );
            })}
          </div>
        </div>
      </div>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{t('dialogs.rescheduleTitle') || 'Appointment Details'}</DialogTitle> 
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border dark:border-gray-800">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedEvent.user?.avatar_url || ''} />
                    <AvatarFallback>{getInitials(selectedEvent.user?.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {selectedEvent.user?.full_name || 'Unknown Client'}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{selectedEvent.user?.email}</p>
                  </div>
                  <Badge variant="outline" className={cn("border-0", getStatusColor(selectedEvent.status))}>
                    {t(`status.${selectedEvent.status.toLowerCase()}` as any)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500">{t('table.dateTime')}</span>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedEvent.appointment_date), 'MMM dd, HH:mm')} 
                      <span className="text-gray-500 ml-1">({selectedEvent.duration_minutes}m)</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500">{t('table.callType')}</span>
                    <p className="text-sm font-medium capitalize flex items-center gap-1.5">
                      {getCallTypeIcon(selectedEvent.call_type)}
                      {t(`callType.${selectedEvent.call_type.toLowerCase()}` as any) || selectedEvent.call_type}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500">{t('table.payment')}</span>
                    <p className="text-sm font-medium capitalize">
                      {t(`paymentStatus.${selectedEvent.payment_status?.toLowerCase() || 'unpaid'}` as any)}
                    </p>
                  </div>
                </div>

                {(selectedEvent as any).meeting_link && (
                  <div className="space-y-1">
                     <span className="text-xs font-medium text-gray-500">Meeting Link</span>
                     <p className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate">
                       <a href={(selectedEvent as any).meeting_link} target="_blank" rel="noreferrer">{(selectedEvent as any).meeting_link}</a>
                     </p>
                  </div>
                )}

                {selectedEvent.user_notes && (
                   <div className="space-y-1 pt-2 border-t dark:border-gray-800">
                     <span className="text-xs font-medium text-gray-500">Notes</span>
                     <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border dark:border-gray-800">
                       {selectedEvent.user_notes}
                     </p>
                   </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-4 border-t dark:border-gray-800">
                   {actions && actions(selectedEvent)}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
