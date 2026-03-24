'use client';

import { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { useChatAdmin } from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Search, MessageSquare, Archive, Shield, 
  Calendar, CheckCircle2, XCircle, AlertCircle, Clock
} from 'lucide-react';
import type { ChatRoomWithDetails } from '@/hooks/use-chat';

// Format timestamp smartly
const formatMessageTime = (dateStr: string | null) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
};

const formatFullTime = (dateStr: string) => {
  return format(new Date(dateStr), 'MMM d, yyyy • HH:mm');
};

export default function ChatsPage() {
  const { user: currentUser } = useAuth();
  const { chatRooms, isLoadingRooms, updateRoomStatus } = useChatAdmin();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStr, setFilterStr] = useState<'all' | 'active' | 'archived' | 'closed'>('all');

  // Load messages for selected room
  const { data: messages, isLoading: messagesLoading } = useChatAdmin().useMessages(activeRoomId);

  // Filter rooms
  const filteredRooms = chatRooms.filter(room => {
    // 1. Filter by status
    if (filterStr !== 'all' && room.status !== filterStr) return false;
    
    // 2. Filter by search (names)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = room.participants?.some(p => 
        p.user?.full_name?.toLowerCase().includes(query) || 
        p.user?.email?.toLowerCase().includes(query)
      );
      if (!matchName) return false;
    }
    
    return true;
  });

  const activeRoom = chatRooms.find(r => r.id === activeRoomId);

  // Helper to extract participant roles
  const getParticipantByRole = (room: ChatRoomWithDetails | undefined, role: string) => {
    return room?.participants?.find(p => p.user?.role === role)?.user;
  };

  return (
    <div className="h-[calc(100vh-theme(spacing.20))] flex flex-col p-6 space-y-4">
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Chat Monitor</h1>
        <p className="text-muted-foreground mt-1">
          Monitor conversations between experts and users
        </p>
      </div>

      <Card className="flex-1 min-h-0 overflow-hidden flex shadow-lg border-0 bg-background">
        
        {/* LEFT COLUMN: Chat List */}
        <div className="w-full md:w-80 lg:w-96 border-r flex flex-col bg-muted/20">
          <div className="p-4 border-b space-y-4 flex-shrink-0 bg-background">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search participants..."
                className="pl-9 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs defaultValue="all" value={filterStr} onValueChange={(v) => setFilterStr(v as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
                <TabsTrigger value="closed" className="text-xs">Closed</TabsTrigger>
                <TabsTrigger value="archived" className="text-xs">Archive</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-1">
            {isLoadingRooms ? (
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
            ) : filteredRooms.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No chat rooms found</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredRooms.map((room) => {
                  const expert = getParticipantByRole(room, 'expert');
                  const user = getParticipantByRole(room, 'user');
                  
                  return (
                    <button
                      key={room.id}
                      onClick={() => setActiveRoomId(room.id)}
                      className={`w-full text-left p-4 hover:bg-accent transition-colors flex gap-3 ${
                        activeRoomId === room.id ? 'bg-accent/80 border-l-2 border-l-purple-600' : 'border-l-2 border-l-transparent'
                      }`}
                    >
                      {/* Avatars stacked */}
                      <div className="relative w-12 h-12 flex-shrink-0 mt-1">
                        <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs border-2 border-background z-10">
                          {(expert?.full_name || 'E')[0].toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium text-xs border-2 border-background">
                          {(user?.full_name || 'U')[0].toUpperCase()}
                        </div>
                        {/* Status indicator */}
                        <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-background ${
                          room.status === 'active' ? 'bg-green-500' :
                          room.status === 'closed' ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <p className="text-sm font-semibold truncate text-foreground">
                            {user?.full_name || 'User'} & {expert?.full_name || 'Expert'}
                          </p>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                            {formatMessageTime(room.last_message_time)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {room.last_message || 'No messages yet'}
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
              <h3 className="text-lg font-medium text-foreground">Admin Chat Monitor</h3>
              <p className="text-sm mt-2 text-center max-w-sm">
                Select a conversation from the sidebar to view message history and monitor interactions.
              </p>
            </div>
          ) : (
            <>
              {/* Room Header */}
              <div className="p-4 border-b flex items-center justify-between flex-shrink-0 bg-background z-10 shadow-sm">
                <div className="flex gap-4 items-center">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      Session #{activeRoom.id.substring(0, 8)}
                      <Badge variant={
                        activeRoom.status === 'active' ? 'default' : 
                        activeRoom.status === 'closed' ? 'destructive' : 'secondary'
                      } className={activeRoom.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}>
                        {activeRoom.status}
                      </Badge>
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {activeRoom.appointment?.appointment_date 
                          ? format(new Date(activeRoom.appointment.appointment_date), 'MMM d, yyyy')
                          : 'No appointment'}
                      </span>
                      {activeRoom.participants?.map(p => (
                        <span key={p.user.id} className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${p.user.role === 'expert' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                          {p.user.full_name} ({p.user.role})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex items-center gap-2">
                  {activeRoom.status !== 'archived' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateRoomStatus.mutate({ roomId: activeRoom.id, status: 'archived' })}
                      className="text-muted-foreground gap-1.5 h-8"
                    >
                      <Archive className="w-3.5 h-3.5" /> Force Archive
                    </Button>
                  )}
                  {activeRoom.status === 'active' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateRoomStatus.mutate({ roomId: activeRoom.id, status: 'closed' })}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 h-8 dark:hover:bg-red-950"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Force Close
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-6 bg-slate-50/50 dark:bg-slate-900/20">
                {messagesLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-2 max-w-[70%] ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                          <Skeleton className="h-16 w-48 rounded-2xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !messages || messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                    <Clock className="w-8 h-8 mb-2 opacity-20" />
                    <p>No messages have been sent yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6 pb-4">
                    {/* Read-only banner */}
                    <div className="flex justify-center mb-6">
                      <div className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm border border-blue-100 dark:border-blue-800">
                        <Eye className="w-3.5 h-3.5" /> You are viewing this chat as an Admin
                      </div>
                    </div>

                    {messages.map((message, i) => {
                      const isExpert = message.sender?.role === 'expert';
                      const prevSender = i > 0 ? messages[i - 1].sender_id : null;
                      const showAvatar = prevSender !== message.sender_id;

                      return (
                        <div key={message.id} className={`flex ${isExpert ? 'justify-end' : 'justify-start'} group`}>
                          <div className={`flex gap-3 max-w-[75%] ${isExpert ? 'flex-row-reverse' : ''}`}>
                            
                            {/* Avatar */}
                            {showAvatar ? (
                              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium text-white shadow-sm mt-auto
                                ${isExpert ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}
                              `}>
                                {(message.sender?.full_name || 'U')[0].toUpperCase()}
                              </div>
                            ) : (
                              <div className="w-8 flex-shrink-0" />
                            )}

                            {/* Bubble */}
                            <div className="flex flex-col">
                              {showAvatar && (
                                <span className={`text-[10px] text-muted-foreground mb-1 px-1 ${isExpert ? 'text-right' : 'text-left'}`}>
                                  {message.sender?.full_name} • {message.sender?.role}
                                </span>
                              )}
                              <div className={`
                                p-3 text-sm shadow-sm relative group
                                ${isExpert 
                                  ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                                  : 'bg-white dark:bg-slate-800 border rounded-2xl rounded-tl-sm'
                                }
                              `}>
                                {message.content}
                                
                                {/* Timestamp tooltip on hover */}
                                <span className={`
                                  absolute top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap
                                  ${isExpert ? '-left-20' : '-right-20'}
                                `}>
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
              
              {/* Footer read-only notice */}
              <div className="p-3 border-t bg-muted/30 flex justify-center flex-shrink-0">
                <p className="text-xs text-muted-foreground">
                  Admins cannot participate in private sessions. For intervention, contact the expert directly.
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

// Eye icon helper since it wasn't imported from lucide
function Eye(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
