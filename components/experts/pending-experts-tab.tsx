'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  usePendingExperts,
  useApproveExpert,
  useRejectExpert,
} from '@/hooks/use-recent-activities';
import { useBatchApproveExperts } from '@/hooks/use-experts';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  Search,
  Users,
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// HELPERS
// ============================================================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc';

// ============================================================================
// SKELETON CARDS
// ============================================================================

function PendingExpertSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="flex gap-2 pt-4 border-t">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CONFIRM DIALOG
// ============================================================================

interface ConfirmDialogProps {
  open: boolean;
  expertName: string;
  action: 'approve' | 'reject';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  rejectionReason?: string;
  onReasonChange?: (reason: string) => void;
}

function ConfirmDialog({
  open,
  expertName,
  action,
  onConfirm,
  onCancel,
  isLoading,
  rejectionReason,
  onReasonChange,
}: ConfirmDialogProps) {
  const isApprove = action === 'approve';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isApprove ? 'Approve Expert Application' : 'Reject Expert Application'}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? `Are you sure you want to approve ${expertName}? They will be able to accept appointments immediately.`
              : `Are you sure you want to reject ${expertName}? The record will be kept in the Rejected tab.`}
          </DialogDescription>
        </DialogHeader>

        {!isApprove && (
          <div className="space-y-2">
            <Label htmlFor="rejection-reason" className="text-sm font-medium">
              Rejection Reason <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="Enter reason for rejection..."
              value={rejectionReason || ''}
              onChange={(e) => onReasonChange?.(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={isApprove ? 'default' : 'destructive'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isApprove ? 'Approving...' : 'Rejecting...'}
              </>
            ) : (
              isApprove ? 'Approve' : 'Reject'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// BATCH CONFIRM DIALOG
// ============================================================================

interface BatchConfirmDialogProps {
  open: boolean;
  count: number;
  action: 'approve' | 'reject';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  rejectionReason?: string;
  onReasonChange?: (reason: string) => void;
}

function BatchConfirmDialog({
  open,
  count,
  action,
  onConfirm,
  onCancel,
  isLoading,
  rejectionReason,
  onReasonChange,
}: BatchConfirmDialogProps) {
  const isApprove = action === 'approve';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isApprove ? `Approve ${count} Expert(s)` : `Reject ${count} Expert(s)`}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? `This will approve ${count} expert application(s). They will all be able to accept appointments immediately.`
              : `This will reject ${count} expert application(s). Records will be kept in the Rejected tab.`}
          </DialogDescription>
        </DialogHeader>

        {!isApprove && (
          <div className="space-y-2">
            <Label htmlFor="batch-rejection-reason" className="text-sm font-medium">
              Rejection Reason <span className="text-muted-foreground font-normal">(optional, applies to all)</span>
            </Label>
            <Textarea
              id="batch-rejection-reason"
              placeholder="Enter reason for rejection..."
              value={rejectionReason || ''}
              onChange={(e) => onReasonChange?.(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={isApprove ? 'default' : 'destructive'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              isApprove ? `Approve ${count}` : `Reject ${count}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PendingExpertsTab() {
  const { data: experts, isLoading, error } = usePendingExperts();
  const approveExpert = useApproveExpert();
  const rejectExpert = useRejectExpert();
  const batchApprove = useBatchApproveExperts();

  // Per-row loading state (prevents double-click on specific card)
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Search + sort
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');

  // Single action confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    expertId: string;
    expertName: string;
    action: 'approve' | 'reject';
    rejectionReason: string;
  }>({
    open: false,
    expertId: '',
    expertName: '',
    action: 'approve',
    rejectionReason: '',
  });

  // Batch action confirm dialog
  const [batchDialog, setBatchDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject';
    rejectionReason: string;
  }>({
    open: false,
    action: 'approve',
    rejectionReason: '',
  });

  // ── Filtered + sorted experts ──────────────────────────────────────────────
  const filteredExperts = useMemo(() => {
    if (!experts) return [];

    let result = experts.filter((expert) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        expert.users?.full_name?.toLowerCase().includes(q) ||
        expert.users?.email?.toLowerCase().includes(q) ||
        expert.specialization?.toLowerCase().includes(q)
      );
    });

    result = [...result].sort((a, b) => {
      switch (sortOption) {
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'name_asc':
          return (a.users?.full_name || '').localeCompare(b.users?.full_name || '');
        case 'name_desc':
          return (b.users?.full_name || '').localeCompare(a.users?.full_name || '');
        default:
          return 0;
      }
    });

    return result;
  }, [experts, searchTerm, sortOption]);

  // ── Checkbox helpers ───────────────────────────────────────────────────────
  const allVisibleSelected =
    filteredExperts.length > 0 && filteredExperts.every((e) => selectedIds.has(e.id));

  const toggleSelectAll = useCallback(() => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredExperts.map((e) => e.id)));
    }
  }, [allVisibleSelected, filteredExperts]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── Single actions ─────────────────────────────────────────────────────────
  const handleApprove = (expertId: string, expertName: string) => {
    setConfirmDialog({ open: true, expertId, expertName, action: 'approve', rejectionReason: '' });
  };

  const handleReject = (expertId: string, expertName: string) => {
    setConfirmDialog({ open: true, expertId, expertName, action: 'reject', rejectionReason: '' });
  };

  const handleConfirm = async () => {
    const { expertId, action, rejectionReason } = confirmDialog;
    setProcessingId(expertId);
    setConfirmDialog((prev) => ({ ...prev, open: false }));

    try {
      if (action === 'approve') {
        await approveExpert.mutateAsync(expertId);
      } else {
        await rejectExpert.mutateAsync({ expertId, reason: rejectionReason });
      }
      // Remove from selection if it was selected
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(expertId); return n; });
    } finally {
      setProcessingId(null);
    }
  };

  // ── Batch actions ──────────────────────────────────────────────────────────
  const handleBatchConfirm = async () => {
    const ids = Array.from(selectedIds);
    setBatchDialog((prev) => ({ ...prev, open: false }));

    try {
      if (batchDialog.action === 'approve') {
        await batchApprove.mutateAsync(ids);
      } else {
        // Reject each in parallel
        await Promise.all(
          ids.map((id) =>
            rejectExpert.mutateAsync({ expertId: id, reason: batchDialog.rejectionReason })
          )
        );
      }
      setSelectedIds(new Set());
    } catch {
      // errors handled by hooks
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <PendingExpertSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-destructive font-medium">Failed to load pending experts</p>
        <p className="text-xs text-muted-foreground">Please refresh the page and try again.</p>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!experts || experts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="rounded-full bg-green-50 p-4">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <div>
          <p className="font-semibold text-foreground">All caught up!</p>
          <p className="text-sm text-muted-foreground mt-1">
            No pending expert applications at this time.
          </p>
        </div>
      </div>
    );
  }

  const isBatchLoading = batchApprove.isPending || rejectExpert.isPending;

  return (
    <>
      {/* ── Search + Sort Controls ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Latest Applied</SelectItem>
            <SelectItem value="date_asc">Oldest Applied</SelectItem>
            <SelectItem value="name_asc">Name A → Z</SelectItem>
            <SelectItem value="name_desc">Name Z → A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Results summary + select-all ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {filteredExperts.length} application{filteredExperts.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </span>
        </div>
        {filteredExperts.length > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <Checkbox
              id="select-all"
              checked={allVisibleSelected}
              onCheckedChange={toggleSelectAll}
            />
            <label htmlFor="select-all" className="cursor-pointer text-muted-foreground select-none">
              Select all
            </label>
          </div>
        )}
      </div>

      {/* ── No search results ─────────────────────────────────────────────── */}
      {filteredExperts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
          <Search className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No experts match your search.</p>
        </div>
      )}

      {/* ── Expert Cards ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredExperts.map((expert) => {
          const name = expert.users?.full_name || 'Unknown';
          const isProcessing = processingId === expert.id;
          const isSelected = selectedIds.has(expert.id);
          const isDisabled = processingId !== null || isBatchLoading;

          return (
            <Card
              key={expert.id}
              className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''} ${isProcessing ? 'opacity-60' : ''}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={expert.users?.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{name}</CardTitle>
                      <CardDescription className="text-xs">
                        {expert.specialization || 'No specialization'}
                      </CardDescription>
                    </div>
                  </div>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(expert.id)}
                    disabled={isDisabled}
                    aria-label={`Select ${name}`}
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Email */}
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-0.5">Email</p>
                  <p className="text-sm break-all">{expert.users?.email || '—'}</p>
                </div>

                {/* Experience + Applied Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs font-medium mb-0.5">Experience</p>
                    <p className="text-sm">{expert.years_experience || 0} years</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs font-medium mb-0.5">Applied</p>
                    <p className="text-sm">{formatDate(expert.created_at)}</p>
                  </div>
                </div>

                {/* Bio */}
                {expert.bio && (
                  <div>
                    <p className="text-muted-foreground text-xs font-medium mb-0.5">Bio</p>
                    <p className="text-sm line-clamp-2">{expert.bio}</p>
                  </div>
                )}

                {/* License Info */}
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-0.5">License</p>
                  {expert.license_number || expert.license_url ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      {expert.license_number && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {expert.license_number}
                        </Badge>
                      )}
                      {expert.license_url && (
                        <a
                          href={expert.license_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <FileText className="h-3 w-3" />
                          View Document
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Not provided</p>
                  )}
                </div>

                {/* Certificates */}
                {expert.certificate_urls && expert.certificate_urls.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs font-medium mb-0.5">Certificates</p>
                    <p className="text-xs text-muted-foreground">
                      {expert.certificate_urls.length} document(s) attached
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <Link href={`/experts/${expert.id}`} className="flex-1">
                    <Button size="sm" variant="ghost" className="w-full text-xs">
                      View Details
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white flex-1 text-xs"
                    onClick={() => handleApprove(expert.id, name)}
                    disabled={isDisabled}
                  >
                    {isProcessing && confirmDialog.action === 'approve' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Approve'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 text-xs"
                    onClick={() => handleReject(expert.id, name)}
                    disabled={isDisabled}
                  >
                    {isProcessing && confirmDialog.action === 'reject' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Reject'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Batch Action Bar ──────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-background border rounded-full shadow-lg px-5 py-3 animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <div className="w-px h-4 bg-border" />
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white rounded-full"
            onClick={() => setBatchDialog({ open: true, action: 'approve', rejectionReason: '' })}
            disabled={isBatchLoading}
          >
            Approve All
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="rounded-full"
            onClick={() => setBatchDialog({ open: true, action: 'reject', rejectionReason: '' })}
            disabled={isBatchLoading}
          >
            Reject All
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full text-muted-foreground"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* ── Single Confirm Dialog ─────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmDialog.open}
        expertName={confirmDialog.expertName}
        action={confirmDialog.action}
        rejectionReason={confirmDialog.rejectionReason}
        onReasonChange={(reason) =>
          setConfirmDialog((prev) => ({ ...prev, rejectionReason: reason }))
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        isLoading={processingId === confirmDialog.expertId}
      />

      {/* ── Batch Confirm Dialog ──────────────────────────────────────────── */}
      <BatchConfirmDialog
        open={batchDialog.open}
        count={selectedIds.size}
        action={batchDialog.action}
        rejectionReason={batchDialog.rejectionReason}
        onReasonChange={(reason) =>
          setBatchDialog((prev) => ({ ...prev, rejectionReason: reason }))
        }
        onConfirm={handleBatchConfirm}
        onCancel={() => setBatchDialog((prev) => ({ ...prev, open: false }))}
        isLoading={isBatchLoading}
      />
    </>
  );
}
