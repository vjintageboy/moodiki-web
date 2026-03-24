'use client';

import { useState } from 'react';
import {
  usePendingExperts,
  useApproveExpert,
  useRejectExpert,
} from '@/hooks/use-recent-activities';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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
              : `Are you sure you want to reject ${expertName}? This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>

        {!isApprove && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason (Optional)</label>
              <Textarea
                placeholder="Enter reason for rejection..."
                value={rejectionReason || ''}
                onChange={(e) => onReasonChange?.(e.target.value)}
                className="mt-2"
              />
            </div>
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
            {isLoading ? '...' : (isApprove ? 'Approve' : 'Reject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PendingExpertsTab() {
  const { data: experts, isLoading, error } = usePendingExperts();
  const approveExpert = useApproveExpert();
  const rejectExpert = useRejectExpert();

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

  const handleApprove = (expertId: string, expertName: string) => {
    setConfirmDialog({
      open: true,
      expertId,
      expertName,
      action: 'approve',
      rejectionReason: '',
    });
  };

  const handleReject = (expertId: string, expertName: string) => {
    setConfirmDialog({
      open: true,
      expertId,
      expertName,
      action: 'reject',
      rejectionReason: '',
    });
  };

  const handleConfirm = async () => {
    try {
      if (confirmDialog.action === 'approve') {
        await approveExpert.mutateAsync(confirmDialog.expertId);
        toast.success(`${confirmDialog.expertName} has been approved`);
      } else {
        await rejectExpert.mutateAsync(confirmDialog.expertId);
        toast.success(`${confirmDialog.expertName} has been rejected`);
      }
    } catch (error) {
      toast.error(`Failed to ${confirmDialog.action} expert`);
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading pending applications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-center">
        <div className="text-sm text-destructive">Failed to load pending experts</div>
      </div>
    );
  }

  if (!experts || experts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          All expert applications have been reviewed
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {experts.map((expert) => (
          <Card key={expert.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={expert.users?.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(expert.users?.full_name || 'Expert')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-base">{expert.users?.full_name}</CardTitle>
                    <CardDescription className="text-xs">
                      {expert.specialization || 'No specialization'}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Email */}
              <div className="text-sm">
                <p className="text-muted-foreground text-xs font-medium mb-1">Email</p>
                <p className="break-all text-sm">{expert.users?.email || 'N/A'}</p>
              </div>

              {/* Experience and Rating */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs font-medium mb-1">
                    Experience
                  </p>
                  <p className="text-sm">{expert.years_experience || 0} years</p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs font-medium mb-1">
                    Rating
                  </p>
                  <p className="text-sm">
                    {expert.rating && expert.rating > 0
                      ? `⭐ ${expert.rating.toFixed(1)}/5`
                      : 'No rating'}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {expert.bio && (
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs font-medium mb-1">Bio</p>
                  <p className="text-sm line-clamp-2">{expert.bio}</p>
                </div>
              )}

              {/* License Info */}
              {expert.license_url && (
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs font-medium mb-1">
                    License
                  </p>
                  <a
                    href={expert.license_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    View License Document
                  </a>
                </div>
              )}

              {/* Certificates */}
              {expert.certificate_urls && expert.certificate_urls.length > 0 && (
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs font-medium mb-1">
                    Certificates
                  </p>
                  <p className="text-xs">{expert.certificate_urls.length} document(s)</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Link href={`/dashboard/experts/${expert.id}`} className="flex-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-xs"
                  >
                    View Full Details
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white flex-1 text-xs"
                  onClick={() => handleApprove(expert.id, expert.users?.full_name || 'Expert')}
                  disabled={approveExpert.isPending || rejectExpert.isPending}
                >
                  {approveExpert.isPending ? '...' : 'Approve'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 text-xs"
                  onClick={() => handleReject(expert.id, expert.users?.full_name || 'Expert')}
                  disabled={approveExpert.isPending || rejectExpert.isPending}
                >
                  {rejectExpert.isPending ? '...' : 'Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        expertName={confirmDialog.expertName}
        action={confirmDialog.action}
        rejectionReason={confirmDialog.rejectionReason}
        onReasonChange={(reason) =>
          setConfirmDialog({ ...confirmDialog, rejectionReason: reason })
        }
        onConfirm={handleConfirm}
        onCancel={() =>
          setConfirmDialog({ ...confirmDialog, open: false })
        }
        isLoading={approveExpert.isPending || rejectExpert.isPending}
      />
    </>
  );
}
