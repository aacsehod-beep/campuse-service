'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useOrderStore } from '@/store/orderStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import { OrderCategory, OrderMode, OrderUrgency } from '@/types';
import { MapPin, Loader2, Zap, IndianRupee, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

const CATEGORIES: { id: OrderCategory; label: string; emoji: string }[] = [
  { id: 'food',   label: 'Food',     emoji: '🍕' },
  { id: 'print',  label: 'Prints',   emoji: '🖨️' },
  { id: 'notes',  label: 'Notes',    emoji: '📝' },
  { id: 'ride',   label: 'Ride',     emoji: '🛵' },
  { id: 'others', label: 'Others',   emoji: '📦' },
];

export default function CreateRequestPage() {
  const router = useRouter();
  const { createOrder } = useOrderStore();
  const { coordinates, address, isLoading: locLoading, getLocation } = useGeolocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    category: 'food' as OrderCategory,
    description: '',
    budget: '',
    mode: 'fixed' as OrderMode,
    urgency: 'normal' as OrderUrgency,
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) return toast.error('Please describe what you need');
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        location: coordinates ? { type: 'Point', coordinates, address } : undefined,
      };
      const order = await createOrder(payload);
      toast.success('Request posted! 🚀');
      router.push(`/orders/${order._id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create request';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[hsl(var(--background))]/95 backdrop-blur-xl px-4 pt-5 pb-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-3">
          <Link href="/feed" className="w-9 h-9 rounded-2xl bg-[hsl(var(--surface))] border border-[hsl(var(--border))] flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold">New Request</h1>
            <p className="text-xs text-[hsl(var(--foreground-muted))]">Tell your campus what you need</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 px-4 py-5 space-y-6 overflow-y-auto">

          {/* Category selector */}
          <div>
            <label className="text-sm font-semibold text-white mb-3 block">Category</label>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {CATEGORIES.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => set('category', id)}
                  className={cn(
                    'flex flex-col items-center gap-2 min-w-[72px] py-3 px-3 rounded-2xl border transition-all',
                    form.category === id
                      ? 'bg-violet-600/20 border-violet-500/60 shadow-md shadow-violet-600/20'
                      : 'bg-[hsl(var(--surface))] border-[hsl(var(--border))]',
                  )}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className={cn('text-xs font-medium', form.category === id ? 'text-violet-300' : 'text-[hsl(var(--foreground-muted))]')}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-white mb-2 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={`What exactly do you need? Be specific…\ne.g. "2 sets of circuit theory notes, unit 3-5"`}
              rows={4}
              maxLength={500}
              className="input-base resize-none leading-relaxed"
              required
            />
            <p className="text-[11px] text-[hsl(var(--foreground-muted))] text-right mt-1">{form.description.length}/500</p>
          </div>

          {/* Mode toggle */}
          <div>
            <label className="text-sm font-semibold text-white mb-2 block">Pricing Mode</label>
            <div className="flex gap-3">
              {(['fixed', 'bidding'] as OrderMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set('mode', m)}
                  className={cn(
                    'flex-1 py-3 rounded-2xl text-sm font-semibold border transition-all',
                    form.mode === m
                      ? 'gradient-bg text-white border-transparent shadow-lg shadow-violet-600/25'
                      : 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] border-[hsl(var(--border))]',
                  )}
                >
                  {m === 'fixed' ? '💰 Fixed' : '🏷️ Bidding'}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-violet-400" />
              Budget
              <span className="text-[hsl(var(--foreground-muted))] font-normal text-xs">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--foreground-muted))] font-medium">₹</span>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => set('budget', e.target.value)}
                placeholder="0"
                min="0"
                className="input-base pl-8"
              />
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="text-sm font-semibold text-white mb-2 block">Urgency</label>
            <div className="flex gap-3">
              {(['normal', 'asap'] as OrderUrgency[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => set('urgency', u)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-semibold transition-all',
                    form.urgency === u
                      ? u === 'asap'
                        ? 'bg-orange-500/20 border-orange-500/60 text-orange-400'
                        : 'bg-violet-600/20 border-violet-500/60 text-violet-300'
                      : 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] border-[hsl(var(--border))]',
                  )}
                >
                  {u === 'asap' ? <Zap className="w-4 h-4" /> : <span>🕐</span>}
                  {u === 'asap' ? 'ASAP' : 'Normal'}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-violet-400" />
              Pickup / Delivery
            </label>
            {coordinates ? (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/25">
                <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-green-300 font-medium truncate">{address || 'Location captured'}</p>
                  <button type="button" onClick={getLocation} className="text-xs text-[hsl(var(--foreground-muted))] mt-0.5">
                    Update location
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={getLocation}
                disabled={locLoading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-[hsl(var(--border))] text-[hsl(var(--foreground-muted))] hover:border-violet-500/40 hover:text-white text-sm transition-all disabled:opacity-50"
              >
                {locLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                {locLoading ? 'Getting location�' : 'Use my current location'}
              </button>
            )}
          </div>

        </div>

        {/* Sticky Post button */}
        <div className="sticky bottom-[var(--bottom-nav-height)] bg-[hsl(var(--background))]/95 backdrop-blur-xl px-4 py-3 border-t border-[hsl(var(--border))]">
          <button
            type="submit"
            disabled={isSubmitting || !form.description.trim()}
            className="w-full py-4 rounded-2xl gradient-bg text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-violet-600/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Posting�</>
            ) : (
              <>🚀 Post Request</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
