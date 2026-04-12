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
import {
  useReactivateExpert,
  useDeleteExpertPermanently,
} from '@/hooks/use-recent-activities';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils/currency';

interface RejectedExpert {
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
  action: 'reactivate' | 'delete';
  expertId: string;
  t: (key: string, values?: Record<string, string | number>) => string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function ActionConfirmDialog({
  open,
  expertName,
  action,
  t,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmDialogProps) {
  const isReactivate = action === 'reactivate';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isReactivate ? t('reactivateTitle') : t('deleteTitle')}
          </DialogTitle>
          <DialogDescription>
            {isReactivate
              ? t('reactivateDescription', { expertName })
              : t('deleteDescription', { expertName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('cancel')}
          </Button>
          <Button
            variant={isReactivate ? 'default' : 'destructive'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? '...' : isReactivate ? t('reactivate') : t('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RejectedExpertsTab({
  experts,
  isLoading,
}: {
  experts: RejectedExpert[] | undefined;
  isLoading: boolean;
}) {
  const t = useTranslations('RejectedExperts')
  const locale = useLocale()
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState<
    string | null
  >(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    expertId: string;
    expertName: string;
    action: 'reactivate' | 'delete';
  }>({
    open: false,
    expertId: '',
    expertName: '',
    action: 'reactivate',
  });
  const [processingId, setProcessingId] = useState<string | null>(null);

  const reactivateExpert = useReactivateExpert();
  const deleteExpert = useDeleteExpertPermanently();

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

  const handleReactivate = (expertId: string, expertName: string) => {
    setActionDialog({
      open: true,
      expertId,
      expertName,
      action: 'reactivate',
    });
  };

  const handleDelete = (expertId: string, expertName: string) => {
    setActionDialog({
      open: true,
      expertId,
      expertName,
      action: 'delete',
    });
  };

  const handleConfirm = async () => {
    const { expertId, action } = actionDialog;
    setActionDialog({ ...actionDialog, open: false });
    setProcessingId(expertId);
    try {
      if (action === 'reactivate') {
        await reactivateExpert.mutateAsync(expertId);
      } else {
        await deleteExpert.mutateAsync(expertId);
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border bg-card text-card-foreground p-8 text-center text-muted-foreground">
        {t('loading')}
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
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10"
            />
          </div>
          <Select value={specializationFilter || ''} onValueChange={(v) => setSpecializationFilter(v || null)}>
            <SelectTrigger>
              <SelectValue placeholder={t('filterBySpecialization')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('allSpecializations')}</SelectItem>
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
                <TableHead className="w-[240px]">{t('name')}</TableHead>
                <TableHead>{t('email')}</TableHead>
                <TableHead>{t('specialization')}</TableHead>
                <TableHead className="text-right">{t('experience')}</TableHead>
                <TableHead className="text-right">{t('hourlyRate')}</TableHead>
                <TableHead className="text-right">{t('rating')}</TableHead>
                <TableHead className="text-right">{t('reviews')}</TableHead>
                <TableHead className="text-center">{t('status')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
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
                      ? t('noRejectedExperts')
                      : t('noMatch')}
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
                    <TableCell className="text-sm italic text-muted-foreground">
                      {expert.users?.email ? `${expert.users.email[0]}***@${expert.users.email.split('@')[1]}` : '—'}
                    </TableCell>
                    <TableCell>{expert.specialization || t('notAvailable')}</TableCell>
                    <TableCell className="text-right">
                      {t('years', { count: expert.years_experience })}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(expert.hourly_rate, locale)}
                    </TableCell>
                    <TableCell className="text-right">
                      {expert.rating > 0 ? (
                        <span>
                          ⭐ {expert.rating.toFixed(1)}/5
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{t('noRating')}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {expert.total_reviews}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive">{t('rejected')}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/experts/${expert.id}`}>
                          <Button size="sm" variant="ghost">
                            {t('details')}
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleReactivate(
                              expert.id,
                              expert.users.full_name
                            )
                          }
                          disabled={processingId !== null}
                        >
                          {processingId === expert.id ? '...' : t('reactivate')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleDelete(expert.id, expert.users.full_name)
                          }
                          disabled={processingId !== null}
                        >
                          {processingId === expert.id ? '...' : t('delete')}
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

      <ActionConfirmDialog
        open={actionDialog.open}
        expertName={actionDialog.expertName}
        expertId={actionDialog.expertId}
        action={actionDialog.action}
        t={t}
        onConfirm={handleConfirm}
        onCancel={() =>
          setActionDialog({ ...actionDialog, open: false })
        }
        isLoading={
          reactivateExpert.isPending || deleteExpert.isPending
        }
      />
    </>
  );
}
