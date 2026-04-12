'use client';

import { useParams, useRouter } from 'next/navigation';
import { useExpert } from '@/hooks/use-experts';
import { useApproveExpert, useRejectExpert, useSuspendExpert } from '@/hooks/use-recent-activities';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Mail,
  GraduationCap,
  Briefcase,
  Star,
  Calendar,
  DollarSign,
  FileText,
  ExternalLink,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils/currency';

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="rounded-full bg-muted p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
      <Skeleton className="h-40" />
    </div>
  );
}

export default function ExpertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('ExpertDetail');
  const expertId = params.id as string;

  const { data: expert, isLoading, error } = useExpert(expertId);
  const approveExpert = useApproveExpert();
  const rejectExpert = useRejectExpert();
  const suspendExpert = useSuspendExpert();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t('back')}
        </Button>
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="font-semibold">{t('notFound')}</p>
        <Button variant="outline" onClick={() => router.back()}>{t('goBack')}</Button>
      </div>
    );
  }

  const user = expert.users as any;
  const name = user?.full_name || t('unknown');
  const status = expert.is_approved ? 'approved' : 'pending';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button */}
      <Link
        href="/experts"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-2 px-2 py-1 rounded hover:bg-muted"
      >
        <ArrowLeft className="h-4 w-4" /> {t('backToExperts')}
      </Link>

      {/* Hero card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Avatar className="h-20 w-20 text-xl">
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-1">
              <div className="flex items-start gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold">{name}</h1>
                  {expert.title && <p className="text-muted-foreground text-sm">{expert.title}</p>}
                </div>
                <Badge
                  variant={status === 'approved' ? 'default' : 'secondary'}
                  className={status === 'approved' ? 'bg-green-600' : ''}
                >
                  {status === 'approved' ? (
                    <><CheckCircle2 className="h-3 w-3 mr-1" />{t('status.active')}</>
                  ) : (
                    <><Clock className="h-3 w-3 mr-1" />{t('status.pending')}</>
                  )}
                </Badge>
              </div>

              {/* Email — masked for privacy */}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {user?.email
                  ? `${user.email[0]}***@${user.email.split('@')[1]}`
                  : '—'}
              </div>

              {expert.specialization && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5" />
                  {expert.specialization}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 flex-shrink-0">
              {status === 'approved' ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => suspendExpert.mutate(expertId)}
                  disabled={suspendExpert.isPending}
                >
                  {suspendExpert.isPending ? t('actions.suspending') : t('actions.suspend')}
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => approveExpert.mutate(expertId)}
                    disabled={approveExpert.isPending}
                  >
                    {approveExpert.isPending ? t('actions.approving') : t('actions.approve')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rejectExpert.mutate({ expertId })}
                    disabled={rejectExpert.isPending}
                  >
                    {rejectExpert.isPending ? t('actions.rejecting') : t('actions.reject')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label={t('stats.sessions')} value={expert.stats.appointmentCount} />
        <StatCard icon={CheckCircle2} label={t('stats.completed')} value={expert.stats.completedSessions} />
        <StatCard
          icon={DollarSign}
          label={t('stats.earnings')}
          value={formatCurrency(expert.stats.totalEarnings, locale)}
        />
        <StatCard
          icon={Star}
          label={t('stats.rating')}
          value={expert.stats.averageRating > 0 ? `${expert.stats.averageRating.toFixed(1)}/5` : '—'}
        />
      </div>

      {/* Detail Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('sections.about')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">{t('fields.bio')}</p>
              <p className="text-sm">{expert.bio || <span className="italic text-muted-foreground">{t('empty.noBio')}</span>}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">{t('fields.experience')}</p>
                <p className="text-sm">{expert.years_experience || 0} {t('fields.years')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">{t('fields.hourlyRate')}</p>
                <p className="text-sm">
                  {expert.hourly_rate ? formatCurrency(expert.hourly_rate, locale) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> {t('sections.education')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">{t('fields.degree')}</p>
              <p className="text-sm">{expert.education || <span className="italic text-muted-foreground">{t('empty.notSpecified')}</span>}</p>
            </div>
            {expert.university && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">{t('fields.university')}</p>
                <p className="text-sm">{expert.university}</p>
              </div>
            )}
            {expert.graduation_year && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">{t('fields.graduationYear')}</p>
                <p className="text-sm">{expert.graduation_year}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* License & Credentials */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" /> {t('sections.license')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">{t('fields.licenseNumber')}</p>
                {expert.license_number ? (
                  <Badge variant="outline" className="font-mono text-sm">{expert.license_number}</Badge>
                ) : (
                  <p className="text-sm italic text-muted-foreground">{t('empty.notProvided')}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">{t('fields.licenseDoc')}</p>
                {expert.license_url ? (
                  <a
                    href={expert.license_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    {t('actions.viewDoc')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-sm italic text-muted-foreground">{t('empty.notProvided')}</p>
                )}
              </div>
            </div>

            {/* Certificates */}
            {expert.certificate_urls && expert.certificate_urls.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">
                    {t('fields.certificates')} ({expert.certificate_urls.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {expert.certificate_urls.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-full transition-colors"
                      >
                        <FileText className="h-3 w-3" />
                        {t('fields.certificate')} {i + 1}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
