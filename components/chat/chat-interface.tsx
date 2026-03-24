'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Send, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useChatRoom } from '@/hooks/use-chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatInterfaceProps {
  roomId: string;
}

export function ChatInterface({ roomId }: ChatInterfaceProps) {
  const { user: currentUser } = useAuth();
  const { messages, isLoading, sendMessage, isSending } = useChatRoom(roomId);
  const [content, setContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim() || isSending) return;
    
    try {
      await sendMessage(content.trim());
      setContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-background shadow-sm overflow-hidden">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4 bg-slate-50/50 dark:bg-slate-900/20">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-pulse text-muted-foreground">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => {
              const isMe = message.sender_id === currentUser.id;
              const senderName = message.sender?.full_name || 'User';

              return (
                <div
                  key={message.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="h-8 w-8 mt-1 border">
                      <AvatarImage src={message.sender?.avatar_url || ''} />
                      <AvatarFallback>
                        {senderName[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col">
                      {!isMe && (
                        <span className="text-xs text-muted-foreground mb-1 ml-1">
                          {senderName}
                        </span>
                      )}
                      <div
                        className={`p-3 text-sm rounded-2xl relative group ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-card border text-card-foreground rounded-tl-sm shadow-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <span className={`text-[10px] mt-1 block opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                          {format(new Date(message.created_at), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-3 border-t bg-background flex gap-2 items-end">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="min-h-[2.5rem] max-h-32 resize-none"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={!content.trim() || isSending}
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
}
