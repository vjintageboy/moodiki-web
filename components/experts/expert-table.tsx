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

interface Expert {
  id: string;
  full_name?: string;
  is_verified?: boolean;
  created_at: string;
  users?: { email?: string };
}

export function ExpertTable({ experts }: { experts: Expert[] }) {
  return (
    <div className="rounded-md border bg-card text-card-foreground">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {experts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No experts found.
              </TableCell>
            </TableRow>
          ) : (
            experts.map((expert) => (
              <TableRow key={expert.id}>
                <TableCell className="font-medium">{expert.full_name || 'N/A'}</TableCell>
                <TableCell>{expert.users?.email || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={expert.is_verified ? 'default' : 'secondary'}>
                    {expert.is_verified ? 'Verified' : 'Pending'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(expert.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
