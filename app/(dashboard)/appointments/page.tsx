'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Search,
  Video,
  XCircle,
  Download,
  CalendarDays,
  List,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  useAppointments,
  useExpertAppointments,
  useCancelAppointment,
  useRescheduleAppointment,
  useUpdateAppointmentPayment,
  useUpdateAppointmentStatus,
  type AppointmentWithRelations,
} from '@/hooks/use-appointments';
import { ExportTransactionsDialog } from '@/components/dashboard/export-transactions-dialog';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import { useExperts } from '@/hooks/use-experts';
import { DataTable, type Column } from '@/components/ui/data-table';
import { WeeklyCalendar } from '@/components/dashboard/weekly-calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations, useLocale } from 'next-intl';
import type {
  AppointmentStatusType,
  CallTypeType,
  PaymentStatusType,
} from '@/lib/types/database.types';
import { toast } from 'sonner';

function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

function getStatusVariant(
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

function getPaymentVariant(
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

function getCallTypeIcon(callType: CallTypeType) {
  switch (callType) {
    case 'video':
      return <Video className="h-3.5 w-3.5" />;
    case 'audio':
      return <Phone className="h-3.5 w-3.5" />;
    case 'chat':
    default:
      return <MessageSquare className="h-3.5 w-3.5" />;
  }
}

function formatDateTime(value: string, locale: any): string {
  try {
    return format(new Date(value), 'MMM dd, yyyy HH:mm', { locale });
  } catch {
    return 'Invalid date';
  }
}


function getInitials(name: string | null | undefined, fallback = 'U'): string {
  if (!name) return fallback;
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function toDateTimeLocal(isoString: string): string {
  const date = new Date(isoString);
  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function AppointmentActionsMenu({
  appointment,
  currentUserId,
  currentUserRole,
}: {
  appointment: AppointmentWithRelations;
  currentUserId: string;
  currentUserRole: 'admin' | 'expert';
}) {
  const t = useTranslations('Appointments');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState(toDateTimeLocal(appointment.appointment_date));
  const [newDuration, setNewDuration] = useState<number>(appointment.duration_minutes || 60);

  const updateStatus = useUpdateAppointmentStatus();
  const cancelAppointment = useCancelAppointment();
  const rescheduleAppointment = useRescheduleAppointment();
  const updatePayment = useUpdateAppointmentPayment();

  const canMoveToConfirmed = appointment.status === 'pending';
  const canMoveToCompleted = appointment.status === 'confirmed';
  const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed';
  const canReschedule = appointment.status === 'pending' || appointment.status === 'confirmed';

  const handleStatusChange = async (newStatus: AppointmentStatusType) => {
    if (newStatus === 'completed' && appointment.payment_status !== 'paid') {
      toast.error(t('toasts.paymentRequired'));
      return;
    }

    try {
      await updateStatus.mutateAsync({
        id: appointment.id,
        newStatus,
      });
    } catch {
      // Toast is handled by mutation hook
    }
  };

  const handlePaymentStatusChange = async (paymentStatus: PaymentStatusType) => {
    try {
      await updatePayment.mutateAsync({
        id: appointment.id,
        paymentStatus,
      });
    } catch {
      // Toast is handled by mutation hook
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error(t('toasts.cancelReasonRequired'));
      return;
    }

    try {
      await cancelAppointment.mutateAsync({
        id: appointment.id,
        reason: cancelReason,
        cancelledBy: currentUserId,
        cancelledRole: currentUserRole,
        refundStatus: appointment.payment_status === 'paid' ? 'pending' : 'none',
      });
      setCancelOpen(false);
      setCancelReason('');
    } catch {
      // Toast is handled by mutation hook
    }
  };

  const handleReschedule = async () => {
    if (!newDate) {
      toast.error(t('toasts.selectDateTime'));
      return;
    }

    if (newDuration <= 0) {
      toast.error(t('toasts.positiveDuration'));
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="sm" className="h-8 w-8 p-0" />}
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{t('actions.label')}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem>
            <Link href={`/appointments/${appointment.id}`} className="w-full cursor-pointer">
              {t('actions.viewDetails')}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs text-muted-foreground">{t('actions.status')}</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={!canMoveToConfirmed || updateStatus.isPending}
            onClick={() => handleStatusChange('confirmed')}
            className="cursor-pointer"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {t('actions.markConfirmed')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canMoveToCompleted || updateStatus.isPending}
            onClick={() => handleStatusChange('completed')}
            className="cursor-pointer"
          >
            <CalendarClock className="mr-2 h-4 w-4" />
            {t('actions.markCompleted')}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs text-muted-foreground">{t('actions.payment')}</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={updatePayment.isPending}
            onClick={() => handlePaymentStatusChange('unpaid')}
            className="cursor-pointer"
          >
            {t('actions.setUnpaid')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={updatePayment.isPending}
            onClick={() => handlePaymentStatusChange('paid')}
            className="cursor-pointer"
          >
            {t('actions.setPaid')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={updatePayment.isPending}
            onClick={() => handlePaymentStatusChange('refunded')}
            className="cursor-pointer"
          >
            {t('actions.setRefunded')}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={!canReschedule || rescheduleAppointment.isPending}
            onClick={() => setRescheduleOpen(true)}
            className="cursor-pointer"
          >
            <Clock3 className="mr-2 h-4 w-4" />
            {t('actions.reschedule')}
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={!canCancel || cancelAppointment.isPending}
            onClick={() => setCancelOpen(true)}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <XCircle className="mr-2 h-4 w-4" />
            {t('actions.cancel')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialogs.cancelTitle')}</DialogTitle>
            <DialogDescription>
              {t('dialogs.cancelDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t('dialogs.cancelReasonPlaceholder')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              {t('dialogs.back')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelAppointment.isPending}
            >
              {cancelAppointment.isPending ? t('dialogs.cancelling') : t('dialogs.confirmCancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialogs.rescheduleTitle')}</DialogTitle>
            <DialogDescription>
              {t('dialogs.rescheduleDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('dialogs.newDateTime')}</label>
              <Input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('dialogs.duration')}</label>
              <Input
                type="number"
                min={1}
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value || 0))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
              {t('dialogs.back')}
            </Button>
            <Button onClick={handleReschedule} disabled={rescheduleAppointment.isPending}>
              {rescheduleAppointment.isPending ? t('dialogs.saving') : t('dialogs.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AppointmentsPage() {
  const t = useTranslations('Appointments');
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? vi : enUS;

  const { user: currentUser, isAdmin, isExpert, loading } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatusType>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatusType>('all');
  const [expertFilter, setExpertFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [preferredView, setPreferredView] = useState<'calendar' | 'list' | null>(null);

  const debouncedSearch = useDebounce(search);

  const filters = {
    status: statusFilter !== 'all' ? statusFilter : undefined,
    paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined,
    expertId: expertFilter !== 'all' ? expertFilter : undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
    page: 1,
    pageSize: 500,
  };

  const adminQuery = useAppointments({
    ...filters,
    enabled: !!isAdmin,
  });

  const expertQuery = useExpertAppointments(
    isExpert && !isAdmin ? currentUser?.id : null,
    filters
  );

  const appointments = isAdmin ? adminQuery.appointments : expertQuery.appointments;
  const isLoading = isAdmin ? adminQuery.isLoading : expertQuery.isLoading;
  const error = isAdmin ? adminQuery.error : expertQuery.error;
  const refetch = isAdmin ? adminQuery.refetch : expertQuery.refetch;
  const isFetching = isAdmin ? adminQuery.isFetching : expertQuery.isFetching;

  const { data: experts = [] } = useExperts({ is_approved: true });

  const filteredAppointments = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();
    if (!keyword) return appointments;

    return appointments.filter((appointment: AppointmentWithRelations) => {
      const userName = appointment.user?.full_name?.toLowerCase() || '';
      const userEmail = appointment.user?.email?.toLowerCase() || '';
      const expertName = appointment.expertUser?.full_name?.toLowerCase() || '';
      const expertEmail = appointment.expertUser?.email?.toLowerCase() || '';

      return (
        userName.includes(keyword) ||
        userEmail.includes(keyword) ||
        expertName.includes(keyword) ||
        expertEmail.includes(keyword)
      );
    });
  }, [appointments, debouncedSearch]);

  const columns: Column<AppointmentWithRelations>[] = [
    {
      key: 'participants',
      header: t('table.participants'),
      render: (appointment) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              {appointment.user?.avatar_url && (
                <AvatarImage
                  src={appointment.user.avatar_url}
                  alt={appointment.user.full_name || appointment.user.email}
                />
              )}
              <AvatarFallback>
                {getInitials(appointment.user?.full_name, 'U')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-none">
                {appointment.user?.full_name || 'Unknown user'}
              </p>
              <p className="text-xs text-muted-foreground">{t('table.user')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              {appointment.expertUser?.avatar_url && (
                <AvatarImage
                  src={appointment.expertUser.avatar_url}
                  alt={appointment.expertUser.full_name || appointment.expertUser.email}
                />
              )}
              <AvatarFallback>
                {getInitials(appointment.expertUser?.full_name, 'E')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-none">
                {appointment.expertUser?.full_name || 'Unknown expert'}
              </p>
              <p className="text-xs text-muted-foreground">{t('table.expert')}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'appointment_date',
      header: t('table.dateTime'),
      sortable: true,
      render: (appointment) => (
        <div className="space-y-1">
          <p className="text-sm font-medium">{formatDateTime(appointment.appointment_date, dateLocale)}</p>
          <p className="text-xs text-muted-foreground">{appointment.duration_minutes} {t('table.minutes')}</p>
        </div>
      ),
    },
    {
      key: 'call_type',
      header: t('table.callType'),
      render: (appointment) => (
        <Badge variant="outline" className="inline-flex items-center gap-1">
          {getCallTypeIcon(appointment.call_type)}
          <span className="capitalize">{t(`callType.${appointment.call_type.toLowerCase()}` as any)}</span>
        </Badge>
      ),
    },
    {
      key: 'payment_status',
      header: t('table.payment'),
      sortable: true,
      render: (appointment) => (
        <div className="space-y-1">
          <Badge variant={getPaymentVariant(appointment.payment_status)}>
            {t(`paymentStatus.${appointment.payment_status.toLowerCase()}` as any)}
          </Badge>
          <p className="text-xs text-muted-foreground">{formatCurrency(appointment.expert_base_price || 0, locale)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('table.status'),
      sortable: true,
      render: (appointment) => (
        <Badge variant={getStatusVariant(appointment.status)}>
          {t(`status.${appointment.status.toLowerCase()}` as any)}
        </Badge>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">{t('loadingPermissions')}</div>
      </div>
    );
  }

  if (!isAdmin && !isExpert) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm font-medium text-destructive">{t('accessDenied')}</p>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-muted p-1 rounded-md border text-sm mr-2 shadow-sm">
            <button
              onClick={() => setPreferredView('calendar')}
              className={cn(
                "px-3 py-1.5 flex items-center gap-2 rounded-sm font-medium transition-colors",
                (preferredView || (isAdmin ? 'list' : 'calendar')) === 'calendar' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </button>
            <button
              onClick={() => setPreferredView('list')}
              className={cn(
                "px-3 py-1.5 flex items-center gap-2 rounded-sm font-medium transition-colors",
                (preferredView || (isAdmin ? 'list' : 'calendar')) === 'list' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setExportOpen(true)}
            disabled={filteredAppointments.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {t('export.button')}
          </Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? t('refreshing') : t('refresh')}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-8"
            placeholder={t('searchPlaceholder')}
          />
        </div>

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | AppointmentStatusType)}>
          <SelectTrigger>
            <SelectValue placeholder={t('filters.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
            <SelectItem value="pending">{t('status.pending')}</SelectItem>
            <SelectItem value="confirmed">{t('status.confirmed')}</SelectItem>
            <SelectItem value="completed">{t('status.completed')}</SelectItem>
            <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value as 'all' | PaymentStatusType)}>
          <SelectTrigger>
            <SelectValue placeholder={t('filters.payment')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allPayments')}</SelectItem>
            <SelectItem value="unpaid">{t('paymentStatus.unpaid')}</SelectItem>
            <SelectItem value="paid">{t('paymentStatus.paid')}</SelectItem>
            <SelectItem value="refunded">{t('paymentStatus.refunded')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={expertFilter}
          onValueChange={(value) => {
            if (value) setExpertFilter(value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('filters.expert')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allExperts')}</SelectItem>
            {experts.map((expert) => (
              <SelectItem key={expert.id} value={expert.id}>
                {expert.users?.full_name || expert.users?.email || expert.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">{t('filters.dateFrom')}</label>
          <Input
            type="datetime-local"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t('filters.dateTo')}</label>
          <Input
            type="datetime-local"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">Failed to load appointments</p>
          <Button className="mt-3" variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {(preferredView || (isAdmin ? 'list' : 'calendar')) === 'list' ? (
        <DataTable
          data={filteredAppointments}
          columns={columns}
          isLoading={isLoading}
          emptyMessage={
            search || statusFilter !== 'all' || paymentFilter !== 'all' || expertFilter !== 'all' || dateFrom || dateTo
              ? t('empty.noResults')
              : t('empty.noAppointments')
          }
          actions={(appointment) => (
            <AppointmentActionsMenu
              appointment={appointment}
              currentUserId={currentUser.id}
              currentUserRole="admin"
            />
          )}
          initialPageSize={20}
        />
      ) : (
        <WeeklyCalendar
          data={filteredAppointments}
          actions={(appointment) => (
            <AppointmentActionsMenu
              appointment={appointment}
              currentUserId={currentUser.id}
              currentUserRole="expert"
            />
          )}
        />
      )}

      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          {t(filteredAppointments.length === 1 ? 'footer.showing' : 'footer.showingPlural', {
            count: filteredAppointments.length
          })}
        </p>
      )}

      <ExportTransactionsDialog 
        isOpen={exportOpen}
        onOpenChange={setExportOpen}
        data={filteredAppointments}
        overrideTitle={t('export.title')}
        overrideDescription={t('export.description')}
      />
    </div>
  );
}
