'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lock, Unlock, Loader2 } from "lucide-react"
import { useToggleUserLock } from "@/hooks/use-users"

interface User {
  id: string;
  email?: string;
  role?: string;
  is_locked?: boolean;
  created_at: string;
}

export function UserTable({ users }: { users: User[] }) {
  const toggleLock = useToggleUserLock();

  const handleToggleLock = (user: User) => {
    toggleLock.mutate({ userId: user.id, is_locked: !user.is_locked });
  };
  return (
    <div className="rounded-md border bg-card text-card-foreground">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role || 'user'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_locked ? 'destructive' : 'default'} className={!user.is_locked ? 'bg-green-500 hover:bg-green-600' : ''}>
                    {user.is_locked ? 'Locked' : 'Active'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleToggleLock(user)}
                    disabled={toggleLock.isPending && toggleLock.variables?.userId === user.id}
                    className={user.is_locked ? 'text-green-600 hover:text-green-700' : 'text-red-500 hover:text-red-600'}
                  >
                    {toggleLock.isPending && toggleLock.variables?.userId === user.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : user.is_locked ? (
                      <Unlock className="h-4 w-4 mr-2" />
                    ) : (
                      <Lock className="h-4 w-4 mr-2" />
                    )}
                    {user.is_locked ? 'Unlock' : 'Lock'}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
