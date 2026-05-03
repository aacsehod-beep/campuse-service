'use client';

import { useState } from 'react';
import { useOrderStore } from '@/store/orderStore';
import { DollarSign, MessageSquare, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  orderId: string;
}

export default function BidForm({ orderId }: Props) {
  const { placeBid } = useOrderStore();
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || parseFloat(price) < 1) return toast.error('Enter a valid bid price');

    setIsLoading(true);
    try {
      await placeBid(orderId, {
        price: parseFloat(price),
        message: message.trim() || undefined,
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
      });
      setSubmitted(true);
      toast.success('Bid placed successfully!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to place bid';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass-card rounded-2xl p-5 border-primary/20 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-semibold">Bid placed!</p>
        <p className="text-sm text-muted-foreground mt-1">The customer will review your bid.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 border-primary/20">
      <h3 className="font-semibold mb-4">Place a Bid</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Your price (₹)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              min="1"
              className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Est. time (min)
            </label>
            <input
              type="number"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="e.g. 20"
              min="1"
              className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Message <span className="font-normal">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell the customer why they should pick you…"
            rows={2}
            maxLength={300}
            className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2 glow transition-all"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Submit Bid
        </button>
      </form>
    </div>
  );
}
