'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Order, OrderStatus } from '@/types';
import { useOrderStore } from '@/store/orderStore';
import { Loader2, Play, CheckSquare, XCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { reviewsAPI } from '@/lib/api';

interface Props {
  order: Order;
  isOwner: boolean;
  isProvider: boolean;
}

// Valid transitions per role
const OWNER_TRANSITIONS: Partial<Record<OrderStatus, { to: OrderStatus; label: string; icon: React.ReactNode; danger?: boolean }>> = {
  DELIVERED: { to: 'COMPLETED', label: 'Confirm Received', icon: <CheckSquare className="w-4 h-4" /> },
  BROADCASTED: { to: 'CANCELLED', label: 'Cancel Request', icon: <XCircle className="w-4 h-4" />, danger: true },
  CREATED: { to: 'CANCELLED', label: 'Cancel Request', icon: <XCircle className="w-4 h-4" />, danger: true },
};

const PROVIDER_TRANSITIONS: Partial<Record<OrderStatus, { to: OrderStatus; label: string; icon: React.ReactNode; danger?: boolean }>> = {
  ACCEPTED: { to: 'IN_PROGRESS', label: 'Start Order', icon: <Play className="w-4 h-4" /> },
  BID_SELECTED: { to: 'IN_PROGRESS', label: 'Start Order', icon: <Play className="w-4 h-4" /> },
  IN_PROGRESS: { to: 'DELIVERED', label: 'Mark Delivered', icon: <CheckSquare className="w-4 h-4" /> },
};

export default function StatusActions({ order, isOwner, isProvider }: Props) {
  const { updateOrderStatus } = useOrderStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const router = useRouter();

  const transition = isOwner
    ? OWNER_TRANSITIONS[order.status]
    : isProvider
    ? PROVIDER_TRANSITIONS[order.status]
    : null;

  const handleAction = async () => {
    if (!transition) return;
    setIsLoading(true);
    try {
      await updateOrderStatus(order._id, transition.to);
      toast.success(`Order ${transition.to === 'CANCELLED' ? 'cancelled' : 'updated'}!`);
      if (transition.to === 'COMPLETED') setShowReview(true);
    } catch {
      toast.error('Failed to update order status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async () => {
    try {
      const toUser = isOwner ? order.assignedTo?._id : order.userId._id;
      if (!toUser) return;
      await reviewsAPI.createReview({ orderId: order._id, toUser, rating, comment });
      toast.success('Review submitted! 🌟');
      setShowReview(false);
      router.refresh();
    } catch {
      toast.error('Failed to submit review');
    }
  };

  if (!transition && order.status !== 'COMPLETED') return null;

  return (
    <div className="space-y-3">
      {/* Action button */}
      {transition && (
        <button
          onClick={handleAction}
          disabled={isLoading}
          className={cn(
            'w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all',
            transition.danger
              ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 glow'
          )}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : transition.icon}
          {transition.label}
        </button>
      )}

      {/* Review form */}
      {showReview && (
        <div className="glass-card rounded-2xl p-5 border-primary/20">
          <h3 className="font-semibold mb-3">Rate your experience</h3>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}>
                <Star className={cn('w-7 h-7 transition-colors', n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground')} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave a comment (optional)"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none text-sm resize-none mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReview}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Submit Review
            </button>
            <button
              onClick={() => setShowReview(false)}
              className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Complete badge */}
      {order.status === 'COMPLETED' && !showReview && (
        <div className="text-center py-3 text-sm text-muted-foreground">
          ✅ This order is completed
        </div>
      )}
    </div>
  );
}
