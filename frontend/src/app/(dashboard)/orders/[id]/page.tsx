'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { joinOrderRoom, leaveOrderRoom } from '@/lib/socket';
import { CATEGORY_META, STATUS_META } from '@/types';
import OrderTimeline from '@/components/orders/OrderTimeline';
import BidCard from '@/components/orders/BidCard';
import BidForm from '@/components/orders/BidForm';
import ChatPanel from '@/components/orders/ChatPanel';
import StatusActions from '@/components/orders/StatusActions';
import LiveTrackingPanel from '@/components/orders/LiveTrackingPanel';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { Loader2, MapPin, Clock, Zap, Star, ArrowLeft } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import Link from 'next/link';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { activeOrder: order, isLoading, fetchOrderById } = useOrderStore();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      fetchOrderById(id);
      joinOrderRoom(id);
    }
    return () => {
      if (id) leaveOrderRoom(id);
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading order…
      </div>
    );
  }

  const orderUser = typeof order.userId === 'string' ? null : order.userId as import('@/types').User;
  const isOwner = orderUser?._id === user?._id || order.userId === user?._id;
  const isProvider = typeof order.assignedTo !== 'string' && order.assignedTo?._id === user?._id;
  const meta = CATEGORY_META[order.category];
  const statusMeta = STATUS_META[order.status];
  const canBid =
    !isOwner &&
    order.mode === 'bidding' &&
    ['CREATED', 'BROADCASTED'].includes(order.status) &&
    !order.bids?.some((b) => (typeof b.userId === 'string' ? b.userId : (b.userId as { _id: string })?._id) === user?._id);

  const canAcceptFixed =
    !isOwner &&
    !isProvider &&
    order.mode === 'fixed' &&
    ['CREATED', 'BROADCASTED'].includes(order.status);

  return (
    <div className="flex flex-col min-h-screen pb-[calc(var(--bottom-nav-height)+1rem)]">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-[hsl(var(--background))]/95 backdrop-blur-xl px-4 pt-5 pb-3 border-b border-[hsl(var(--border))] flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-2xl bg-[hsl(var(--surface))] border border-[hsl(var(--border))] flex items-center justify-center shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{order.description}</p>
          <p className="text-[11px] text-muted-foreground">{meta.label} · {order.mode}</p>
        </div>
        <span className={`px-2 py-1 rounded-lg text-[11px] font-semibold ${statusMeta.bg} ${statusMeta.color}`}>
          {statusMeta.label}
        </span>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Header card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl ${meta.bg} flex items-center justify-center shrink-0`}>
                <meta.icon className={`w-5 h-5 ${meta.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                  <span className="text-[11px] text-muted-foreground capitalize">{order.mode} price</span>
                  {order.urgency === 'asap' && (
                    <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-[11px] font-semibold">
                      <Zap className="w-3 h-3" /> ASAP
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-foreground leading-relaxed">{order.description}</p>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {order.budget && (
                <span className="font-semibold text-primary">Budget: {formatCurrency(order.budget)}</span>
              )}
              {order.finalPrice && (
                <span className="font-bold text-green-400">Final: {formatCurrency(order.finalPrice)}</span>
              )}
              {order.location?.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{order.location.address.split(',')[0]}
                </span>
              )}
              <span className="flex items-center gap-1 ml-auto">
                <Clock className="w-3 h-3" />Posted {timeAgo(order.createdAt)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Customer info */}
        {orderUser && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
              <UserAvatar
                name={orderUser.name}
                avatar={orderUser.avatar}
                size={42}
                className="ring-2 ring-[hsl(var(--border))] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{orderUser.name}</p>
                <p className="text-xs text-muted-foreground">{orderUser.hostel || 'Campus'}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-yellow-400 shrink-0">
                <Star className="w-3.5 h-3.5 fill-current" />
                {(orderUser.rating ?? 0).toFixed(1)}
              </div>
            </div>
          </motion.div>
        )}

        {/* Assigned provider */}
        {order.assignedTo && typeof order.assignedTo !== 'string' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
            <div className="glass-card rounded-2xl p-4 flex items-center gap-3 border border-primary/20">
              <div className="relative shrink-0">
                <UserAvatar
                  name={order.assignedTo.name}
                  avatar={order.assignedTo.avatar}
                  size={42}
                  className="ring-2 ring-[hsl(var(--primary))]/30"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{order.assignedTo.name}</p>
                <p className="text-xs text-primary">Assigned Provider</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-yellow-400 shrink-0">
                <Star className="w-3.5 h-3.5 fill-current" />
                {(order.assignedTo.rating ?? 0).toFixed(1)}
              </div>
            </div>
          </motion.div>
        )}

        {/* Order Timeline */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <OrderTimeline statusHistory={order.statusHistory} currentStatus={order.status} />
        </motion.div>

        {/* Status actions */}
        {(isOwner || isProvider || canAcceptFixed) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <StatusActions order={order} isOwner={isOwner} isProvider={isProvider} />
          </motion.div>
        )}

        {/* Bid form for non-owner */}
        {canBid && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <BidForm orderId={order._id} />
          </motion.div>
        )}

        {/* Bids list */}
        {order.mode === 'bidding' && order.bids && order.bids.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {order.bids.length} Bid{order.bids.length !== 1 ? 's' : ''}
            </h3>
            {order.bids.map((bid) => (
              <BidCard key={bid._id} bid={bid} orderId={order._id} isOwner={isOwner} orderStatus={order.status} />
            ))}
          </motion.div>
        )}

        {/* Live Tracking — only when IN_PROGRESS and both parties are set */}
        {(isOwner || isProvider) && order.status === 'IN_PROGRESS' && (
          <LiveTrackingPanel
            orderId={order._id}
            isProvider={isProvider}
            orderStatus={order.status}
            providerName={
              typeof order.assignedTo !== 'string' && order.assignedTo
                ? order.assignedTo.name
                : 'Provider'
            }
          />
        )}

        {/* Chat */}
        {(isOwner || isProvider) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <ChatPanel orderId={order._id} orderStatus={order.status} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
