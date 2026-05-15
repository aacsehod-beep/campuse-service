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
import { formatCurrency, timeAgo, generateAvatarUrl } from '@/lib/utils';
import { Loader2, MapPin, Clock, Zap, User, Star } from 'lucide-react';
import Image from 'next/image';
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
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading order…
      </div>
    );
  }

  const orderUser = typeof order.userId === 'string' ? null : order.userId as import('@/types').User;
  const isOwner = orderUser?._id === user?._id;
  const isProvider = typeof order.assignedTo !== 'string' && order.assignedTo?._id === user?._id;
  const meta = CATEGORY_META[order.category];
  const statusMeta = STATUS_META[order.status];
  const canBid =
    !isOwner &&
    order.mode === 'bidding' &&
    ['CREATED', 'BROADCASTED'].includes(order.status) &&
    !order.bids?.some((b) => (typeof b.userId === 'string' ? b.userId : (b.userId as { _id: string })?._id) === user?._id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left col — main info */}
      <div className="lg:col-span-2 space-y-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header card */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center text-xl`}>
                  {meta.icon}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{meta.label}</span>
                  <p className="text-sm font-medium capitalize">{order.mode} price</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {order.urgency === 'asap' && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium">
                    <Zap className="w-3 h-3" />
                    ASAP
                  </span>
                )}
                <span className={`px-2 py-1 rounded-lg border text-xs font-medium ${statusMeta.bg} ${statusMeta.color}`} style={{ borderColor: 'transparent' }}>
                  {statusMeta.label}
                </span>
              </div>
            </div>

            <p className="text-foreground leading-relaxed">{order.description}</p>

            {order.budget && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Budget:</span>
                <span className="font-semibold text-primary">{formatCurrency(order.budget)}</span>
              </div>
            )}

            {order.finalPrice && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Final price:</span>
                <span className="font-bold text-green-400">{formatCurrency(order.finalPrice)}</span>
              </div>
            )}

            {order.location?.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{order.location.address}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              Posted {timeAgo(order.createdAt)}
            </div>
          </div>

          {/* Customer info */}
          {orderUser && (
          <div className="glass-card rounded-2xl p-4 flex items-center gap-4 mt-4">
            <Image
              src={orderUser.avatar || generateAvatarUrl(orderUser.name)}
              alt={orderUser.name}
              width={44}
              height={44}
              className="rounded-full ring-2 ring-border"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{orderUser.name}</p>
              <p className="text-xs text-muted-foreground">{orderUser.hostel || 'Campus'}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-yellow-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              {(orderUser.rating ?? 0).toFixed(1)}
            </div>
          </div>
          )}

          {/* Assigned provider */}
          {order.assignedTo && typeof order.assignedTo !== 'string' && (
            <div className="glass-card rounded-2xl p-4 flex items-center gap-4 mt-4 border-primary/20">
              <div className="relative">
                <Image
                  src={order.assignedTo.avatar || generateAvatarUrl(order.assignedTo.name)}
                  alt={order.assignedTo.name}
                  width={44}
                  height={44}
                  className="rounded-full ring-2 ring-primary/30"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{order.assignedTo.name}</p>
                <p className="text-xs text-primary">Assigned Provider</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-yellow-400">
                <Star className="w-3.5 h-3.5 fill-current" />
                {(order.assignedTo.rating ?? 0).toFixed(1)}
              </div>
            </div>
          )}

          {/* Status actions */}
          {(isOwner || isProvider) && <StatusActions order={order} isOwner={isOwner} isProvider={isProvider} />}

          {/* Bid form for non-owner */}
          {canBid && <BidForm orderId={order._id} />}

          {/* Bids list */}
          {order.mode === 'bidding' && order.bids && order.bids.length > 0 && (
            <div className="mt-5 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {order.bids.length} Bid{order.bids.length !== 1 ? 's' : ''}
              </h3>
              {order.bids.map((bid) => (
                <BidCard key={bid._id} bid={bid} orderId={order._id} isOwner={isOwner} orderStatus={order.status} />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Right col — timeline + chat */}
      <div className="space-y-5">
        <OrderTimeline statusHistory={order.statusHistory} currentStatus={order.status} />
        {(isOwner || isProvider) && <ChatPanel orderId={order._id} />}
      </div>
    </div>
  );
}
