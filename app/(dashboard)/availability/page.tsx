'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useExpertAvailability, useCreateBulkAvailabilityMutation, useDeleteAvailabilityMutation } from '@/hooks/use-expert-availability';
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
import { Loader2, Calendar, Clock, Trash2, AlertCircle, Layers } from 'lucide-react';
import { format, parseISO, isBefore, startOfToday, addDays, getDay } from 'date-fns';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

export default function AvailabilityPage() {
  const { user, isExpert, loading: authLoading } = useAuth();
  
  // Bulk Generator Form State
  const [startDate, setStartDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [weeks, setWeeks] = React.useState('4');
  const [selectedDays, setSelectedDays] = React.useState<number[]>([]);
  const [startTime, setStartTime] = React.useState('09:00');
  const [endTime, setEndTime] = React.useState('17:00');

  const { data: slots, isLoading: slotsLoading } = useExpertAvailability(isExpert ? user?.id : undefined);
  const bulkCreateMutation = useCreateBulkAvailabilityMutation();
  const deleteMutation = useDeleteAvailabilityMutation();

  if (authLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isExpert) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p>Only verified experts can manage their availability.</p>
      </div>
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

    const payloadSlots: { start_time: string; end_time: string }[] = [];
    // Important: parsing local yyyy-MM-dd properly without UTC shift requires appending T00:00:00
    // But parseISO works if standard.
    const baseDate = new Date(`${startDate}T00:00:00`);
    const totalDaysToScan = parseInt(weeks, 10) * 7;

    for (let i = 0; i < totalDaysToScan; i++) {
      const currentDate = addDays(baseDate, i);
      const currentDayOfWeek = getDay(currentDate); // 0=Sun, 1=Mon, etc.

      if (selectedDays.includes(currentDayOfWeek)) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        // Construct native Date objects to shift naturally to ISO UTC standard
        const startObj = new Date(`${dateStr}T${startTime}:00`);
        const endObj = new Date(`${dateStr}T${endTime}:00`);
        
        payloadSlots.push({
          start_time: startObj.toISOString(),
          end_time: endObj.toISOString(),
        });
      }
    }

    if (payloadSlots.length > 0) {
      bulkCreateMutation.mutate(payloadSlots, {
        onSuccess: () => {
          setSelectedDays([]);
        }
      });
    }
  };

  const upcomingSlots = (slots || []).filter(slot => {
    if (!slot?.start_time || !slot?.end_time) return false;
    try {
      // Handle legacy TIME rows vs new TIMESTAMPTZ rows gracefully
      const parsedStart = parseISO(slot.start_time);
      if (isNaN(parsedStart.getTime())) return false;
      return !isBefore(parsedStart, startOfToday());
    } catch {
      return false;
    }
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Availability Management</h2>
        <p className="text-muted-foreground mt-1">
          Generate recurring schedules or define specific time slots for client appointments.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Bulk Generator Form Column */}
        <Card className="lg:col-span-3 h-fit border-primary/20 shadow-md">
          <CardHeader className="bg-primary/5 rounded-t-lg">
            <CardTitle className="text-xl flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Generate Recurring Schedule
            </CardTitle>
            <CardDescription>
              Instantly create multiple availability blocks over the next few weeks.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleBulkSubmit} className="space-y-5">
              
              <div className="space-y-3">
                <label className="text-sm font-semibold">1. Select Days of the Week</label>
                <div className="flex flex-wrap gap-3">
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day.id} className="flex items-center space-x-2 bg-muted/50 p-2 rounded-md border">
                      <Checkbox 
                        id={`day-${day.id}`} 
                        checked={selectedDays.includes(day.id)}
                        onCheckedChange={() => toggleDay(day.id)}
                      />
                      <label 
                        htmlFor={`day-${day.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedDays.length === 0 && (
                  <p className="text-xs text-muted-foreground">Select at least one day to generate slots.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Start Times</label>
                  <Input 
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">End Times</label>
                  <Input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Starting From</label>
                  <Input 
                    type="date" 
                    value={startDate} 
                    min={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setStartDate(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Apply For</label>
                  <Select value={weeks} onValueChange={(v) => { if (v) setWeeks(v); }} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Weeks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Week</SelectItem>
                      <SelectItem value="2">2 Weeks</SelectItem>
                      <SelectItem value="4">1 Month (4 Weeks)</SelectItem>
                      <SelectItem value="8">2 Months (8 Weeks)</SelectItem>
                      <SelectItem value="12">3 Months (12 Weeks)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={bulkCreateMutation.isPending || selectedDays.length === 0 || endTime <= startTime}
                >
                  {bulkCreateMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Blocks...</>
                  ) : (
                    'Generate Blocks'
                  )}
                </Button>
              </div>
              
              {endTime <= startTime && startTime !== '' && endTime !== '' && (
                <p className="text-sm text-destructive mt-2">End time must be precisely after start time.</p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* List Column */}
        <Card className="lg:col-span-4 max-h-[700px] flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Upcoming Schedule
            </CardTitle>
            <CardDescription>
              Your future scheduled availability.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2">
            {slotsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingSlots.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-accent/30 rounded-lg border border-dashed">
                <Calendar className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>No upcoming schedules.</p>
                <p className="text-sm mt-1">Use the generator on the left to add your shifts.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSlots.map((slot) => {
                  const start = parseISO(slot.start_time);
                  const end = parseISO(slot.end_time);
                  
                  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

                  return (
                    <div 
                      key={slot.id} 
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/10 transition-colors shadow-sm"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {format(start, 'EEEE - MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-primary font-medium flex items-center gap-1.5 mt-1 bg-primary/10 w-fit px-2 py-0.5 rounded-full">
                          <Clock className="w-3.5 h-3.5" />
                          {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => deleteMutation.mutate({ id: slot.id, expert_id: slot.expert_id })}
                        disabled={deleteMutation.isPending}
                        title="Delete slot"
                      >
                        {deleteMutation.isPending && deleteMutation.variables?.id === slot.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
