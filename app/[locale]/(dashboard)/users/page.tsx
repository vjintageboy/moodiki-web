'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useUsers, useUpdateUser, useDeleteUser, useToggleUserLock } from '@/hooks/use-users';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, Trash2, Edit, Shield, Lock, Unlock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import type { User } from '@/lib/types';
import { toast } from 'sonner';
import { AddUserDialog } from '@/components/users/add-user-dialog';

/**
 * Debounce hook for search
 */
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

/**
 * Get color variant for role badge
 */
function getRoleVariant(role?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (role) {
    case 'admin':
      return 'destructive';
    case 'expert':
      return 'default';
    default:
      return 'secondary';
  }
}

/**
 * Format date in readable format
 */
function formatDate(date: string, locale: string): string {
  try {
    return new Date(date).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Get relative time (e.g., "2 days ago")
 */
function getRelativeTime(date: string, locale: string): string {
  try {
    const dateLocale = locale === 'vi' ? vi : enUS;
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: dateLocale });
  } catch {
    return locale === 'vi' ? 'Không rõ' : 'Unknown';
  }
}

/**
 * Mask email for privacy: a***@gmail.com
 */
function maskEmail(email?: string | null): string {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const masked = local.length > 1 ? `${local[0]}***` : `${local[0]}*`;
  return `${masked}@${domain}`;
}

/**
 * Mask full name for privacy: N*** V*** A
 */
