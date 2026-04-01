'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useSuspendExpert } from '@/hooks/use-recent-activities';
import Link from 'next/link';

interface ApprovedExpert {
  id: string;
  users: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
  };
  bio: string | null;
  specialization: string | null;
  hourly_rate: number;
  rating: number;
  total_reviews: number;
  is_approved: boolean;
  years_experience: number;
  license_number: string | null;
  license_url: string | null;
  certificate_urls: string[] | null;
  education: string | null;
  university: string | null;
  graduation_year: number | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface ConfirmDialogProps {
  open: boolean;
  expertName: string;
  action: 'suspend' | 'view';
  expertId: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function SuspendConfirmDialog({
  open,
  expertName,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend Expert</DialogTitle>
          <DialogDescription>
            Are you sure you want to suspend <strong>{expertName}</strong>? They
            will not be able to accept new appointments.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? '...' : 'Suspend'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ApprovedExpertsTable({
  experts,
  isLoading,
}: {
  experts: ApprovedExpert[] | undefined;
  isLoading: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState<
    string | null
  >(null);
  const [suspendDialog, setSuspendDialog] = useState<{
    open: boolean;
    expertId: string;
    expertName: string;
  }>({
    open: false,
    expertId: '',
    expertName: '',
  });
  const [suspendingId, setSuspendingId] = useState<string | null>(null);

  const suspendExpert = useSuspendExpert();

  // Get unique specializations for filter
  const specializations = useMemo(() => {
    if (!experts) return [];
    const specs = new Set(
      experts
        .map((e) => e.specialization)
        .filter((s): s is string => Boolean(s))
    );
    return Array.from(specs).sort();
  }, [experts]);

  // Filter experts
  const filteredExperts = useMemo(() => {
    if (!experts) return [];

    return experts.filter((expert) => {
      const matchesSearch =
        expert.users.full_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        expert.specialization?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSpecialization =
        !specializationFilter || expert.specialization === specializationFilter;

      return matchesSearch && matchesSpecialization;
    });
  }, [experts, searchTerm, specializationFilter]);

  const handleSuspend = (expertId: string, expertName: string) => {
    setSuspendDialog({
      open: true,
      expertId,
      expertName,
    });
  };

  const handleConfirmSuspend = async () => {
    const { expertId } = suspendDialog;
    setSuspendDialog({ ...suspendDialog, open: false });
    setSuspendingId(expertId);
    try {
      await suspendExpert.mutateAsync(expertId);
    } finally {
      setSuspendingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border bg-card text-card-foreground p-8 text-center text-muted-foreground">
        Loading experts...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 bg-card text-card-foreground rounded-lg border p-4">
        {/* Search and Filter */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Input
              placeholder="Search by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10"
            />
          </div>
          <Select value={specializationFilter || ''} onValueChange={(v) => setSpecializationFilter(v || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by specialization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Specializations</SelectItem>
              {specializations.map((spec) => (
                <SelectItem key={spec} value={spec}>
                  {spec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px]">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead className="text-right">Experience</TableHead>
                <TableHead className="text-right">Hourly Rate</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="text-right">Reviews</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExperts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {experts && experts.length === 0
                      ? 'No approved experts yet.'
                      : 'No experts match your search.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredExperts.map((expert) => (
                  <TableRow key={expert.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={expert.users.avatar_url || undefined}
                          />
                          <AvatarFallback>
                            {getInitials(expert.users.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {expert.users.full_name}
                          </p>
                          {expert.title && (
                            <p className="text-xs text-muted-foreground">
                              {expert.title}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {expert.users.email}
                    </TableCell>
                    <TableCell>{expert.specialization || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      {expert.years_experience} years
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('vi-VN').format(expert.hourly_rate)}₫/giờ
                    </TableCell>
                    <TableCell className="text-right">
                      {expert.rating > 0 ? (
                        <span>
                          ⭐ {expert.rating.toFixed(1)}/5
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No rating</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {expert.total_reviews}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default" className="bg-green-600">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/experts/${expert.id}`}>
                          <Button size="sm" variant="ghost">
                            Details
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleSuspend(
                              expert.id,
                              expert.users.full_name
                            )
                          }
                          disabled={suspendingId !== null}
                        >
                          {suspendingId === expert.id ? '...' : 'Suspend'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <SuspendConfirmDialog
        open={suspendDialog.open}
        expertName={suspendDialog.expertName}
        expertId={suspendDialog.expertId}
        action="suspend"
        onConfirm={handleConfirmSuspend}
        onCancel={() =>
          setSuspendDialog({ ...suspendDialog, open: false })
        }
        isLoading={suspendExpert.isPending}
      />
    </>
  );
}
