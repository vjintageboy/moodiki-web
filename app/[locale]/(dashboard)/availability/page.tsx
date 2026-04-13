'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import {
  useExpertAvailability,
  useCreateBulkAvailabilityMutation,
  useDeleteAvailabilityMutation,
  useCreateAvailabilityMutation
} from '@/hooks/use-expert-availability';
import { useExpertUpcomingAppointments } from '@/hooks/use-expert-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  AlertCircle,
  Layers,
  Settings2,
  List,
  CalendarDays
} from 'lucide-react';
import { format, addDays, getDay } from 'date-fns';
import { useTranslations, useLocale } from 'next-intl';
import { AvailabilityCalendar } from '@/components/dashboard/availability-calendar';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = [
  { id: 1, key: 'mon' },
  { id: 2, key: 'tue' },
  { id: 3, key: 'wed' },
  { id: 4, key: 'thu' },
  { id: 5, key: 'fri' },
  { id: 6, key: 'sat' },
  { id: 0, key: 'sun' },
];

export default function AvailabilityPage() {
  const t = useTranslations('Availability');
  const locale = useLocale();
  const { user, isExpert, loading: authLoading } = useAuth();
  
  // View Toggle
  const [view, setView] = React.useState<'calendar' | 'bulk'>('calendar');

  // Bulk Generator Form State
  const [startDate, setStartDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [weeks, setWeeks] = React.useState('4');
  const [selectedDays, setSelectedDays] = React.useState<number[]>([]);
  const [startTime, setStartTime] = React.useState('09:00');
  const [endTime, setEndTime] = React.useState('17:00');

  const { data: slots, isLoading: slotsLoading } = useExpertAvailability(isExpert ? user?.id : undefined);
  const { data: appointments, isLoading: appointmentsLoading } = useExpertUpcomingAppointments(isExpert ? user?.id || '' : '');
  
  const createSlotMutation = useCreateAvailabilityMutation();
  const bulkCreateMutation = useCreateBulkAvailabilityMutation();
  const deleteMutation = useDeleteAvailabilityMutation();

  if (authLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!isExpert) {
    return (
      <Card className="max-w-md mx-auto mt-12 p-8 text-center border-dashed border-2">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500 opacity-50" />
        <h2 className="text-xl font-bold mb-2">{t('accessDenied')}</h2>
        <p className="text-muted-foreground">{t('onlyExperts')}</p>
      </Card>
    );
  }

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0 || !startDate || !startTime || !endTime) return;

    // Validate time order
    if (endTime <= startTime) {
      toast.error(t('generator.errorTimeOrder'));
      return;
    }

    const payloadSlots: { start_time: string; end_time: string }[] = [];
    const baseDate = new Date(`${startDate}T00:00:00`);
    const totalDaysToScan = parseInt(weeks, 10) * 7;

    for (let i = 0; i < totalDaysToScan; i++) {
      const currentDate = addDays(baseDate, i);
      const currentDayOfWeek = getDay(currentDate);

      if (selectedDays.includes(currentDayOfWeek)) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        // Create proper ISO timestamp by combining date with time
        const startObj = new Date(`${dateStr}T${startTime}:00`);
        const endObj = new Date(`${dateStr}T${endTime}:00`);

        // Only add if the slot is in the future
        if (startObj > new Date()) {
          payloadSlots.push({
            start_time: startObj.toISOString(),
            end_time: endObj.toISOString(),
          });
        }
      }
    }

    if (payloadSlots.length === 0) {
      toast.error('No valid future time slots generated. Please check your dates.');
      return;
    }

    bulkCreateMutation.mutate(payloadSlots, {
      onSuccess: () => {
        setSelectedDays([]);
        setView('calendar');
      }
    });
  };

  const handleAddSingleSlot = async (start: Date, end: Date) => {
    await createSlotMutation.mutateAsync({
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    });
  };

  const handleDeleteSlot = async (id: string) => {
    await deleteMutation.mutateAsync({ id, expert_id: user?.id || '' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase">
            {t('title')}
          </h2>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
           <button 
             onClick={() => setView('calendar')}
             className={cn(
               "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
               view === 'calendar' ? "bg-white dark:bg-gray-800 text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
             )}
           >
             <CalendarDays className="w-4 h-4" />
             {t('visualSchedule')}
           </button>
           <button 
             onClick={() => setView('bulk')}
             className={cn(
               "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
               view === 'bulk' ? "bg-white dark:bg-gray-800 text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
             )}
           >
             <Layers className="w-4 h-4" />
             {t('bulkGenerator')}
           </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="h-[800px] animate-in slide-in-from-bottom-4 duration-500">
          <AvailabilityCalendar 
            slots={slots || []}
            appointments={appointments || []}
            onAddSlot={handleAddSingleSlot}
            onDeleteSlot={handleDeleteSlot}
            isLoading={slotsLoading || appointmentsLoading}
          />
        </div>
      ) : (
        <Card className="max-w-2xl mx-auto border-none shadow-xl bg-white dark:bg-gray-950 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-indigo-600 text-white">
            <CardTitle className="text-2xl flex items-center gap-2 font-black uppercase tracking-tight">
              <Layers className="w-6 h-6" />
              {t('generator.title')}
            </CardTitle>
            <CardDescription className="text-indigo-100">
              {t('generator.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleBulkSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-black uppercase text-gray-500 tracking-wider">
                  {t('generator.labelDays')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <div 
                      key={day.id} 
                      onClick={() => toggleDay(day.id)}
                      className={cn(
                        "flex-1 min-w-[100px] flex items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer font-bold",
                        selectedDays.includes(day.id) 
                          ? "bg-indigo-50 border-indigo-600 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-400" 
                          : "bg-white border-gray-100 dark:bg-gray-900 dark:border-gray-800 text-gray-400 hover:border-gray-200"
                      )}
                    >
                      {t(`days.${day.key}`)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black uppercase text-gray-500 tracking-wider">{t('generator.labelStart')}</label>
                  <Input 
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-12 font-bold"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black uppercase text-gray-500 tracking-wider">{t('generator.labelEnd')}</label>
                  <Input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-12 font-bold"
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black uppercase text-gray-500 tracking-wider">{t('generator.labelStarting')}</label>
                  <Input 
                    type="date" 
                    value={startDate} 
                    min={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-12 font-bold"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black uppercase text-gray-500 tracking-wider">{t('generator.labelApply')}</label>
                  <Select value={weeks} onValueChange={(v) => { if (v) setWeeks(v); }} required>
                    <SelectTrigger className="h-12 font-bold">
                      <SelectValue placeholder={t('generator.weeksPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t('generator.options.1')}</SelectItem>
                      <SelectItem value="2">{t('generator.options.2')}</SelectItem>
                      <SelectItem value="4">{t('generator.options.4')}</SelectItem>
                      <SelectItem value="8">{t('generator.options.8')}</SelectItem>
                      <SelectItem value="12">{t('generator.options.12')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                  disabled={bulkCreateMutation.isPending || selectedDays.length === 0 || endTime <= startTime}
                >
                  {bulkCreateMutation.isPending ? (
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  ) : (
                    t('generator.button')
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
