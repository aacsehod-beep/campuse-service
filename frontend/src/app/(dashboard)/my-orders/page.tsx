'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ordersAPI } from '@/lib/api';
import { Order, OrderStatus } from '@/types';
import { Loader2, Package, Clock, CheckCircle2, XCircle, ChevronRight, IndianRupee } from 'lucide-react';
import { cn, timeAgo, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const TABS = [
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'done' },
];

const ROLE_TABS = [
  { label: 'As Customer', value: 'customer' },
  { label: 'As Provider', value: 'provider' },
];

const ACTIVE_STATUSES = ['CREATED', 'BROADCASTED', 'ACCEPTED', 'BID_SELECTED', 'IN_PROGRESS'];
const DONE_STATUSES   = ['COMPLETED', 'CANCELLED', 'DELIVERED'];

const STATUS_INFO: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  CREATED:     { label: 'Posted',      color: 'text-blue-400 bg-blue-500/15',    icon: Clock },
  BROADCASTED: { label: 'Live',        color: 'text-violet-400 bg-violet-500/15', icon: Clock },
  ACCEPTED:    { label: 'Accepted',    color: 'text-yellow-400 bg-yellow-500/15', icon: Clock },
  BID_SELECTED:{ label: 'Bid Accepted',color: 'text-orange-400 bg-orange-500/15', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'text-orange-400 bg-orange-500/15', icon: Clock },
  DELIVERED:   { label: 'Delivered',   color: 'text-green-400 bg-green-500/15',   icon: CheckCircle2 },
  COMPLETED:   { label: 'Completed',   color: 'text-green-400 bg-green-500/15',   icon: CheckCircle2 },
  CANCELLED:   { label: 'Cancelled',   color: 'text-red-400 bg-red-500/15',       icon: XCircle },
};

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍕', print: '🖨️', notes: '📝', ride: '🛵', others: '📦',
};

function OrderCard({ order }: { order: Order }) {
  const info = STATUS_INFO[order.status] || { label: order.status, color: 'text-white/60 bg-white/10', icon: Clock };
  const StatusIcon = info.icon;

  return (
    <Link href={`/orders/${order._id}`}>
      <motion.div whileTap={{ scale: 0.98 }} className="card card-shadow p-4 transition-opacity active:opacity-80">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[hsl(var(--surface-2))] flex items-center justify-center text-xl shrink-0">
            {CATEGORY_EMOJI[order.category] || '📦'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white line-clamp-2 leading-snug mb-2">{order.description}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full', info.color)}>
                <StatusIcon className="w-3 h-3" />
                {info.label}
              </span>
              {order.finalPrice || order.budget ? (
                <span className="inline-flex items-center gap-0.5 text-[11px] text-violet-400 font-semibold">
                  <IndianRupee className="w-3 h-3" />
                  {formatCurrency(order.finalPrice || order.budget || 0)}
                </span>
              ) : null}
              <span className="text-[11px] text-[hsl(var(--foreground-muted))] ml-auto">{timeAgo(order.createdAt)}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[hsl(var(--foreground-muted))] shrink-0 mt-1" />
        </div>

        {/* Progress bar for active orders */}
        {ACTIVE_STATUSES.includes(order.status) && (
          <div className="mt-3 pt-3 border-t border-[hsl(var(--border))]">
            <div className="flex items-center justify-between text-[10px] text-[hsl(var(--foreground-muted))] mb-1.5">
              <span>Posted</span><span>In Progress</span><span>Done</span>
            </div>
            <div className="h-1 bg-[hsl(var(--surface-2))] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full gradient-bg transition-all duration-700"
                style={{
                  width: {
                    CREATED: '10%', BROADCASTED: '25%', ACCEPTED: '50%',
                    BID_SELECTED: '60%', IN_PROGRESS: '80%',
                  }[order.status] || '0%',
                }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </Link>
  );
}

export default function MyOrdersPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data } = await ordersAPI.getMy({ role });
      setOrders(data.orders || []);
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = orders.filter((o) =>
    activeTab === 'active' ? ACTIVE_STATUSES.includes(o.status) : DONE_STATUSES.includes(o.status),
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[hsl(var(--background))]/95 backdrop-blur-xl px-4 pt-5 pb-3 border-b border-[hsl(var(--border))]">
        <h1 className="text-xl font-bold mb-3">My Orders</h1>

        {/* Role toggle */}
        <div className="flex gap-1.5 p-1 bg-[hsl(var(--surface))] rounded-2xl mb-3">
          {ROLE_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setRole(t.value as 'customer' | 'provider')}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-semibold transition-all',
                role === t.value
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-[hsl(var(--foreground-muted))]',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Active/Done tabs */}
        <div className="flex gap-4">
          {TABS.map((t) => {
            const count = orders.filter((o) =>
              t.value === 'active' ? ACTIVE_STATUSES.includes(o.status) : DONE_STATUSES.includes(o.status),
            ).length;
            return (
              <button
                key={t.value}
                onClick={() => setActiveTab(t.value)}
                className={cn(
                  'flex items-center gap-2 pb-2 text-sm font-semibold border-b-2 transition-all',
                  activeTab === t.value
                    ? 'text-white border-violet-500'
                    : 'text-[hsl(var(--foreground-muted))] border-transparent',
                )}
              >
                {t.label}
                {count > 0 && (
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                    activeTab === t.value ? 'bg-violet-600 text-white' : 'bg-[hsl(var(--surface-2))] text-[hsl(var(--foreground-muted))]',
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
            <p className="text-sm text-[hsl(var(--foreground-muted))]">Loading orders�</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3">
            <div className="w-16 h-16 rounded-3xl bg-[hsl(var(--surface))] flex items-center justify-center">
              <Package className="w-7 h-7 text-[hsl(var(--foreground-muted))]" />
            </div>
            <p className="text-base font-semibold">No {activeTab === 'active' ? 'active' : 'past'} orders</p>
            <p className="text-sm text-[hsl(var(--foreground-muted))] text-center">
              {activeTab === 'active' ? 'Post a request to get started' : 'Your completed orders will appear here'}
            </p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {filtered.map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <OrderCard order={order} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
