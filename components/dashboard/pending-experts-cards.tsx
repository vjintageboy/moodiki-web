'use client';

import { useState } from 'react';
import {
  usePendingExperts,
  useApproveExpert,
  useRejectExpert,
} from '@/hooks/use-recent-activities';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CardSkeleton } from './skeleton-loaders';
import Link from 'next/link';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

function getInitials(name?: string | null): string {
  if (!name) return '?';
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
  action: 'approve' | 'reject';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function ConfirmDialog({
  open,
  expertName,
  action,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmDialogProps) {
  const isApprove = action === 'approve';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isApprove ? 'Approve Expert' : 'Reject Expert'}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? `Are you sure you want to approve ${expertName}? They will be able to accept appointments.`
              : `Are you sure you want to reject ${expertName}? This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={isApprove ? 'default' : 'destructive'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isApprove ? 'Approve' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PendingExpertsCards() {
  const { data: experts, isLoading, error } = usePendingExperts();
  const approveExpert = useApproveExpert();
  const rejectExpert = useRejectExpert();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    expertId: string;
    expertName: string;
    action: 'approve' | 'reject';
  }>({
    open: false,
    expertId: '',
    expertName: '',
    action: 'approve',
  });
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = (expertId: string, expertName: string) => {
    setConfirmDialog({
      open: true,
      expertId,
      expertName,
      action: 'approve',
    });
  };

  const handleReject = (expertId: string, expertName: string) => {
    setConfirmDialog({
      open: true,
      expertId,
      expertName,
      action: 'reject',
    });
  };

  const handleConfirm = async () => {
    const { expertId, action } = confirmDialog;
    setConfirmDialog({ ...confirmDialog, open: false });
    setProcessingId(expertId);
    try {
      if (action === 'approve') {
        await approveExpert.mutateAsync(expertId);
      } else {
        await rejectExpert.mutateAsync({ expertId });
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) return <CardSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-center">
        <div className="text-sm text-destructive">Failed to load experts</div>
      </div>
    );
  }

  if (!experts || experts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          All expert applications have been reviewed
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {experts.map((expert) => (
          <div
            key={expert.id}
            className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Expert Info */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Avatar size="lg">
                  <AvatarImage src={expert.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(expert.full_name)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{expert.full_name}</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {expert.specialization || 'No specialization listed'}
                  </p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>
                      <strong>{expert.years_experience}</strong> years experience
                    </span>
                    {expert.rating > 0 && (
                      <span>
                        Rating: <strong>{expert.rating.toFixed(1)}</strong> ⭐
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <Link href={`/experts/${expert.id}`}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7"
                  >
                    View
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                  onClick={() => handleApprove(expert.id, expert.full_name)}
                  disabled={processingId !== null}
                >
                  {processingId === expert.id ? '...' : 'Approve'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={() => handleReject(expert.id, expert.full_name)}
                  disabled={processingId !== null}
                >
                  {processingId === expert.id ? '...' : 'Reject'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        expertName={confirmDialog.expertName}
        action={confirmDialog.action}
        onConfirm={handleConfirm}
        onCancel={() =>
          setConfirmDialog({ ...confirmDialog, open: false })
        }
        isLoading={approveExpert.isPending || rejectExpert.isPending}
      />
    </>
  );
}
