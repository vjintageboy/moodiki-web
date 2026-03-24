'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  Column,
  DataTableProps,
} from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';

/**
 * Example user data type
 */
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  lastLogin: string;
}

/**
 * Example data
 */
const EXAMPLE_USERS: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    role: 'admin',
    status: 'active',
    joinDate: '2024-01-15',
    lastLogin: '2024-12-19',
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    role: 'user',
    status: 'active',
    joinDate: '2024-02-20',
    lastLogin: '2024-12-18',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@example.com',
    role: 'moderator',
    status: 'active',
    joinDate: '2024-03-10',
    lastLogin: '2024-12-19',
  },
  {
    id: '4',
    name: 'James Wilson',
    email: 'james.wilson@example.com',
    role: 'user',
    status: 'inactive',
    joinDate: '2024-04-05',
    lastLogin: '2024-11-20',
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    email: 'lisa.anderson@example.com',
    role: 'user',
    status: 'pending',
    joinDate: '2024-12-18',
    lastLogin: '2024-12-18',
  },
  {
    id: '6',
    name: 'David Brown',
    email: 'david.brown@example.com',
    role: 'moderator',
    status: 'active',
    joinDate: '2024-05-12',
    lastLogin: '2024-12-19',
  },
  {
    id: '7',
    name: 'Jessica Taylor',
    email: 'jessica.taylor@example.com',
    role: 'user',
    status: 'active',
    joinDate: '2024-06-08',
    lastLogin: '2024-12-17',
  },
  {
    id: '8',
    name: 'Robert Martinez',
    email: 'robert.martinez@example.com',
    role: 'user',
    status: 'active',
    joinDate: '2024-07-03',
    lastLogin: '2024-12-19',
  },
  {
    id: '9',
    name: 'Amanda White',
    email: 'amanda.white@example.com',
    role: 'admin',
    status: 'active',
    joinDate: '2024-08-14',
    lastLogin: '2024-12-19',
  },
  {
    id: '10',
    name: 'Christopher Lee',
    email: 'christopher.lee@example.com',
    role: 'user',
    status: 'active',
    joinDate: '2024-09-22',
    lastLogin: '2024-12-16',
  },
  {
    id: '11',
    name: 'Michelle Garcia',
    email: 'michelle.garcia@example.com',
    role: 'user',
    status: 'active',
    joinDate: '2024-10-10',
    lastLogin: '2024-12-19',
  },
  {
    id: '12',
    name: 'Daniel Harris',
    email: 'daniel.harris@example.com',
    role: 'moderator',
    status: 'inactive',
    joinDate: '2024-11-05',
    lastLogin: '2024-12-01',
  },
];

/**
 * Role badge component
 */
function RoleBadge({ role }: { role: User['role'] }) {
  const variants: Record<User['role'], 'default' | 'secondary' | 'destructive'> = {
    admin: 'destructive',
    moderator: 'secondary',
    user: 'default',
  };

  return <Badge variant={variants[role]}>{role}</Badge>;
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: User['status'] }) {
  const variants: Record<User['status'], 'default' | 'secondary' | 'outline'> = {
    active: 'default',
    inactive: 'outline',
    pending: 'secondary',
  };

  return <Badge variant={variants[status]}>{status}</Badge>;
}

/**
 * Actions cell component
 */
function ActionCell({ user }: { user: User }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label={`Actions for ${user.name}`}
          />
        }
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Eye className="h-4 w-4 mr-2" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600 dark:text-red-400">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Demo component showing all DataTable features
 */
export function DataTableDemo() {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Simulate loading
  const handleSimulateLoad = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  // Filter data based on search
  const filteredUsers = searchQuery
    ? EXAMPLE_USERS.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : EXAMPLE_USERS;

  // Define columns
  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      width: '200px',
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      width: '250px',
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user) => <RoleBadge role={user.role} />,
      width: '100px',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (user) => <StatusBadge status={user.status} />,
      width: '100px',
    },
    {
      key: 'joinDate',
      header: 'Join Date',
      sortable: true,
      width: '120px',
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      sortable: true,
      width: '120px',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage system users and their roles
          </p>
        </div>
        <Button onClick={handleSimulateLoad} variant="outline">
          {isLoading ? 'Loading...' : 'Reload'}
        </Button>
      </div>

      {/* Selection info */}
      {selectedUsers.length > 0 && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 p-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
          </p>
          {selectedUsers.length <= 5 && (
            <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
              {selectedUsers.map((u) => u.name).join(', ')}
            </p>
          )}
        </div>
      )}

      {/* DataTable */}
      <DataTable<User>
        data={filteredUsers}
        columns={columns}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        selectable={true}
        onSelectionChange={setSelectedUsers}
        actions={(user) => <ActionCell user={user} />}
        emptyMessage="No users found matching your search"
        initialPageSize={10}
        className="bg-white dark:bg-gray-900"
      />
    </div>
  );
}

export default DataTableDemo;
