'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUsers, useUpdateUser, useDeleteUser } from '@/hooks/use-users';
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
import { MoreHorizontal, Trash2, Edit, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { User } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';

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
function formatDate(date: string): string {
  try {
    return new Date(date).toLocaleDateString('en-US', {
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
function getRelativeTime(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
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
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Update the role for {user?.full_name || user?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">New Role</label>
            <Select value={selectedRole || 'user'} onValueChange={(value) => {
              if (value) setSelectedRole(value as string);
            }}>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(selectedRole)} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Role'}
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {user?.full_name || user?.email}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete User'}
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
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const updateUser = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="sm" className="h-8 w-8 p-0" />}
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem>
            <Link href={`/dashboard/users/${user.id}`} className="w-full cursor-pointer">
              View Details
            </Link>
          </DropdownMenuItem>

          {isAdmin && (
            <>
              <DropdownMenuItem
                onClick={() => setChangeRoleOpen(true)}
                className="cursor-pointer"
              >
                <Shield className="h-4 w-4 mr-2" />
                Change Role
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
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
    </>
  );
}

/**
 * Users Management Page
 */
export default function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
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
            Access Denied: Only administrators can access this page.
          </p>
        </div>
      </div>
    );
  }

  // Define table columns
  const columns: Column<User>[] = [
    {
      key: 'avatar',
      header: 'Avatar',
      render: (user) => <UserAvatar user={user} />,
      width: '60px',
    },
    {
      key: 'full_name',
      header: 'Full Name',
      sortable: true,
      render: (user) => (
        <div>
          <p className="font-medium">{user.full_name || 'N/A'}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (user) => <span className="text-sm">{user.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user) => (
        <Badge variant={getRoleVariant(user.role)}>
          {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'streak_count',
      header: 'Streak',
      sortable: true,
      render: (user) => (
        <div className="text-center">
          <span className="font-medium">{user.streak_count || 0}</span>
          <p className="text-xs text-muted-foreground">
            Max: {user.longest_streak || 0}
          </p>
        </div>
      ),
    },
    {
      key: 'last_login',
      header: 'Last Login',
      sortable: true,
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {user.last_login ? getRelativeTime(user.last_login) : 'Never'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      sortable: true,
      render: (user) => (
        <span className="text-sm">{formatDate(user.created_at)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage platform users, roles, and access
          </p>
        </div>
        <Link href="/dashboard/users/new">
          <Button>Add User</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={roleFilter || 'all'} onValueChange={(value: string | null) => {
          if (value) setRoleFilter(value);
        }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="expert">Expert</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive mb-2">
            Failed to load users
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            Retry
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
            ? 'No users found matching your filters'
            : 'No users found'
        }
        actions={(user) => <UserActionsMenu user={user} isAdmin={true} />}
        initialPageSize={20}
      />

      {/* Stats */}
      {data && !isLoading && (
        <div className="text-sm text-muted-foreground">
          Showing {data.users.length} of {data.total} users
        </div>
      )}
    </div>
  );
}
