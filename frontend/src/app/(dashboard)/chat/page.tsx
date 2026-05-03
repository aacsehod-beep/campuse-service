'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Phone, MoreVertical, Check, CheckCheck, Loader2, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ordersAPI, messagesAPI } from '@/lib/api';
import { Order } from '@/types';
import { timeAgo, cn } from '@/lib/utils';
import Link from 'next/link';

interface ChatMessage {
  _id: string;
  senderId: { _id: string; name: string; avatar?: string };
  content: string;
  createdAt: string;
  readBy: string[];
}

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍕', print: '🖨️', notes: '📝', ride: '🛵', others: '📦',
};

function ChatThread({ order, userId, onBack }: { order: Order; userId: string; onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await messagesAPI.getMessages(order._id);
        setMessages(data.messages || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [order._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      const { data } = await messagesAPI.sendMessage(order._id, { content: text });
      setMessages((prev) => [...prev, data.message]);
    } catch { setInput(text); }
    finally { setSending(false); }
  };

  const orderUserId = typeof order.userId === 'string' ? order.userId : (order.userId as { _id: string })?._id;
  const otherUser = orderUserId === userId
    ? order.assignedTo
    : order.userId;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 glass border-b border-white/[0.06] px-4 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-2xl bg-[hsl(var(--surface))] border border-[hsl(var(--border))] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-2xl gradient-bg flex items-center justify-center text-sm font-bold text-white shrink-0">
            {(otherUser as { name?: string })?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{(otherUser as { name?: string })?.name || 'User'}</p>
            <p className="text-[11px] text-[hsl(var(--foreground-muted))] truncate">
              {CATEGORY_EMOJI[order.category]} {order.description.slice(0, 30)}…
            </p>
          </div>
          <button className="w-9 h-9 rounded-2xl bg-[hsl(var(--surface))] border border-[hsl(var(--border))] flex items-center justify-center">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-[calc(5rem+var(--bottom-nav-height))]">
        {loading ? (
          <div className="flex justify-center pt-10">
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-[hsl(var(--foreground-muted))]">
            <MessageSquare className="w-8 h-8 opacity-40" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId?._id === userId;
            const showAvatar = i === 0 || messages[i - 1]?.senderId?._id !== msg.senderId?._id;
            return (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-2', isMe ? 'justify-end' : 'justify-start')}
              >
                {!isMe && showAvatar && (
                  <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-[11px] font-bold text-white shrink-0 self-end mb-0.5">
                    {msg.senderId?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                {!isMe && !showAvatar && <div className="w-7 shrink-0" />}
                <div className={cn(
                  'max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm',
                  isMe
                    ? 'bg-violet-600 text-white rounded-br-sm'
                    : 'bg-[hsl(var(--surface))] text-white rounded-bl-sm border border-[hsl(var(--border))]',
                )}>
                  <p>{msg.content}</p>
                  <div className={cn('flex items-center gap-1 mt-1', isMe ? 'justify-end' : 'justify-start')}>
                    <span className="text-[10px] opacity-60">{timeAgo(msg.createdAt)}</span>
                    {isMe && (
                      msg.readBy?.length > 1
                        ? <CheckCheck className="w-3 h-3 text-blue-300 opacity-80" />
                        : <Check className="w-3 h-3 opacity-60" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed left-0 right-0 z-30 bg-[hsl(var(--background))]/95 backdrop-blur-xl px-4 py-3 border-t border-[hsl(var(--border))]" style={{ bottom: 'var(--bottom-nav-height)' }}>
        <div className="max-w-md mx-auto flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Type a message…"
            className="flex-1 input-base py-3 text-sm"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center text-white shadow-lg shadow-violet-600/25 disabled:opacity-50 transition-all active:scale-95"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await ordersAPI.getMy({ role: 'customer' });
        const withProvider = (data.orders || []).filter(
          (o: Order) => o.assignedTo && ['ACCEPTED', 'BID_SELECTED', 'IN_PROGRESS', 'DELIVERED'].includes(o.status),
        );
        setActiveOrders(withProvider);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (selected && user) {
    return <ChatThread order={selected} userId={user._id} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[hsl(var(--background))]/95 backdrop-blur-xl px-4 pt-5 pb-4 border-b border-[hsl(var(--border))]">
        <h1 className="text-xl font-bold">Messages</h1>
        <p className="text-xs text-[hsl(var(--foreground-muted))] mt-0.5">Chat with your service providers</p>
      </div>

      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-4">
            <div className="w-20 h-20 rounded-3xl bg-[hsl(var(--surface))] flex items-center justify-center">
              <MessageSquare className="w-9 h-9 text-[hsl(var(--foreground-muted))]" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-base">No conversations yet</p>
              <p className="text-sm text-[hsl(var(--foreground-muted))] mt-1">
                Chats appear once a provider accepts your request
              </p>
            </div>
            <Link href="/create" className="px-5 py-2.5 rounded-2xl gradient-bg text-white text-sm font-semibold shadow-lg shadow-violet-600/25">
              Post a Request
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {activeOrders.map((order, i) => {
              const other = order.assignedTo;
              return (
                <motion.button
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(order)}
                  className="w-full card card-shadow p-4 flex items-center gap-3 active:opacity-80 transition-opacity text-left"
                >
                  <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center text-base font-bold text-white shrink-0">
                    {(other as { name?: string })?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-semibold">{(other as { name?: string })?.name || 'Provider'}</p>
                      <span className="text-[10px] text-[hsl(var(--foreground-muted))]">{timeAgo(order.updatedAt)}</span>
                    </div>
                    <p className="text-xs text-[hsl(var(--foreground-muted))] truncate">
                      {CATEGORY_EMOJI[order.category]} {order.description}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-violet-500 rounded-full shrink-0" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
