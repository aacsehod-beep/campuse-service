'use client';

import { useEffect, useState, useMemo } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { ordersAPI } from '@/lib/api';
import {
  Loader2, Inbox, Bell, Search, MapPin, Clock, IndianRupee,
  RefreshCw, X, Plus, Zap, ChevronRight, Package, Star, LayoutGrid,
} from 'lucide-react';
import { OrderCategory, Order, CATEGORY_META } from '@/types';
import { cn, timeAgo, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const FEED_CATEGORIES: { id: OrderCategory | ''; label: string }[] = [
  { id: '', label: 'All' },
  { id: 'food', label: 'Food' },
  { id: 'print', label: 'Prints' },
  { id: 'notes', label: 'Notes' },
  { id: 'ride', label: 'Ride' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'project', label: 'Project' },
  { id: 'coaching', label: 'Coaching' },
  { id: 'design', label: 'Design' },
  { id: 'event', label: 'Event' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'others', label: 'Others' },
];

const STATUS_COLOR: Record<string, string> = {
  CREATED: 'bg-blue-500/15 text-blue-600',
  BROADCASTED: 'bg-emerald-500/15 text-emerald-600',
  ACCEPTED: 'bg-yellow-500/15 text-yellow-600',
  IN_PROGRESS: 'bg-orange-500/15 text-orange-600',
  COMPLETED: 'bg-green-500/15 text-green-600',
  CANCELLED: 'bg-red-500/15 text-red-500',
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
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                  <Zap className="w-2.5 h-2.5" /> ASAP
                </span>
              )}
              <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-500')}>
                {order.status.replaceAll('_', ' ')}
              </span>
            </div>
            <p className="text-sm font-medium text-[hsl(var(--foreground))] line-clamp-2 leading-snug">{order.description}</p>
          </div>
          <div className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'hsl(var(--surface-2))' }}>
            {(() => { const m = CATEGORY_META[order.category]; return m ? <m.icon className={`w-5 h-5 ${m.color}`} /> : <Package className="w-5 h-5" />; })()}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-[hsl(var(--foreground-muted))]">
          {order.budget ? (
            <span className="flex items-center gap-1 text-[hsl(var(--primary))] font-semibold">
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
          <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center text-[10px] font-bold text-white">
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

const ACTIVE_STATUS_COLOR: Record<string, string> = {
  CREATED:      'text-blue-600 bg-blue-500/15',
  BROADCASTED:  'text-emerald-600 bg-emerald-500/15',
  ACCEPTED:     'text-yellow-600 bg-yellow-500/15',
  BID_SELECTED: 'text-orange-600 bg-orange-500/15',
  IN_PROGRESS:  'text-orange-600 bg-orange-500/15',
};

function MyOrderCard({ order, currentUserId }: { order: Order; currentUserId?: string }) {
  const catMeta = CATEGORY_META[order.category];
  const statusColor = ACTIVE_STATUS_COLOR[order.status] || 'text-gray-500 bg-gray-100';
  const isProvider =
    typeof order.assignedTo !== 'string' &&
    order.assignedTo?._id === currentUserId;
  return (
    <Link href={`/orders/${order._id}`}>
      <motion.div whileTap={{ scale: 0.97 }} className="w-44 shrink-0 card p-3 space-y-2 border border-[hsl(var(--border))] hover:border-emerald-400/50 transition-colors">
        <div className="flex items-center justify-between">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${catMeta?.bg ?? 'bg-[hsl(var(--surface-2))]'}`}>
            {catMeta ? <catMeta.icon className={`w-4 h-4 ${catMeta.color}`} /> : <Package className="w-4 h-4" />}
          </div>
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize', statusColor)}>
            {order.status.replaceAll('_', ' ')}
          </span>
        </div>
        <p className="text-xs font-medium text-[hsl(var(--foreground))] line-clamp-2 leading-snug">{order.description}</p>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-[hsl(var(--foreground-muted))] flex items-center gap-1">
            <Clock className="w-3 h-3" />{timeAgo(order.createdAt)}
          </p>
          {isProvider && (
            <span className="text-[9px] font-semibold text-[hsl(var(--primary))] bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Provider</span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card card-shadow p-4 animate-pulse">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-[hsl(var(--surface-2))] rounded-lg w-1/4" />
              <div className="h-4 bg-[hsl(var(--surface-2))] rounded-lg w-5/6" />
              <div className="h-4 bg-[hsl(var(--surface-2))] rounded-lg w-3/4" />
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[hsl(var(--surface-2))] shrink-0" />
          </div>
          <div className="flex gap-4">
            <div className="h-3 bg-[hsl(var(--surface-2))] rounded-lg w-14" />
            <div className="h-3 bg-[hsl(var(--surface-2))] rounded-lg w-24" />
            <div className="h-3 bg-[hsl(var(--surface-2))] rounded-lg w-14 ml-auto" />
          </div>
          <div className="mt-3 pt-3 border-t border-[hsl(var(--border))] flex gap-2">
            <div className="w-6 h-6 rounded-full bg-[hsl(var(--surface-2))]" />
            <div className="h-3 bg-[hsl(var(--surface-2))] rounded-lg w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeedPage() {
  const { user } = useAuthStore();
  const { orders, isLoading, hasMore, filters, fetchOrders, setFilters } = useOrderStore();
  const { unreadCount } = useNotificationStore();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [newOrdersBanner, setNewOrdersBanner] = useState(0);
  const prevOrderCount = React.useRef(0);

  useEffect(() => {
    fetchOrders(true);
    // Fetch both customer orders AND provider orders for the tracking strip
    const ACTIVE_STATUSES = ['CREATED', 'BROADCASTED', 'ACCEPTED', 'BID_SELECTED', 'IN_PROGRESS'];
    Promise.all([
      ordersAPI.getMy({ role: 'customer', limit: 10 }),
      ordersAPI.getMy({ role: 'provider', limit: 10 }),
    ]).then(([customerRes, providerRes]) => {
      const combined = [
        ...(customerRes.data.orders || []),
        ...(providerRes.data.orders || []),
      ];
      // Deduplicate by _id and filter active
      const seen: string[] = [];
      const active = combined.filter((o: Order) => {
        if (seen.includes(o._id)) return false;
        seen.push(o._id);
        return ACTIVE_STATUSES.includes(o.status);
      });
      setMyOrders(active);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchOrders(true);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track new orders coming in via socket while user is not refreshing
  useEffect(() => {
    const prev = prevOrderCount.current;
    const curr = orders.length;
    if (prev > 0 && curr > prev && !isLoading) {
      setNewOrdersBanner((n) => n + (curr - prev));
    }
    prevOrderCount.current = curr;
  }, [orders.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCategory = (filters.category as OrderCategory) || '';

  const filtered = useMemo(() => {
    let result = dismissed.length > 0 ? orders.filter((o) => !dismissed.includes(o._id)) : orders;
    if (!search.trim()) return result;
    const q = search.toLowerCase();
    return result.filter(
      (o) =>
        o.description.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q) ||
        (typeof o.userId !== 'string' && (o.userId as { name?: string })?.name?.toLowerCase().includes(q)),
    );
  }, [orders, search, dismissed]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(true);
    setRefreshing(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[hsl(var(--background))]/95 backdrop-blur-xl pt-5 pb-3 px-4 border-b border-[hsl(var(--border))] shadow-sm shadow-[hsl(var(--border))]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-[hsl(var(--foreground-muted))]">Good to see you,</p>
            <h1 className="text-lg font-bold gradient-text">{user?.name?.split(' ')[0] || 'Hey'} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading || refreshing}
              className="w-9 h-9 rounded-2xl bg-[hsl(var(--surface))] border border-[hsl(var(--border))] flex items-center justify-center"
            >
              <RefreshCw className={cn('w-4 h-4 text-[hsl(var(--foreground-muted))]', (isLoading || refreshing) && 'animate-spin')} />
            </button>
            <Link href="/notifications">
              <div className="w-9 h-9 rounded-2xl bg-[hsl(var(--surface))] border border-[hsl(var(--border))] flex items-center justify-center relative">
                <Bell className="w-4 h-4 text-[hsl(var(--foreground-muted))]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[hsl(var(--primary))] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          {!search && <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--foreground-muted))] pointer-events-none" />}
          <input
            className={`input-base pr-9 py-2.5 text-sm transition-all ${search ? 'pl-4' : 'pl-10'}`}
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {FEED_CATEGORIES.map(({ id, label }) => {
            const meta = id ? CATEGORY_META[id] : null;
            const Icon = meta?.icon ?? LayoutGrid;
            const isActive = activeCategory === id;
            return (
              <button
                key={id}
                onClick={() => setFilters({ category: id || undefined })}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                  isActive
                    ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))] shadow-lg shadow-emerald-600/20'
                    : 'bg-white text-[hsl(var(--foreground-muted))] border-[hsl(var(--border))] hover:border-emerald-400/50',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dashboard content — only shown when not searching/filtering */}
      {!search && !filters.category && (
        <div className="px-4 pt-4 space-y-4">

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-2"
          >
            <div className="card p-3 flex flex-col gap-1">
              <div className="w-7 h-7 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Package className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-sm font-bold mt-1">{myOrders.length}</p>
              <p className="text-[10px] text-[hsl(var(--foreground-muted))]">Active orders</p>
            </div>
            <div className="card p-3 flex flex-col gap-1">
              <div className="w-7 h-7 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-yellow-400" />
              </div>
              <p className="text-sm font-bold mt-1">{(user?.rating ?? 0).toFixed(1)}</p>
              <p className="text-[10px] text-[hsl(var(--foreground-muted))]">Your rating</p>
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="grid grid-cols-2 gap-2"
          >
            <Link href="/create">
              <div className="card p-4 flex items-center gap-3 hover:border-emerald-400/50 transition-colors group cursor-pointer">
                <div className="w-9 h-9 rounded-2xl gradient-bg flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/20">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Post Request</p>
                  <p className="text-[10px] text-[hsl(var(--foreground-muted))]">Need something?</p>
                </div>
              </div>
            </Link>
            <Link href="/provider">
              <div className="card p-4 flex items-center gap-3 hover:border-green-500/40 transition-colors group cursor-pointer">
                <div className="w-9 h-9 rounded-2xl bg-green-500/15 border border-green-500/20 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Go Online</p>
                  <p className="text-[10px] text-[hsl(var(--foreground-muted))]">Earn on campus</p>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* My active orders strip */}
          {myOrders.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[hsl(var(--foreground-muted))] uppercase tracking-wide">My Active Orders</p>
                <Link href="/my-orders" className="text-xs text-[hsl(var(--primary))] flex items-center gap-0.5">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {myOrders.map((order) => (
                  <MyOrderCard key={order._id} order={order} currentUserId={user?._id} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Section label */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs font-semibold text-[hsl(var(--foreground-muted))] uppercase tracking-wide">Campus Requests</p>
            {orders.length > 0 && (
              <p className="text-[10px] text-[hsl(var(--foreground-muted))]">{orders.length} nearby</p>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={cn('flex-1 px-4 pb-4', !search && !filters.category ? 'pt-2' : 'pt-4')}>
        {/* New orders banner */}
        <AnimatePresence>
          {newOrdersBanner > 0 && (
            <motion.button
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              onClick={() => { setNewOrdersBanner(0); fetchOrders(true); }}
              className="w-full mb-3 py-2.5 px-4 rounded-2xl gradient-bg text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {newOrdersBanner} new request{newOrdersBanner > 1 ? 's' : ''} — tap to refresh
            </motion.button>
          )}
        </AnimatePresence>

        {isLoading && orders.length === 0 ? (
          <FeedSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3">
            <div className="w-16 h-16 rounded-3xl bg-[hsl(var(--surface))] flex items-center justify-center text-3xl">
              <Inbox className="w-7 h-7 text-[hsl(var(--foreground-muted))]" />
            </div>
            <p className="text-base font-semibold">
              {search ? 'No results found' : activeCategory ? `No ${activeCategory} requests` : 'No requests yet'}
            </p>
            <p className="text-sm text-[hsl(var(--foreground-muted))] text-center">
              {search
                ? `No requests match "${search}"`
                : activeCategory
                ? 'Try a different category or check back later'
                : 'Be the first to post a request on campus'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-[hsl(var(--primary))] underline underline-offset-2">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <p className="text-xs text-[hsl(var(--foreground-muted))] font-medium mb-1">
              {filtered.length} request{filtered.length !== 1 ? 's' : ''} {search ? 'found' : (filters.category ? `in ${filters.category}` : 'nearby')}
            </p>
            <AnimatePresence>
            {filtered.map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -320, transition: { duration: 0.25 } }}
                transition={{ delay: i * 0.04 }}
                drag="x"
                dragConstraints={{ left: -200, right: 0 }}
                dragElastic={{ left: 0.3, right: 0 }}
                dragDirectionLock
                onDragEnd={(_, info) => {
                  if (info.offset.x < -100) {
                    setDismissed((prev) => [...prev, order._id]);
                  }
                }}
                style={{ cursor: 'grab', position: 'relative' }}
              >
                <RequestCard order={order} />
              </motion.div>
            ))}
            </AnimatePresence>
            {hasMore && !search && (
              <button
                onClick={() => fetchOrders()}
                disabled={isLoading}
                className="w-full py-3.5 text-sm text-[hsl(var(--primary))] font-medium border border-dashed border-emerald-400/30 rounded-2xl transition-all hover:bg-emerald-500/5 disabled:opacity-50 flex items-center justify-center gap-2"
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
