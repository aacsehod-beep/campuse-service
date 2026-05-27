'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bid, OrderStatus } from '@/types';
import { useOrderStore } from '@/store/orderStore';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { Star, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props {
  bid: Bid;
  orderId: string;
  isOwner: boolean;
  orderStatus: OrderStatus;
}

export default function BidCard({ bid, orderId, isOwner, orderStatus }: Props) {
  const { acceptBid } = useOrderStore();
  const [isAccepting, setIsAccepting] = useState(false);
  const canAccept = isOwner && ['CREATED', 'BROADCASTED'].includes(orderStatus) && bid.status === 'pending';

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await acceptBid(orderId, bid._id);
      toast.success(`Bid of ${formatCurrency(bid.price)} accepted!`);
    } catch {
      toast.error('Failed to accept bid');
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'glass-card rounded-xl p-4 transition-colors',
        bid.status === 'accepted' && 'border-green-500/30 bg-green-500/5',
        bid.status === 'rejected' && 'opacity-50'
      )}
    >
      <div className="flex items-start gap-3">
        <UserAvatar
          name={(bid.userId as { name: string })?.name || 'User'}
          avatar={(bid.userId as { avatar?: string })?.avatar}
          size={40}
          className="rounded-xl shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{(bid.userId as { name: string })?.name || 'User'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-yellow-400">
                  <Star className="w-3 h-3 fill-current" />
                  {((bid.userId as { rating?: number })?.rating ?? 0).toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(bid.userId as { completedOrders?: number })?.completedOrders ?? 0} orders
                </span>
                <span className="text-xs text-green-400">
                  {(bid.userId as { reliabilityScore?: number })?.reliabilityScore ?? 100}% reliable
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary text-lg">{formatCurrency(bid.price)}</p>
              {bid.estimatedTime && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                  <Clock className="w-3 h-3" />
                  ~{bid.estimatedTime}min
                </p>
              )}
            </div>
          </div>

          {bid.message && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{bid.message}</p>
          )}

          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground">{timeAgo(bid.createdAt)}</p>

            {bid.status === 'accepted' && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Selected
              </span>
            )}

            {canAccept && (
              <button
                onClick={handleAccept}
                disabled={isAccepting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 disabled:opacity-60 transition-all"
              >
                {isAccepting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Accept Bid
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
