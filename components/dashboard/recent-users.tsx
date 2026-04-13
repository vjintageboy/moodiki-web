'use client';

import { useRecentUsers, getRelativeTime } from '@/hooks/use-recent-activities';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CardSkeleton } from './skeleton-loaders';
import { Link } from '@/i18n/routing';
import { Users } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function maskEmail(email?: string | null): string {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const masked = local.length > 1 ? `${local[0]}***` : `${local[0]}*`;
  return `${masked}@${domain}`;
}

function maskName(name?: string | null): string {
  if (!name) return '—';
  const parts = name.trim().split(' ');
  if (parts.length <= 1) {
    return name.length > 1 ? `${name[0]}***` : `${name[0]}*`;
  }
  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first} *** ${last}`;
}

export function RecentUsers() {
  const t = useTranslations('DashboardHome')
  const locale = useLocale()
  const { data: users, isLoading, error } = useRecentUsers();

  if (isLoading) return <CardSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-center">
        <div className="text-sm text-destructive">{t('recentUsersError')}</div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{t('recentUsersEmpty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <Link
          key={user.id}
          href={`/users/${user.id}`}
          className="block"
        >
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
            {/* Avatar */}
            <Avatar size="sm">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{maskName(user.full_name)}</p>
              <p className="text-xs text-muted-foreground truncate">{maskEmail(user.email)}</p>
            </div>

            {/* Registration Date */}
            <div className="text-xs text-muted-foreground text-right shrink-0">
              {getRelativeTime(user.created_at, locale)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