function maskName(name?: string | null): string {
  if (!name) return '—';
  const parts = name.trim().split(' ');
  if (parts.length <= 1) {
    return name.length > 1 ? `${name[0]}***` : `${name[0]}*`;
  }
  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first} *** ${last}`;
}

/**
 * Get initials from name/email for avatar
 */
function getInitials(user: User): string {
  if (user.full_name) {
    return user.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return user.email?.slice(0, 2).toUpperCase() || 'U';
}

/**
 * User Avatar Component
 */
function UserAvatar({ user }: { user: User }) {
  return (
    <Avatar className="h-8 w-8">
      {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />}
      <AvatarFallback>{getInitials(user)}</AvatarFallback>
    </Avatar>
  );
}

/**
 * Change Role Dialog
 */
function ChangeRoleDialog({
  open,
  user,
  onOpenChange,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (role: string) => void;
  isLoading: boolean;
}) {
  const t = useTranslations('UsersPage');
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'user');

  React.useEffect(() => {
    if (user) {
      setSelectedRole(user.role || 'user');
    }
  }, [user, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialogs.changeRoleTitle')}</DialogTitle>
          <DialogDescription>
            {t('dialogs.changeRoleDesc', { name: user?.full_name || user?.email || t('user') })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('dialogs.newRole')}</label>
            <Select value={selectedRole || 'user'} onValueChange={(value) => {
              if (value) setSelectedRole(value as string);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{t('user')}</SelectItem>
                <SelectItem value="expert">{t('expert')}</SelectItem>
                <SelectItem value="admin">{t('admin')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t('dialogs.cancel')}
          </Button>
          <Button onClick={() => onConfirm(selectedRole)} disabled={isLoading}>
            {isLoading ? t('dialogs.updating') : t('dialogs.updateRole')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Delete Confirmation Dialog
 */
function DeleteConfirmDialog({
  open,
  user,
  onOpenChange,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const t = useTranslations('UsersPage');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialogs.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('dialogs.deleteDesc', { 
              name: user?.full_name || 
                (user?.email ? `${user.email[0]}***@${user.email.split('@')[1]}` : t('user')) 
            })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t('dialogs.cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? t('dialogs.deleting') : t('actions.deleteUser')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * User Actions Menu
 */
function UserActionsMenu({ user, isAdmin }: { user: User; isAdmin: boolean }) {
  const t = useTranslations('UsersPage');
  const router = useRouter();
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const updateUser = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const toggleLock = useToggleUserLock();

  const handleChangeRole = async (newRole: string) => {
    if (newRole === user.role) {
      setChangeRoleOpen(false);
      return;
    }

    try {
      await updateUser.mutateAsync({
        id: user.id,
        role: newRole as 'admin' | 'expert' | 'user',
      });
      setChangeRoleOpen(false);
    } catch (error) {
      console.error('Error changing role:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUserMutation.mutateAsync({
        id: user.id,
        email: user.email,
      });
      setDeleteOpen(false);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleLock = async () => {
    try {
      await toggleLock.mutateAsync({
        userId: user.id,
        is_locked: !user.is_locked,
      });
      setLockOpen(false);
    } catch (error) {
      console.error('Error toggling lock:', error);
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
          
          <DropdownMenuItem
            onClick={() => router.push(`/users/${user.id}`)}
            className="cursor-pointer"
          >
            {t('actions.viewDetails')}
          </DropdownMenuItem>

          {isAdmin && (
            <>
              <DropdownMenuItem
                onClick={() => setLockOpen(true)}
                className="cursor-pointer"
              >
                {user.is_locked ? (
                  <Unlock className="h-4 w-4 mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                {user.is_locked ? t('actions.unlockUser') : t('actions.lockUser')}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setChangeRoleOpen(true)}
                className="cursor-pointer"
              >
                <Shield className="h-4 w-4 mr-2" />
                {t('actions.changeRole')}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('actions.deleteUser')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangeRoleDialog
        open={changeRoleOpen}
        user={user}
        onOpenChange={setChangeRoleOpen}
        onConfirm={handleChangeRole}
        isLoading={updateUser.isPending}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        user={user}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        isLoading={deleteUserMutation.isPending}
      />

      <Dialog open={lockOpen} onOpenChange={setLockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {user.is_locked ? t('dialogs.unlockTitle') : t('dialogs.lockTitle')}
            </DialogTitle>
            <DialogDescription>
              {user.is_locked
                ? t('dialogs.unlockDesc', { name: user.full_name || `${user.email[0]}***@${user.email.split('@')[1]}` })
                : t('dialogs.lockDesc', { name: user.full_name || `${user.email[0]}***@${user.email.split('@')[1]}` })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockOpen(false)} disabled={toggleLock.isPending}>
              {t('dialogs.cancel')}
            </Button>
            <Button
              variant={user.is_locked ? 'default' : 'destructive'}
              onClick={handleToggleLock}
              disabled={toggleLock.isPending}
            >
              {toggleLock.isPending
                ? user.is_locked
                  ? t('dialogs.unlocking')
                  : t('dialogs.locking')
                : user.is_locked
                  ? t('actions.unlockUser')
                  : t('actions.lockUser')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Users Management Page
 */
export default function UsersPage() {
  const t = useTranslations('UsersPage');
  const locale = useLocale();
  const { user: currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [addUserOpen, setAddUserOpen] = useState(false);
  const debouncedSearch = useDebounce(search);

  // Fetch users with filters
  const { data, isLoading, error, refetch } = useUsers({
    search: debouncedSearch || undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Redirect if not admin (this should be handled by middleware, but just in case)
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            {t('failedToLoad')}: {locale === 'vi' ? 'Quyền truy cập bị từ chối' : 'Access Denied'}
          </p>
        </div>
      </div>
    );
  }

  // Define table columns
  const columns: Column<User>[] = [
    {
      key: 'avatar',
      header: t('table.avatar'),
      render: (user) => <UserAvatar user={user} />,
      width: '60px',
    },
    {
      key: 'email',
      header: t('table.email'),
      render: (user) => (
        <span className="text-sm font-mono text-muted-foreground truncate max-w-[200px] inline-block">
          {user.email || '—'}
        </span>
      ),
      width: '180px',
    },
    {
      key: 'full_name',
      header: t('table.fullName'),
      sortable: true,
      render: (user) => (
        <button
          type="button"
          className="text-left hover:underline cursor-pointer"
          onClick={() => router.push(`/users/${user.id}`)}
        >
          <p className="font-medium">{user.full_name || '—'}</p>
          <p className="text-sm text-muted-foreground">
            {user.email || '—'}
          </p>
        </button>
      ),
    },
    {
      key: 'role',
      header: t('table.role'),
      sortable: true,
      render: (user) => (
        <Badge variant={getRoleVariant(user.role)}>
          {user.role ? (t(user.role as any)) : t('user')}
        </Badge>
      ),
    },
    {
      key: 'is_locked',
      header: t('table.status'),
      render: (user) => (
        <Badge variant={user.is_locked ? 'destructive' : 'default'} className={user.is_locked ? '' : 'bg-green-500 hover:bg-green-600'}>
          {user.is_locked ? t('status.locked') : t('status.active')}
        </Badge>
      ),
    },
    {
      key: 'streak_count',
      header: t('table.streak'),
      sortable: true,
      render: (user) => (
        <div className="text-center">
          <span className="font-medium">{user.streak_count || 0}</span>
          <p className="text-xs text-muted-foreground">
            {t('table.max')}: {user.longest_streak || 0}
          </p>
        </div>
      ),
    },
    {
      key: 'last_login',
      header: t('table.lastLogin'),
      sortable: true,
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {user.last_login ? getRelativeTime(user.last_login, locale) : t('table.never')}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: t('table.createdAt'),
      sortable: true,
      render: (user) => (
        <span className="text-sm">{formatDate(user.created_at, locale)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button onClick={() => setAddUserOpen(true)}>{t('addUser')}</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={roleFilter || 'all'} onValueChange={(value: string | null) => {
          if (value) setRoleFilter(value);
        }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('filterRole')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allRoles')}</SelectItem>
            <SelectItem value="admin">{t('admin')}</SelectItem>
            <SelectItem value="expert">{t('expert')}</SelectItem>
            <SelectItem value="user">{t('user')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive mb-2">
            {t('failedToLoad')}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            {t('retry')}
          </Button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={data?.users || []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage={
          search || roleFilter !== 'all'
            ? t('empty.noMatchingUsers')
            : t('empty.noUsers')
        }
        actions={(user) => <UserActionsMenu user={user} isAdmin={true} />}
        initialPageSize={20}
      />

      {/* Stats */}
      {data && !isLoading && (
        <div className="text-sm text-muted-foreground">
          {t('showingCount', { count: data.users.length, total: data.total })}
        </div>
      )}

      <AddUserDialog 
        open={addUserOpen} 
        onOpenChange={setAddUserOpen} 
      />
    </div>
  );
}
