'use client';

import { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useChatAdmin, useChatAdminMessages, useChatExpert, useChatRoom } from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Search, MessageSquare, Archive, Shield,
  Calendar, CheckCircle2, XCircle, AlertCircle, Clock, Eye, Send
} from 'lucide-react';
import type { ChatRoomWithDetails } from '@/hooks/use-chat';
import { cn } from '@/lib/utils';

export default function ChatsPage() {
  const t = useTranslations('Chats');
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? vi : enUS;

  const { user: currentUser, isAdmin, isExpert } = useAuth();
  
  const { chatRooms, isLoadingRooms, updateRoomStatus } = useChatAdmin();
  const expertRoomsData = useChatExpert(isExpert && !isAdmin ? currentUser?.id : null);

  const visibleRooms = isAdmin ? chatRooms : expertRoomsData.chatRooms;
  const visibleLoadingRooms = isAdmin ? isLoadingRooms : expertRoomsData.isLoadingRooms;

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStr, setFilterStr] = useState<'all' | 'active' | 'archived' | 'closed'>('all');
  const [newMessage, setNewMessage] = useState('');

  // Load messages for the selected room
  const adminMessagesData = useChatAdminMessages(isAdmin ? activeRoomId : null);
  const expertChatRoom = useChatRoom(isExpert && !isAdmin ? activeRoomId : null);
  
  const messages = isAdmin ? adminMessagesData.data : expertChatRoom.messages;
  const messagesLoading = isAdmin ? adminMessagesData.isLoading : expertChatRoom.isLoading;
  const sendMessage = expertChatRoom.sendMessage;
  const isSending = expertChatRoom.isSending;

  // Format timestamp smartly
  const formatMessageTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return t('yesterday');
    return format(date, locale === 'vi' ? 'dd/MM' : 'MMM d', { locale: dateLocale });
  };

  const formatFullTime = (dateStr: string) => {
    return format(new Date(dateStr), locale === 'vi' ? 'dd/MM/yyyy • HH:mm' : 'MMM d, yyyy • HH:mm', { locale: dateLocale });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isExpert) return;
    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const activeRoom = visibleRooms.find(r => r.id === activeRoomId);

  // Helper to extract participant roles
  const getParticipantByRole = (room: ChatRoomWithDetails | undefined, role: string) => {
    return room?.participants?.find(p => p.user?.role === role)?.user;
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.20))] flex flex-col p-6 space-y-4">
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">
          {isAdmin ? t('adminTitle') : t('expertTitle')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? t('adminSubtitle') : t('expertSubtitle')}
        </p>
      </div>

      <Card className="flex-1 min-h-0 overflow-hidden flex shadow-lg border-0 bg-background">
        
        {/* LEFT COLUMN: Chat List */}
        <div className="w-full md:w-80 lg:w-96 border-r flex flex-col bg-muted/20">
          <div className="p-4 border-b space-y-4 flex-shrink-0 bg-background">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                className="pl-9 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs defaultValue="all" value={filterStr} onValueChange={(v) => setFilterStr(v as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="text-xs">{t('tabs.all')}</TabsTrigger>
                <TabsTrigger value="active" className="text-xs">{t('tabs.active')}</TabsTrigger>
                <TabsTrigger value="closed" className="text-xs">{t('tabs.closed')}</TabsTrigger>
                <TabsTrigger value="archived" className="text-xs">{t('tabs.archived')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-1">
            {visibleLoadingRooms ? (
              <div className="p-4 space-y-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex gap-3 items-center">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleRooms.filter(room => {
              if (filterStr !== 'all' && room.status !== filterStr) return false;
              if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return room.participants?.some(p =>
                  p.user?.full_name?.toLowerCase().includes(query) ||
                  p.user?.email?.toLowerCase().includes(query)
                ) ?? false;
              }
              return true;
            }).length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{t('noRooms')}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {visibleRooms.filter(room => {
                  if (filterStr !== 'all' && room.status !== filterStr) return false;
                  if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    const matchName = room.participants?.some(p =>
                      p.user?.full_name?.toLowerCase().includes(query) ||
                      p.user?.email?.toLowerCase().includes(query)
                    );
                    if (!matchName) return false;
                  }
                  return true;
                }).map((room) => {
                  const expert = getParticipantByRole(room, 'expert');
                  const user = getParticipantByRole(room, 'user');
                  const expertName = expert?.full_name || t('unknownExpert');
                  const userName = user?.full_name || t('unknownUser');
                  
                  return (
                    <button
                      key={room.id}
                      onClick={() => setActiveRoomId(room.id)}
                      className={cn(
                        "w-full text-left p-4 hover:bg-accent transition-colors flex gap-3 border-l-2",
                        activeRoomId === room.id ? "bg-accent/80 border-l-purple-600" : "border-l-transparent"
                      )}
                    >
                      {/* Avatars stacked */}
                      <div className="relative w-12 h-12 flex-shrink-0 mt-1">
                        <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs border-2 border-background z-10">
                          {expertName[0].toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium text-xs border-2 border-background">
                          {userName[0].toUpperCase()}
                        </div>
                        {/* Status indicator */}
                        <div className={cn(
                          "absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-background",
                          room.status === 'active' ? "bg-green-500" :
                          room.status === 'closed' ? "bg-red-500" : "bg-gray-400"
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <p className="text-sm font-semibold truncate text-foreground">
                            {userName} & {expertName}
                          </p>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                            {formatMessageTime(room.last_message_time)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {room.last_message || t('noMessages')}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* RIGHT COLUMN: Chat Area */}
        <div className="hidden md:flex flex-col flex-1 bg-background relative">
          {!activeRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="text-lg font-medium text-foreground">
                {isAdmin ? t('emptyState.adminTitle') : t('emptyState.expertTitle')}
              </h3>
              <p className="text-sm mt-2 text-center max-w-sm">
                {isAdmin ? t('emptyState.adminDesc') : t('emptyState.expertDesc')}
              </p>
            </div>
          ) : (
            <>
              {/* Room Header */}
              <div className="p-4 border-b flex items-center justify-between flex-shrink-0 bg-background z-10 shadow-sm">
                <div className="flex gap-4 items-center">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {t('header.session')} #{activeRoom.id.substring(0, 8)}
                      <Badge variant={
                        activeRoom.status === 'active' ? 'default' : 
                        activeRoom.status === 'closed' ? 'destructive' : 'secondary'
                      } className={activeRoom.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}>
                        {t(`status.${activeRoom.status}` as any)}
                      </Badge>
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {activeRoom.appointment?.appointment_date 
                          ? format(new Date(activeRoom.appointment.appointment_date), locale === 'vi' ? 'dd/MM/yyyy' : 'MMM d, yyyy', { locale: dateLocale })
                          : t('header.noAppointment')}
                      </span>
                      {activeRoom.participants?.map(p => (
                        <span key={p.user.id} className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${p.user.role === 'expert' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                          {p.user.full_name} ({t(`Sidebar.${p.user.role}` as any)})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    {activeRoom.status !== 'archived' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateRoomStatus?.mutate?.({ roomId: activeRoom.id, status: 'archived' })}
                        className="text-muted-foreground gap-1.5 h-8"
                      >
                        <Archive className="w-3.5 h-3.5" /> {t('actions.forceArchive')}
                      </Button>
                    )}
                    {activeRoom.status === 'active' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateRoomStatus?.mutate?.({ roomId: activeRoom.id, status: 'closed' })}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 h-8 dark:hover:bg-red-950"
                      >
                        <XCircle className="w-3.5 h-3.5" /> {t('actions.forceClose')}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-6 bg-slate-50/50 dark:bg-slate-900/20">
                {messagesLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                        <div className={cn("flex gap-2 max-w-[70%]", i % 2 === 0 ? "flex-row-reverse" : "")}>
                          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                          <Skeleton className="h-16 w-48 rounded-2xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !messages || messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                    <Clock className="w-8 h-8 mb-2 opacity-20" />
                    <p>{t('messages.noMessages')}</p>
                  </div>
                ) : (
                  <div className="space-y-6 pb-4">
                    {/* Read-only banner for Admin */}
                    {isAdmin && (
                      <div className="flex justify-center mb-6">
                        <div className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm border border-blue-100 dark:border-blue-800">
                          <Eye className="w-3.5 h-3.5" /> {t('messages.adminViewNotice')}
                        </div>
                      </div>
                    )}

                    {messages.map((message, i) => {
                      const isExpertSender = message.sender?.role === 'expert';
                      const prevSender = i > 0 ? messages[i - 1].sender_id : null;
                      const showAvatar = prevSender !== message.sender_id;

                      return (
                        <div key={message.id} className={cn("flex group", isExpertSender ? "justify-end" : "justify-start")}>
                          <div className={cn("flex gap-3 max-w-[75%]", isExpertSender ? "flex-row-reverse" : "")}>
                            
                            {/* Avatar */}
                            {showAvatar ? (
                              <div className={cn(
                                "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium text-white shadow-sm mt-auto",
                                isExpertSender ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gradient-to-br from-emerald-500 to-emerald-600"
                              )}>
                                {(message.sender?.full_name || 'U')[0].toUpperCase()}
                              </div>
                            ) : (
                              <div className="w-8 flex-shrink-0" />
                            )}

                            {/* Bubble */}
                            <div className="flex flex-col">
                              {showAvatar && (
                                <span className={cn(
                                  "text-[10px] text-muted-foreground mb-1 px-1",
                                  isExpertSender ? "text-right" : "text-left"
                                )}>
                                  {message.sender?.full_name} • {t(`Sidebar.${message.sender?.role}` as any)}
                                </span>
                              )}
                              <div className={cn(
                                "p-3 text-sm shadow-sm relative group",
                                isExpertSender 
                                  ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm" 
                                  : "bg-white dark:bg-slate-800 border rounded-2xl rounded-tl-sm"
                              )}>
                                {message.content}
                                
                                {/* Timestamp tooltip on hover */}
                                <span className={cn(
                                  "absolute top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
                                  isExpertSender ? "-left-20" : "-right-20"
                                )}>
                                  {format(new Date(message.created_at), 'HH:mm:ss')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              
              {/* Footer: Input Form for Expert or Read-only Notice for Admin */}
              <div className="p-4 border-t bg-background flex-shrink-0 m-0">
                {isAdmin ? (
                  <div className="flex justify-center flex-shrink-0 bg-muted/30 p-2 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      {t('messages.adminReadOnlyNotice')}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                    <div className="relative flex-1">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t('messages.typePlaceholder')}
                        className="pr-12 md:text-sm resize-none py-3"
                        disabled={isSending || activeRoom.status !== 'active'}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={!newMessage.trim() || isSending || activeRoom.status !== 'active'}
                      size="icon"
                      className="h-10 w-10 shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}


