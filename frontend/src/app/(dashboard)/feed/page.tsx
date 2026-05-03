'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Inbox, Bell, Search, MapPin, Clock, IndianRupee } from 'lucide-react';
import { OrderCategory, Order } from '@/types';
import { cn, timeAgo, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const CATEGORIES: { id: OrderCategory | ''; label: string; emoji: string }[] = [
  { id: '', label: 'All', emoji: '✨' },
  { id: 'food', label: 'Food', emoji: '🍕' },
  { id: 'print', label: 'Prints', emoji: '🖨️' },
  { id: 'notes', label: 'Notes', emoji: '📝' },
  { id: 'ride', label: 'Ride', emoji: '🛵' },
  { id: 'others', label: 'Others', emoji: '📦' },
];

const STATUS_COLOR: Record<string, string> = {
  CREATED: 'bg-blue-500/20 text-blue-400',
  BROADCASTED: 'bg-violet-500/20 text-violet-400',
  ACCEPTED: 'bg-yellow-500/20 text-yellow-400',
  IN_PROGRESS: 'bg-orange-500/20 text-orange-400',
  COMPLETED: 'bg-green-500/20 text-green-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
};

function RequestCard({ order }: { order: Order }) {
  const urgentBadge = order.urgency === 'asap';
  return (
    <Link href={`/orders/${order._id}`}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="card card-shadow p-4 active:opacity-80 transition-opacity"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {urgentBadge && (
                <span className="text-[10px] font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                  ⚡ ASAP
                </span>
              )}
              <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', STATUS_COLOR[order.status] || 'bg-white/10 text-white/60')}>
                {order.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm font-medium text-white line-clamp-2 leading-snug">{order.description}</p>
          </div>
          <div className="shrink-0 w-10 h-10 rounded-2xl bg-[hsl(var(--surface-2))] flex items-center justify-center text-xl">
            {CATEGORIES.find(c => c.id === order.category)?.emoji || '📦'}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-[hsl(var(--foreground-muted))]">
          {order.budget ? (
            <span className="flex items-center gap-1 text-violet-400 font-semibold">
              <IndianRupee className="w-3.5 h-3.5" />
              {formatCurrency(order.budget)}
            </span>
          ) : (
            <span className="text-[hsl(var(--foreground-muted))]">Open bid</span>
          )}
          {order.location?.address && (
            <span className="flex items-center gap-1 truncate max-w-[120px]">
              <MapPin className="w-3 h-3 shrink-0" />
              {order.location.address.split(',')[0]}
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto whitespace-nowrap">
            <Clock className="w-3 h-3" />
            {timeAgo(order.createdAt)}
          </span>
        </div>

        {/* Requester */}
        <div className="mt-3 pt-3 border-t border-[hsl(var(--border))] flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
            {(order.userId as { name?: string })?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-xs text-[hsl(var(--foreground-muted))]">
            {(order.userId as { name?: string })?.name || 'Anonymous'}
          </span>
          {order.mode === 'bidding' && (
            <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
              Bidding
            </span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export default function FeedPage() {
  const { user } = useAuthStore();
  const { orders, isLoading, hasMore, filters, fetchOrders, setFilters } = useOrderStore();

  useEffect(() => {
    fetchOrders(true);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCategory = (filters.category as OrderCategory) || '';

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[hsl(var(--background))]/95 backdrop-blur-xl pt-5 pb-3 px-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-[hsl(var(--foreground-muted))]">Good to see you,</p>
            <h1 className="text-lg font-bold gradient-text">{user?.name?.split(' ')[0] || 'Hey'} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-2xl bg-[hsl(var(--surface))] border border-[hsl(var(--border))] flex items-center justify-center relative">
              <Bell className="w-4.5 h-4.5 text-[hsl(var(--foreground-muted))]" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--foreground-muted))]" />
          <input
            className="input-base pl-10 py-2.5 text-sm"
            placeholder="Search requests�"
            readOnly
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(({ id, label, emoji }) => (
            <button
              key={id}
              onClick={() => {
                setFilters({ category: id || undefined });
                fetchOrders(true);
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                activeCategory === id
                  ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-600/25'
                  : 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] border-[hsl(var(--border))] hover:border-violet-500/40',
              )}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4">
        {isLoading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3 text-[hsl(var(--foreground-muted))]">
            <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
            <p className="text-sm">Loading requests�</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3">
            <div className="w-16 h-16 rounded-3xl bg-[hsl(var(--surface))] flex items-center justify-center text-3xl">
              <Inbox className="w-7 h-7 text-[hsl(var(--foreground-muted))]" />
            </div>
            <p className="text-base font-semibold">No requests yet</p>
            <p className="text-sm text-[hsl(var(--foreground-muted))] text-center">Be the first to post a request on campus</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <p className="text-xs text-[hsl(var(--foreground-muted))] font-medium mb-1">
              {orders.length} request{orders.length !== 1 ? 's' : ''} nearby
            </p>
            {orders.map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <RequestCard order={order} />
              </motion.div>
            ))}
            {hasMore && (
              <button
                onClick={() => fetchOrders()}
                disabled={isLoading}
                className="w-full py-3.5 text-sm text-violet-400 font-medium border border-dashed border-violet-500/30 rounded-2xl transition-all hover:bg-violet-500/5 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Load more
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
