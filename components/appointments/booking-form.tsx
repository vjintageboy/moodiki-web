'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAvailableSlots, useBookAppointment } from '@/hooks/use-booking';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CallTypeType } from '@/lib/types/database.types';
import { toast } from 'sonner';

interface BookingFormProps {
  expertId: string;
  userId: string;
  expertName: string;
}

export function BookingForm({ expertId, userId, expertName }: BookingFormProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [duration, setDuration] = useState<number>(60);
  const [callType, setCallType] = useState<CallTypeType>('video');
  const [notes, setNotes] = useState('');

  const dateParam = selectedDate ? new Date(selectedDate) : undefined;
  
  const { data: slotsResponse, isLoading: isLoadingSlots } = useAvailableSlots(
    expertId,
    dateParam
  );

  const availableSlotsList = slotsResponse?.slots || [];

  const bookAppointment = useBookAppointment();

  const handleBook = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      await bookAppointment.mutateAsync({
        userId,
        expertId,
        startTime: selectedSlot,
        durationMinutes: duration,
        callType,
        userNotes: notes,
      });
      router.push('/appointments');
    } catch (error) {
      // Error is handled by the mutation hook automatically showing toast
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Book an Appointment</h2>
        <p className="text-muted-foreground mt-1">
          Schedule a session with {expertName}
        </p>
      </div>

      <div className="space-y-6 bg-card p-6 rounded-lg border shadow-sm">
        {/* Date Selection */}
        <div className="space-y-3">
          <Label htmlFor="date">Select Date</Label>
          <input
            type="date"
            id="date"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            min={new Date().toISOString().split('T')[0]}
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlot('');
            }}
          />
        </div>

        {/* Time Slots Selection */}
        {selectedDate && (
          <div className="space-y-3">
            <Label>Available Time Slots</Label>
            {isLoadingSlots ? (
              <div className="text-sm text-muted-foreground animate-pulse">
                Loading available slots...
              </div>
            ) : availableSlotsList.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableSlotsList.map((slot) => {
                  const startTimeStr = new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const isSelected = selectedSlot === slot.start_time;
                  return (
                    <button
                      key={slot.start_time}
                      onClick={() => setSelectedSlot(slot.start_time)}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-background hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      {startTimeStr}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                No slots available on this date.
              </div>
            )}
          </div>
        )}

        {/* Session Details */}
        {selectedSlot && (
          <div className="space-y-6 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (Minutes)</Label>
                <Select
                  value={duration.toString()}
                  onValueChange={(val) => setDuration(Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Call Type</Label>
                <Select
                  value={callType}
                  onValueChange={(val) => setCallType(val as CallTypeType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select call type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="audio">Audio Call</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes for Expert (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Share any topics or concerns you'd like to discuss..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
                rows={4}
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleBook}
              disabled={bookAppointment.isPending}
            >
              {bookAppointment.isPending ? 'Confirming...' : 'Confirm Appointment'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
