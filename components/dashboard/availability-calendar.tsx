'use client';

import React, { useState, useMemo, useRef } from 'react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  addHours, 
  startOfDay, 
  parseISO, 
  differenceInMinutes 
} from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  User, 
  Check, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AvailabilitySlot } from '@/hooks/use-expert-availability';
import { ExpertAppointmentWithUser } from '@/hooks/use-expert-dashboard';

interface AvailabilityCalendarProps {
  slots: AvailabilitySlot[];
  appointments: ExpertAppointmentWithUser[];
  onAddSlot: (start: Date, end: Date) => Promise<void>;
  onDeleteSlot: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const START_HOUR = 0;
const END_HOUR = 23;
const HOUR_HEIGHT = 80;

export function AvailabilityCalendar({ 
  slots, 
  appointments, 
  onAddSlot, 
  onDeleteSlot,
  isLoading 
}: AvailabilityCalendarProps) {
  const t = useTranslations('Availability');
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? vi : enUS;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

  const handlePrevWeek = () => setCurrentDate( d => addDays(d, -7));
  const handleNextWeek = () => setCurrentDate( d => addDays(d, 7));
  const handleToday = () => setCurrentDate(new Date());

  const handleGridClick = (day: Date, hour: number) => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = addHours(start, 1);
    setSelectedRange({ start, end });
    setIsDialogOpen(true);
  };

  const handleConfirmAdd = async () => {
    if (!selectedRange) return;
    try {
      await onAddSlot(selectedRange.start, selectedRange.end);
      setIsDialogOpen(false);
      setSelectedRange(null);
    } catch (err) {
      // Error handled by hook/toast
    }
  };

  // Rendering logic for slots and appointments
  const renderEvents = (day: Date) => {
    const daySlots = slots.filter(s => isSameDay(parseISO(s.start_time), day));
    const dayAppointments = appointments.filter(a => isSameDay(new Date(a.appointment_date), day));

    return (
      <>
        {/* Availability Slots (Background) */}
        {daySlots.map(slot => {
          const start = parseISO(slot.start_time);
          const end = parseISO(slot.end_time);
          const top = (start.getHours() * HOUR_HEIGHT) + (start.getMinutes() / 60 * HOUR_HEIGHT);
          const height = differenceInMinutes(end, start) / 60 * HOUR_HEIGHT;

          return (
            <div 
              key={slot.id}
              className="absolute left-0 right-0 mx-1 rounded-md bg-emerald-100/30 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 group transition-all"
              style={{ top: `${top}px`, height: `${height}px`, zIndex: 10 }}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteSlot(slot.id); }}
                className="absolute -top-2 -right-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-md border opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Appointments (Foreground) */}
        {dayAppointments.map(apt => {
          const start = new Date(apt.appointment_date);
          const duration = apt.duration_minutes || 60;
          const end = new Date(start.getTime() + duration * 60000);
          const top = (start.getHours() * HOUR_HEIGHT) + (start.getMinutes() / 60 * HOUR_HEIGHT);
          const height = (duration / 60) * HOUR_HEIGHT;

          return (
            <div 
              key={apt.id}
              className={cn(
                "absolute left-0 right-0 mx-2 rounded-lg border-l-4 shadow-sm p-2 overflow-hidden hover:brightness-95 transition-all text-xs",
                apt.status === 'confirmed' ? "bg-blue-50 border-blue-500 text-blue-900" : "bg-emerald-50 border-emerald-500 text-emerald-900"
              )}
              style={{ top: `${top}px`, height: `${height}px`, zIndex: 20 }}
            >
              <div className="flex items-center gap-1 font-bold truncate">
                {apt.user?.full_name || 'Client'}
              </div>
              <div className="flex items-center gap-1 opacity-80">
                <Clock className="w-3 h-3" />
                {format(start, 'HH:mm')}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            {format(weekStart, 'MMMM yyyy', { locale: dateLocale })}
          </h2>
          <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
            <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday} className="px-3 h-8">
              {t('today') || 'Today'}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20">{t('legend.available')}</Badge>
           <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20">{t('legend.booked')}</Badge>
        </div>
      </div>

      {/* Grid Header (Days) */}
      <div className="grid grid-cols-[72px_1fr] border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="p-3 border-r dark:border-gray-800" />
        <div className="grid grid-cols-7 flex-1">
          {weekDays.map(day => (
            <div key={day.toISOString()} className={cn(
              "p-3 text-center border-r dark:border-gray-800 last:border-r-0",
              isSameDay(day, new Date()) && "bg-blue-50/30 dark:bg-blue-500/5"
            )}>
              <p className={cn(
                "text-xs font-bold uppercase tracking-wider",
                isSameDay(day, new Date()) ? "text-blue-600" : "text-gray-500"
              )}>
                {format(day, 'EEE', { locale: dateLocale })}
              </p>
              <p className={cn(
                "text-xl font-black mt-1",
                isSameDay(day, new Date()) ? "text-blue-600" : "text-gray-900 dark:text-gray-100"
              )}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable Grid Body */}
      <div className="flex-1 overflow-y-auto relative scrollbar-hide">
        <div className="grid grid-cols-[72px_1fr] relative min-h-[1920px]">
          {/* Time Labels */}
          <div className="border-r dark:border-gray-800 bg-white dark:bg-gray-950 sticky left-0 z-30">
            {hours.map(hour => (
              <div 
                key={hour} 
                className="h-[80px] border-b dark:border-gray-800 relative flex items-start justify-center pt-2"
              >
                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Grid Slots */}
          <div className="grid grid-cols-7 relative">
            {weekDays.map(day => (
              <div key={day.toISOString()} className="relative border-r dark:border-gray-800 last:border-r-0">
                {hours.map(hour => (
                  <div 
                    key={hour} 
                    onClick={() => handleGridClick(day, hour)}
                    className="h-[80px] border-b border-gray-100 dark:border-gray-800/50 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors"
                  />
                ))}
                {renderEvents(day)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Add Dialog (Pop-over style replacement) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              {t('addSlot')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
               <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">
                 {selectedRange && format(selectedRange.start, 'EEEE, d MMMM', { locale: dateLocale })}
               </p>
               <div className="flex items-center gap-3 text-lg font-black text-blue-700 dark:text-blue-300">
                 <Clock className="w-5 h-5" />
                 {selectedRange && `${format(selectedRange.start, 'HH:mm')} - ${format(selectedRange.end, 'HH:mm')}`}
               </div>
            </div>
            <p className="text-sm text-gray-500">
               {t('addSlotHelper')}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleConfirmAdd} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
