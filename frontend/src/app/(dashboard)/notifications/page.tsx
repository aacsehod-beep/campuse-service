'use client';

import { motion } from 'framer-motion';
import { useNotificationStore } from '@/store/notificationStore';
import { cn, timeAgo } from '@/lib/utils';
import { Bell, CheckCheck, Trash2, Package, DollarSign, Zap, MessageSquare } from 'lucide-react';
import Link from 'next/link';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  new_order: <Package className="w-4 h-4 text-blue-400" />,
  new_bid: <DollarSign className="w-4 h-4 text-violet-400" />,
  bid_accepted: <Zap className="w-4 h-4 text-yellow-400" />,
  order_accepted: <Zap className="w-4 h-4 text-green-400" />,
  status_update: <Package className="w-4 h-4 text-orange-400" />,
  new_message: <MessageSquare className="w-4 h-4 text-teal-400" />,
};

export default function NotificationsPage() {
  const { notifications, markAllRead, markRead, clearAll } = useNotificationStore();

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <div className="flex gap-2">
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-red-400 hover:border-red-500/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
            <Bell className="w-10 h-10 opacity-30" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  'glass-card rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:bg-secondary/30 transition-colors',
                  !notif.read && 'border-primary/20'
                )}
                onClick={() => markRead(notif.id)}
              >
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                  !notif.read ? 'bg-primary/10' : 'bg-secondary'
                )}>
                  {TYPE_ICONS[notif.type] || <Bell className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-medium', !notif.read && 'text-foreground')}>
                      {notif.title}
                    </p>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
