'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useUser, useUpdateUser, useDeleteUser, useToggleUserLock } from '@/hooks/use-users';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Calendar,
  FileText,
  HeartPulse,
  Lock,
  Mail,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Unlock,
  User as UserIcon,
  Zap,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import type { UserRoleType } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(fullName: string | null, email: string): string {
  if (fullName) {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

function getRoleBadgeVariant(role: string): 'destructive' | 'default' | 'secondary' {
  if (role === 'admin') return 'destructive';
  if (role === 'expert') return 'default';
  return 'secondary';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return 'N/A';
  }
}

function getRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}

function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="rounded-lg bg-primary/10 p-3 text-primary">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dialogs
// ─────────────────────────────────────────────────────────────────────────────

function ChangeRoleDialog({
  open,
  currentRole,
  isLoading,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  currentRole: UserRoleType;
  isLoading: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (role: UserRoleType) => void;
}) {
  const [selected, setSelected] = useState<UserRoleType>(currentRole);

  // Reset whenever dialog opens
  React.useEffect(() => {
    if (open) setSelected(currentRole);
  }, [open, currentRole]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Select a new role for this user. Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <label className="text-sm font-medium">New Role</label>
          <Select value={selected} onValueChange={(v) => setSelected(v as UserRoleType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(selected)}
            disabled={isLoading || selected === currentRole}
          >
            {isLoading ? 'Saving…' : 'Save Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({
  open,
  displayName,
  isLoading,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  displayName: string;
  isLoading: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete <strong>{displayName}</strong>? This action
            cannot be undone and will remove all their data.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Deleting…' : 'Delete User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function UserDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-32 rounded bg-muted" />
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const userId = typeof params.id === 'string' ? params.id : '';

  const { data: user, isLoading, error } = useUser(userId);
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const toggleLock = useToggleUserLock();

  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleChangeRole = async (newRole: UserRoleType) => {
    if (!user) return;
    await updateUser.mutateAsync({ id: user.id, role: newRole });
    setChangeRoleOpen(false);
  };

  const handleToggleLock = async () => {
    if (!user) return;
    await toggleLock.mutateAsync({ userId: user.id, is_locked: !user.is_locked });
  };

  const handleDelete = async () => {
    if (!user) return;
    await deleteUser.mutateAsync({ id: user.id, email: user.email });
    setDeleteOpen(false);
    router.push('/users');
  };

  // ── Render guards ─────────────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm font-medium text-destructive">
          Access Denied: Only administrators can view user details.
        </p>
      </div>
    );
  }

  if (isLoading) return <UserDetailSkeleton />;

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            {error instanceof Error ? error.message : 'User not found.'}
          </p>
        </div>
      </div>
    );
  }

  const displayName = user.full_name || user.email;

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Users
      </Button>

      {/* Profile header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-5">
          <Avatar className="h-20 w-20 text-2xl">
            {user.avatar_url && (
              <AvatarImage src={user.avatar_url} alt={displayName} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
              {getInitials(user.full_name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
              {user.is_locked && (
                <Badge variant="outline" className="text-destructive border-destructive">
                  <Lock className="h-3 w-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </p>
            <p className="text-xs text-muted-foreground">
              Member since {formatDate(user.created_at)}
            </p>
          </div>
        </div>

        {/* Admin actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChangeRoleOpen(true)}
            disabled={updateUser.isPending}
          >
            <ShieldCheck className="h-4 w-4 mr-1.5" />
            Change Role
          </Button>

          <Button
            variant={user.is_locked ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggleLock}
            disabled={toggleLock.isPending}
          >
            {user.is_locked ? (
              <>
                <Unlock className="h-4 w-4 mr-1.5" />
                {toggleLock.isPending ? 'Unlocking…' : 'Unlock User'}
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-1.5" />
                {toggleLock.isPending ? 'Locking…' : 'Lock User'}
              </>
            )}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            disabled={deleteUser.isPending}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete User
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<HeartPulse className="h-5 w-5" />}
          label="Mood Entries"
          value={user.moodEntriesCount}
        />
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="Appointments"
          value={user.appointmentsCount}
        />
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Posts"
          value={user.postsCount}
        />
        <StatCard
          icon={<Zap className="h-5 w-5" />}
          label="Current Streak"
          value={`${user.streak_count} days`}
          sub={`Best: ${user.longest_streak} days`}
        />
      </div>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Account info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="h-4 w-4" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="User ID" value={<code className="text-xs bg-muted px-1.5 py-0.5 rounded">{user.id}</code>} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Full Name" value={user.full_name ?? '—'} />
            <InfoRow label="Role" value={
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {user.role}
              </Badge>
            } />
            <InfoRow label="Account Status" value={
              user.is_locked
                ? <span className="text-destructive font-medium flex items-center gap-1"><Lock className="h-3 w-3" /> Locked</span>
                : <span className="text-green-600 font-medium">Active</span>
            } />
            <InfoRow label="Last Login" value={getRelativeTime(user.last_login)} />
            <InfoRow label="Joined" value={formatDate(user.created_at)} />
            <InfoRow label="Updated" value={formatDate(user.updated_at)} />
          </CardContent>
        </Card>

        {/* Profile info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Profile & Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Date of Birth" value={user.date_of_birth ? formatDate(user.date_of_birth) : '—'} />
            <InfoRow label="Gender" value={user.gender ?? '—'} />
            <InfoRow
              label="Goals"
              value={
                user.goals && user.goals.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {user.goals.map((g) => (
                      <Badge key={g} variant="secondary" className="text-xs font-normal">
                        {g}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  '—'
                )
              }
            />
            <InfoRow label="Total Activities" value={user.total_activities} />
            <InfoRow label="Current Streak" value={`${user.streak_count} days`} />
            <InfoRow label="Longest Streak" value={`${user.longest_streak} days`} />
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ChangeRoleDialog
        open={changeRoleOpen}
        currentRole={user.role}
        isLoading={updateUser.isPending}
        onOpenChange={setChangeRoleOpen}
        onConfirm={handleChangeRole}
      />
      <DeleteUserDialog
        open={deleteOpen}
        displayName={displayName}
        isLoading={deleteUser.isPending}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InfoRow helper
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0 w-32">{label}</span>
      <span className="font-medium text-right break-all">{value}</span>
    </div>
  );
}
