'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Video,
  Phone,
  MessageSquare,
  User,
  ArrowRight,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useNextSession } from '@/hooks/use-weekly-calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ============================================================================
// HELPERS
// ============================================================================

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getCountdownString(target: Date): string {
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return 'Started';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getCallTypeIcon(callType: string) {
  switch (callType) {
    case 'video': return Video;
    case 'audio': return Phone;
    case 'chat': return MessageSquare;
    default: return Clock;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

interface NextSessionCardProps {
  expertId: string;
  onJoinClick?: (sessionId: string) => void;
  onViewClick?: (sessionId: string) => void;
}

export function NextSessionCard({ expertId, onJoinClick, onViewClick }: NextSessionCardProps) {
  const t = useTranslations('NextSession');
  const { data: session, isLoading } = useNextSession(expertId);
  const [countdown, setCountdown] = useState('');

  // Live countdown
  useEffect(() => {
    if (!session) return;
    const update = () => setCountdown(getCountdownString(session.start_time));
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [session]);

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-xl overflow-hidden relative">
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-24 bg-white/20 rounded" />
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-white/20" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 bg-white/20 rounded" />
              <div className="h-4 w-24 bg-white/20 rounded" />
            </div>
          </div>
          <div className="h-12 w-full bg-white/20 rounded-lg" />
        </div>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="p-6 bg-gradient-to-br from-slate-600 to-slate-700 text-white border-none shadow-xl overflow-hidden relative">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-white/10 p-4 mb-4">
            <Clock className="h-8 w-8 text-white/60" />
          </div>
          <p className="font-semibold">{t('noSessionsTitle')}</p>
          <p className="text-sm text-white/60 mt-1">{t('noSessionsSubtitle')}</p>
        </div>
      </Card>
    );
  }

  const isStarted = countdown === 'Started';

  return (
    <Card className="p-0 border-none rounded-2xl shadow-xl overflow-hidden group bg-white dark:bg-gray-950 flex flex-col h-full">
      {/* Header with Gradient */}
      <div className="h-28 bg-gradient-to-br from-indigo-500 to-purple-600 p-4 relative overflow-hidden">
        <div className="absolute top-2 right-2 opacity-10">
          {session.call_type === 'video' && <Video className="w-16 h-16 text-white" />}
          {session.call_type === 'audio' && <Phone className="w-16 h-16 text-white" />}
          {session.call_type === 'chat' && <MessageSquare className="w-16 h-16 text-white" />}
          {session.call_type !== 'video' && session.call_type !== 'audio' && session.call_type !== 'chat' && <Clock className="w-16 h-16 text-white" />}
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <Badge className="bg-white/20 text-white border-none backdrop-blur-md px-3 py-1 text-[10px] font-bold tracking-widest uppercase">
            {t('nextSessionLabel')}
          </Badge>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
            <span className="text-white text-xs font-bold px-1">•••</span>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="px-6 flex flex-col items-center -mt-12 mb-6">
        <div className="relative group/avatar">
           <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-full blur opacity-25 group-hover/avatar:opacity-40 transition duration-500"></div>
           <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-950 relative z-10 shadow-lg">
             <AvatarImage src={session.patient.avatar_url || undefined} />
             <AvatarFallback className="bg-slate-100 text-slate-400 font-bold text-2xl">
               {getInitials(session.patient.full_name || '?')}
             </AvatarFallback>
           </Avatar>
        </div>
        <div className="mt-4 text-center">
          <h4 className="text-xl font-black text-slate-900 dark:text-white">{session.patient.full_name}</h4>
          <p className="text-sm font-medium text-slate-500 mt-1 flex items-center justify-center gap-1.5">
             <span className="text-indigo-600 dark:text-indigo-400">Online</span> | <span className="capitalize">{session.call_type}</span>
          </p>
        </div>
      </div>

      {/* Details Row */}
      <div className="px-6 py-4 space-y-4 border-t border-slate-50 dark:border-slate-800/50">
        <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-xl">
           <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('time') || 'Time'}</span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-200">{format(session.start_time, 'MMM dd, HH:mm')}</span>
           </div>
           <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('status') || 'Status'}</span>
              <span className={cn("text-sm font-black", isStarted ? "text-emerald-600" : "text-indigo-600")}>
                {isStarted ? t('sessionStarted') : `Starts in ${countdown}`}
              </span>
           </div>
        </div>

        {session.user_notes && (
          <div className="space-y-1">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notes:</span>
             <p className="text-[11px] text-slate-500 leading-relaxed italic bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
               {session.user_notes.slice(0, 100)}...
             </p>
          </div>
        )}

        <Button
           disabled={!isStarted && session.status !== 'confirmed'}
           className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-bold py-7 rounded-xl shadow-[0px_4px_15px_rgba(6,182,212,0.3)] transition-all active:scale-[0.98] mt-4"
           onClick={() => onJoinClick?.(session.id)}
        >
          {t('joinLiveRoom')}
        </Button>
      </div>
    </Card>
  );
}
