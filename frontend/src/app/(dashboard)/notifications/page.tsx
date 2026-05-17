'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/store/notificationStore';
import { cn, timeAgo } from '@/lib/utils';
import { Bell, CheckCheck, Trash2, Package, DollarSign, Zap, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/types';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  new_order: <Package className="w-4 h-4 text-blue-400" />,
  new_bid: <DollarSign className="w-4 h-4 text-[hsl(var(--primary))]" />,
  bid_accepted: <Zap className="w-4 h-4 text-yellow-400" />,
  order_accepted: <Zap className="w-4 h-4 text-green-400" />,
  status_update: <Package className="w-4 h-4 text-orange-400" />,
  new_message: <MessageSquare className="w-4 h-4 text-teal-400" />,
};

function groupByDate(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const groups: Record<string, Notification[]> = {};
  notifications.forEach((n) => {
    const d = new Date(n.createdAt);
    let label: string;
    if (d.toDateString() === today.toDateString()) label = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else label = d.toLocaleDateString('en-IN', { month: 'long', day: 'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

export default function NotificationsPage() {
  const { notifications, markAllRead, markRead, clearAll } = useNotificationStore();
  const router = useRouter();

  const handleNotifClick = (id: string, orderId?: string) => {
    markRead(id);
    if (orderId) router.push(`/orders/${orderId}`);
  };

  const grouped = groupByDate(notifications);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[hsl(var(--background))]/95 backdrop-blur-xl px-4 pt-5 pb-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            {unread > 0 && (
              <p className="text-xs text-[hsl(var(--primary))] font-medium mt-0.5">{unread} unread</p>
            )}
          </div>
          <div className="flex gap-2">
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[hsl(var(--border))] text-xs text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[hsl(var(--border))] text-xs text-[hsl(var(--foreground-muted))] hover:text-red-400 hover:border-red-500/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-[hsl(var(--foreground-muted))] gap-3">
            <div className="w-16 h-16 rounded-3xl bg-[hsl(var(--surface-2))] flex items-center justify-center">
              <Bell className="w-7 h-7 opacity-40" />
            </div>
            <p className="font-semibold">No notifications yet</p>
            <p className="text-sm text-center">You'll be notified about bids, orders, and messages here</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(({ label, items }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-[hsl(var(--foreground-muted))] uppercase tracking-wide mb-2">{label}</p>
                <AnimatePresence>
                  <div className="space-y-2">
                    {items.map((notif) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 80, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.25 } }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 80 }}
                        dragElastic={{ left: 0, right: 0.3 }}
                        dragDirectionLock
                        onDragEnd={(_, info) => {
                          if (info.offset.x > 60) markRead(notif.id);
                        }}
                        className={cn(
                          'card rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:bg-[hsl(var(--surface-2))] transition-colors overflow-hidden',
                          !notif.read && 'border-[hsl(var(--primary))]/20'
                        )}
                        onClick={() => handleNotifClick(notif.id, notif.orderId)}
                      >
                        <div className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                          !notif.read ? 'bg-[hsl(var(--primary))]/10' : 'bg-[hsl(var(--surface-2))]'
                        )}>
                          {TYPE_ICONS[notif.type] || <Bell className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn('text-sm font-medium', !notif.read && 'text-[hsl(var(--foreground))]')}>
                              {notif.title}
                            </p>
                            {!notif.read && <span className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] shrink-0 mt-1" />}
                          </div>
                          <p className="text-xs text-[hsl(var(--foreground-muted))] mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-[hsl(var(--foreground-muted))]/60 mt-1">{timeAgo(notif.createdAt)}</p>
                        </div>
                        {notif.orderId && (
                          <span className="text-[10px] text-[hsl(var(--primary))] font-medium shrink-0 self-center">View →</span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
