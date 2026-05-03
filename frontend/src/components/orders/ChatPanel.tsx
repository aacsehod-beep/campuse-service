'use client';

import { useEffect, useRef, useState } from 'react';
import { messagesAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';
import { Message } from '@/types';
import { cn, generateAvatarUrl, timeAgo } from '@/lib/utils';
import { Send, Loader2 } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Props {
  orderId: string;
}

export default function ChatPanel({ orderId }: Props) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data } = await messagesAPI.getMessages(orderId);
        setMessages(data.messages || []);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, [orderId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };
    const onTypingStart = ({ userName }: { userName: string }) => {
      if (userName !== user?.name) setTypingUser(userName);
    };
    const onTypingStop = () => setTypingUser(null);

    socket.on('new_message', onMessage);
    socket.on('typing_start', onTypingStart);
    socket.on('typing_stop', onTypingStop);
    return () => {
      socket.off('new_message', onMessage);
      socket.off('typing_start', onTypingStart);
      socket.off('typing_stop', onTypingStop);
    };
  }, [user?.name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  const handleTyping = (value: string) => {
    setText(value);
    const socket = getSocket();
    if (!socket) return;
    socket.emit('typing_start', { orderId, userName: user?.name });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing_stop', { orderId });
    }, 1500);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSending(true);
    try {
      await messagesAPI.sendMessage(orderId, { content: text.trim(), type: 'text' });
      setText('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl flex flex-col h-[420px]">
      <div className="px-5 py-3.5 border-b border-border">
        <h3 className="font-semibold text-sm">Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoadingHistory ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">No messages yet. Say hi! 👋</p>
        ) : (
          messages.map((msg) => {
            if (msg.type === 'system') {
              return (
                <p key={msg._id} className="text-xs text-center text-muted-foreground py-1">{msg.content}</p>
              );
            }
            const isMe = msg.senderId?._id === user?._id;
            const senderName = msg.senderId?.name || 'User';
            const senderAvatar = msg.senderId?.avatar || generateAvatarUrl(senderName);
            return (
              <div key={msg._id} className={cn('flex items-end gap-2', isMe && 'flex-row-reverse')}>
                <Image
                  src={senderAvatar}
                  alt={senderName}
                  width={28}
                  height={28}
                  className="rounded-full shrink-0"
                />
                <div className={cn('max-w-[70%] space-y-0.5', isMe && 'items-end')}>
                  <div className={cn(
                    'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-secondary text-foreground rounded-bl-sm'
                  )}>
                    {msg.content}
                  </div>
                  <p className={cn('text-[10px] text-muted-foreground px-1', isMe && 'text-right')}>
                    {timeAgo(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {typingUser && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs">👤</div>
            <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-secondary text-sm text-muted-foreground">
              <span className="flex gap-0.5">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="px-4 py-3 border-t border-border flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
        />
        <button
          type="submit"
          disabled={!text.trim() || isSending}
          className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-all shrink-0"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
