'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, CalendarClock, CheckCircle2, Clock3, Save, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  useAppointment,
  useCancelAppointment,
  useRescheduleAppointment,
  useUpdateAppointmentPayment,
  useUpdateAppointmentStatus,
} from '@/hooks/use-appointments';
import type {
  AppointmentStatusType,
  PaymentStatusType,
} from '@/lib/types/database.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

function formatDateTime(value: string): string {
  try {
    return format(new Date(value), 'MMM dd, yyyy HH:mm');
  } catch {
    return 'Invalid date';
  }
}

function formatPrice(value: number | null): string {
  if (value === null) return 'N/A';
  return `$${value.toLocaleString('en-US')}`;
}

function toDateTimeLocal(isoString: string): string {
  const date = new Date(isoString);
  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function statusVariant(
  status: AppointmentStatusType
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'confirmed':
      return 'default';
    case 'completed':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    case 'pending':
    default:
      return 'outline';
  }
}

function paymentVariant(
  status: PaymentStatusType
): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'paid':
      return 'secondary';
    case 'refunded':
      return 'destructive';
    case 'unpaid':
    default:
      return 'outline';
  }
}

export default function AppointmentDetailPage() {
  const params = useParams<{ id: string }>();
  const appointmentId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { user, isAdmin, isExpert, loading: authLoading } = useAuth();
  const { appointment, isLoading, error, refetch } = useAppointment(appointmentId);

  const updateStatus = useUpdateAppointmentStatus();
  const updatePayment = useUpdateAppointmentPayment();
  const cancelAppointment = useCancelAppointment();
  const rescheduleAppointment = useRescheduleAppointment();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newDuration, setNewDuration] = useState(60);
  const [paymentStatusDraft, setPaymentStatusDraft] = useState<PaymentStatusType | null>(null);

  const canAccess = useMemo(() => !authLoading && (isAdmin || isExpert), [authLoading, isAdmin, isExpert]);

  const canMoveToConfirmed = appointment?.status === 'pending';
  const canMoveToCompleted = appointment?.status === 'confirmed';
  const canCancel = appointment?.status === 'pending' || appointment?.status === 'confirmed';
  const canReschedule = appointment?.status === 'pending' || appointment?.status === 'confirmed';
  const effectivePaymentStatus = paymentStatusDraft ?? appointment?.payment_status ?? 'unpaid';

  const handleStatusChange = async (newStatus: AppointmentStatusType) => {
    if (!appointment) return;

    if (newStatus === 'completed' && appointment.payment_status !== 'paid') {
      toast.error('Payment must be paid before marking appointment as completed');
      return;
    }

    try {
      await updateStatus.mutateAsync({ id: appointment.id, newStatus });
    } catch {
      // Toast is handled by mutation hook
    }
  };

  const handlePaymentSave = async () => {
    if (!appointment) return;
    try {
      await updatePayment.mutateAsync({
        id: appointment.id,
        paymentStatus: effectivePaymentStatus,
      });
    } catch {
      // Toast is handled by mutation hook
    }
  };

  const handleCancel = async () => {
    if (!appointment || !user) return;
    if (!cancelReason.trim()) {
      toast.error('Cancellation reason is required');
      return;
    }

    try {
      await cancelAppointment.mutateAsync({
        id: appointment.id,
        reason: cancelReason,
        cancelledBy: user.id,
        cancelledRole: isAdmin ? 'admin' : 'expert',
        refundStatus: appointment.payment_status === 'paid' ? 'pending' : 'none',
      });
      setCancelOpen(false);
      setCancelReason('');
    } catch {
      // Toast is handled by mutation hook
    }
  };

  const openRescheduleDialog = () => {
    if (!appointment) return;
    setNewDate(toDateTimeLocal(appointment.appointment_date));
    setNewDuration(appointment.duration_minutes || 60);
    setRescheduleOpen(true);
  };

  const handleReschedule = async () => {
    if (!appointment) return;
    if (!newDate) {
      toast.error('Please select a new date and time');
      return;
    }

    try {
      await rescheduleAppointment.mutateAsync({
        id: appointment.id,
        newDate: new Date(newDate).toISOString(),
        newDuration,
      });
      setRescheduleOpen(false);
    } catch {
      // Toast is handled by mutation hook
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Appointment Details</h2>
        <Card>
          <CardContent className="pt-6 text-muted-foreground">Loading appointment details...</CardContent>
        </Card>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <Card>
        <CardContent className="pt-6 text-destructive">Access denied for appointment details.</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Appointment Details</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load appointment details.</p>
            <Button className="mt-3" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!appointment) {
    return (
      <Card>
        <CardContent className="pt-6 text-muted-foreground">Appointment not found.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/appointments">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Appointments
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Appointment Details</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">User</p>
                <p className="font-medium">{appointment.user?.full_name || appointment.user?.email || 'Unknown user'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expert</p>
                <p className="font-medium">
                  {appointment.expertUser?.full_name || appointment.expertUser?.email || 'Unknown expert'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled Time</p>
                <p className="font-medium">{formatDateTime(appointment.appointment_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{appointment.duration_minutes} minutes</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Call Type</p>
                <p className="font-medium capitalize">{appointment.call_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-medium">{formatPrice(appointment.expert_base_price)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant(appointment.status)}>Status: {appointment.status}</Badge>
              <Badge variant={paymentVariant(appointment.payment_status)}>
                Payment: {appointment.payment_status}
              </Badge>
            </div>

            {appointment.user_notes && (
              <div>
                <p className="mb-1 text-sm text-muted-foreground">User Notes</p>
                <p className="rounded-md border bg-muted/50 p-3 text-sm">{appointment.user_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              disabled={!canMoveToConfirmed || updateStatus.isPending}
              onClick={() => handleStatusChange('confirmed')}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Confirmed
            </Button>

            <Button
              className="w-full"
              variant="outline"
              disabled={!canMoveToCompleted || updateStatus.isPending}
              onClick={() => handleStatusChange('completed')}
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              Mark Completed
            </Button>

            <Button
              className="w-full"
              variant="outline"
              disabled={!canReschedule || rescheduleAppointment.isPending}
              onClick={openRescheduleDialog}
            >
              <Clock3 className="mr-2 h-4 w-4" />
              Reschedule
            </Button>

            <Button
              className="w-full"
              variant="destructive"
              disabled={!canCancel || cancelAppointment.isPending}
              onClick={() => setCancelOpen(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Payment Status</label>
              <Select
                value={effectivePaymentStatus}
                onValueChange={(value) => setPaymentStatusDraft(value as PaymentStatusType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handlePaymentSave} disabled={updatePayment.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updatePayment.isPending ? 'Saving...' : 'Save Payment Status'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Appointment ID</p>
              <p className="font-mono text-xs">{appointment.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created At</p>
              <p>{formatDateTime(appointment.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Updated At</p>
              <p>{formatDateTime(appointment.updated_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cancelled At</p>
              <p>{appointment.cancelled_at ? formatDateTime(appointment.cancelled_at) : 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cancellation Reason</p>
              <p>{appointment.cancellation_reason || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Chat Room</p>
              <p>{appointment.chatRoom?.id || 'Not created'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Add a cancellation reason. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="Reason for cancellation"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Back
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelAppointment.isPending}>
              {cancelAppointment.isPending ? 'Cancelling...' : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Choose a new date and duration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">New Date & Time</label>
              <Input type="datetime-local" value={newDate} onChange={(event) => setNewDate(event.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input
                type="number"
                min={1}
                value={newDuration}
                onChange={(event) => setNewDuration(Number(event.target.value || 0))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
              Back
            </Button>
            <Button onClick={handleReschedule} disabled={rescheduleAppointment.isPending}>
              {rescheduleAppointment.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}