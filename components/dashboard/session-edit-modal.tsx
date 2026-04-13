'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRescheduleAppointment, useCancelAppointment, useUpdateAppointmentStatus, useUpdateAppointmentNotes } from '@/hooks/use-appointments';
import type { WeeklySession } from '@/hooks/use-weekly-calendar';
import { cn } from '@/lib/utils';

// ============================================================================
// HELPERS
// ============================================================================

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function toLocalInput(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'confirmed': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400';
    case 'pending': return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400';
    case 'cancelled': return 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400';
    default: return 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400';
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

// ============================================================================
// COMPONENT
// ============================================================================

interface SessionEditModalProps {
  session: WeeklySession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionEditModal({ session, open, onOpenChange }: SessionEditModalProps) {
  const t = useTranslations('SessionEdit');

  // Local editable state
  const [newDate, setNewDate] = useState('');
  const [callType, setCallType] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');

  // Mutations
  const rescheduleMutation = useRescheduleAppointment();
  const cancelMutation = useCancelAppointment();
  const updateStatusMutation = useUpdateAppointmentStatus();
  const updateNotesMutation = useUpdateAppointmentNotes();

  const isLoading = rescheduleMutation.isPending || cancelMutation.isPending || updateStatusMutation.isPending || updateNotesMutation.isPending;

  // Sync local state when session changes
  React.useEffect(() => {
    if (session) {
      setNewDate(toLocalInput(session.start_time));
      setCallType(session.call_type);
      setStatus(session.status);
      setNotes(session.user_notes || '');
    }
  }, [session]);

  if (!session) return null;

  const CallIcon = getCallTypeIcon(session.call_type);

  const handleSave = async () => {
    const promises: Promise<unknown>[] = [];

    // Reschedule if date changed
    const newDateObj = new Date(newDate);
    if (newDateObj.getTime() !== session.start_time.getTime()) {
      promises.push(rescheduleMutation.mutateAsync({
        id: session.id,
        newDate: newDateObj.toISOString(),
      }));
    }

    // Update status if changed
    if (status !== session.status) {
      promises.push(updateStatusMutation.mutateAsync({
        id: session.id,
        newStatus: status as any,
      }));
    }

    // Update notes if changed
    if (notes !== session.user_notes) {
      promises.push(updateNotesMutation.mutateAsync({
        id: session.id,
        notes,
      }));
    }

    if (promises.length === 0) {
      onOpenChange(false);
      return;
    }

    await Promise.all(promises);
    onOpenChange(false);
  };

  const handleCancel = async () => {
    await cancelMutation.mutateAsync({
      id: session.id,
      reason: t('cancelReason') || 'Cancelled from dashboard',
      cancelledBy: session.patient.id, // Current user (expert)
      cancelledRole: 'expert',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start">
             <div>
                <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">
                  Quick Edit Appointment
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-slate-500 mt-1">
                  Manage session details efficiently
                </DialogDescription>
             </div>
             <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => onOpenChange(false)}>
                <span className="sr-only">Close</span>
                <Save className="h-4 w-4 opacity-50" />
             </Button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Patient Info (Read-only for Quick Edit) */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Patient:</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{session.patient.full_name}</span>
          </div>

          {/* Time Selection */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Time:</span>
            <div className="flex items-center gap-2">
               <span className="text-sm font-black text-indigo-600 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg">
                 {formatDateTime(session.start_time).split(',')[1]}
               </span>
               <RotateCcw className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-indigo-500 transition-colors" />
            </div>
          </div>

          {/* Type Selection */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Type:</span>
            <Select value={callType} onValueChange={(v) => v && setCallType(v)}>
              <SelectTrigger className="h-8 w-32 border-none bg-slate-50 dark:bg-slate-900 font-bold text-xs ring-0 focus:ring-1 focus:ring-indigo-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video Call</SelectItem>
                <SelectItem value="audio">Audio Call</SelectItem>
                <SelectItem value="chat">Chat Session</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Selection */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status:</span>
            <Select value={status} onValueChange={(v) => v && setStatus(v)}>
              <SelectTrigger className={cn("h-8 w-32 border-none font-bold text-[10px] uppercase tracking-wider rounded-full ring-0", getStatusColor(status))}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Notes:</span>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Editable notes here..."
              rows={2}
              className="resize-none text-xs bg-slate-50 dark:bg-slate-900 border-none focus-visible:ring-indigo-500/50 rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 sm:flex-row flex-col gap-2">
          <div className="flex items-center gap-2 mr-auto">
             <Button variant="ghost" size="sm" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={handleSave}>
               [ Reschedule ]
             </Button>
             <Button variant="ghost" size="sm" className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleCancel}>
               [ Cancel Appointment ]
             </Button>
          </div>
          <Button variant="outline" size="sm" className="text-[10px] font-bold text-slate-500 rounded-lg px-4" onClick={() => onOpenChange(false)}>
            [ Close ]
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
