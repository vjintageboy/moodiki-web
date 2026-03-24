'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useExpertAvailability, useCreateAvailabilityMutation, useDeleteAvailabilityMutation } from '@/hooks/use-expert-availability';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Calendar, Clock, Trash2, AlertCircle } from 'lucide-react';
import { format, parseISO, isBefore, startOfToday } from 'date-fns';

export default function AvailabilityPage() {
  const { user, isExpert, loading: authLoading } = useAuth();
  
  const [date, setDate] = React.useState('');
  const [startTime, setStartTime] = React.useState('09:00');
  const [endTime, setEndTime] = React.useState('17:00');

  const { data: slots, isLoading: slotsLoading } = useExpertAvailability(isExpert ? user?.id : undefined);
  const createMutation = useCreateAvailabilityMutation();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !date || !startTime || !endTime) return;

    // Combine date and time strings into ISO strings
    const startIso = new Date(`${date}T${startTime}:00`).toISOString();
    const endIso = new Date(`${date}T${endTime}:00`).toISOString();

    createMutation.mutate(
      { expert_id: user.id, start_time: startIso, end_time: endIso },
      {
        onSuccess: () => {
          // Reset times or just leave them for the next entry
          setStartTime('09:00');
          setEndTime('17:00');
        }
      }
    );
  };

  const upcomingSlots = (slots || []).filter(slot => !isBefore(parseISO(slot.start_time), startOfToday()));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Availability Management</h2>
        <p className="text-muted-foreground mt-1">
          Define when you are available for client appointments. Your slots cannot overlap.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Form Column */}
        <Card className="lg:col-span-3 h-fit">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Add Time Slot
            </CardTitle>
            <CardDescription>
              Select a specific date and time bounds for your shift.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input 
                  type="date" 
                  value={date} 
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setDate(e.target.value)}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Time</label>
                  <Input 
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Time</label>
                  <Input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={createMutation.isPending || !date}
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Availability Block
                </Button>
              </div>
              
              {endTime <= startTime && date && (
                <p className="text-sm text-destructive mt-2">End time must be after start time.</p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* List Column */}
        <Card className="lg:col-span-4 max-h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming Schedule
            </CardTitle>
            <CardDescription>
              Your current active availability blocks.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {slotsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingSlots.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-accent/30 rounded-lg border border-dashed">
                <Calendar className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>No availability slots found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSlots.map((slot) => {
                  const start = parseISO(slot.start_time);
                  const end = parseISO(slot.end_time);
                  return (
                    <div 
                      key={slot.id} 
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/10 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {format(start, 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteMutation.mutate({ id: slot.id, expert_id: slot.expert_id })}
                        disabled={deleteMutation.isPending}
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
