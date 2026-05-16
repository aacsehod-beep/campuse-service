'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOrderStore } from '@/store/orderStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import { OrderCategory, OrderMode, OrderUrgency, CATEGORY_META } from '@/types';
import { MapPin, Loader2, Zap, IndianRupee, ChevronLeft, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

const CATEGORIES = (
  ['food', 'print', 'notes', 'ride', 'assessment', 'project', 'coaching', 'design', 'event', 'marketplace', 'others'] as OrderCategory[]
).map((id) => ({
  id,
  label: CATEGORY_META[id].label.split(' ')[0],
  Icon: CATEGORY_META[id].icon,
  color: CATEGORY_META[id].color,
  bg: CATEGORY_META[id].bg,
}));

const CATEGORY_PLACEHOLDER: Record<OrderCategory, string> = {
  food:        'What food do you want? From which canteen? Any specific time for delivery?',
  print:       'How many pages? Color or B&W? File name or Google Drive link?',
  notes:       'Which subject? Which units/chapters? Handwritten or printed?',
  ride:        'From where? To where? When do you need it?',
  assessment:  'Which subject/paper? Deadline? Any specific instructions?',
  project:     'What project? Tech stack? Deadline and scope?',
  coaching:    'Which subject? Which topics? Preferred time slots?',
  design:      'What do you need designed? Style preference? Reference links?',
  event:       'What kind of event support? Date, venue, and what is needed?',
  marketplace: 'What item? New or second-hand? Budget range?',
  others:      'Describe what you need in as much detail as possible...',
};

function CreateRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createOrder } = useOrderStore();
  const { coordinates, address, isLoading: locLoading, getLocation } = useGeolocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paramCategory = searchParams.get('category') as OrderCategory | null;
  const paramBudget = searchParams.get('budget') || '';
  const paramProviderId = searchParams.get('providerId') || '';
  const paramProviderName = searchParams.get('providerName') || '';
  const paramServiceId = searchParams.get('serviceId') || '';
  const paramTitle = searchParams.get('title') || '';

  const [form, setForm] = useState({
    category: (paramCategory && CATEGORY_META[paramCategory] ? paramCategory : 'food') as OrderCategory,
    description: paramTitle ? 'Requesting: ' + paramTitle + '\n\n' : '',
    budget: paramBudget,
    mode: 'fixed' as OrderMode,
    urgency: 'normal' as OrderUrgency,
  });

  useEffect(() => {
    if (paramCategory && CATEGORY_META[paramCategory]) {
      setForm((p) => ({ ...p, category: paramCategory }));
    }
  }, [paramCategory]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) return toast.error('Please describe what you need');
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        ...form,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        location: coordinates ? { type: 'Point', coordinates, address } : undefined,
      };
      if (paramProviderId) payload.assignedTo = paramProviderId;
      if (paramServiceId) payload.serviceId = paramServiceId;
      const order = await createOrder(payload as Parameters<typeof createOrder>[0]);
      toast.success('Request posted!');
      router.push('/orders/' + order._id);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create request';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const placeholder = CATEGORY_PLACEHOLDER[form.category];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[hsl(var(--background))]/95 backdrop-blur-xl px-4 pt-5 pb-4 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-3">
          <Link
            href="/feed"
            className="w-9 h-9 rounded-2xl bg-[hsl(var(--surface))] border border-[hsl(var(--border))] flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold">New Request</h1>
            <p className="text-xs text-[hsl(var(--foreground-muted))]">Tell your campus what you need</p>
          </div>
        </div>

        {paramProviderName && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(var(--primary))]/8 border border-[hsl(var(--primary))]/20">
            <User className="w-3.5 h-3.5 text-[hsl(var(--primary))] shrink-0" />
            <p className="text-xs text-[hsl(var(--primary))] flex-1">
              Requesting from <strong>{paramProviderName}</strong>
            </p>
            <button onClick={() => router.replace('/create')} className="text-[hsl(var(--foreground-muted))]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Step progress */}
        <div className="mt-3 flex items-center gap-1">
          {['Category', 'Details', 'Budget', 'Options'].map((step, i) => {
            const filled =
              i === 0 ? true :
              i === 1 ? form.description.trim().length > 0 :
              i === 2 ? !!form.budget :
              true;
            return (
              <div key={step} className="flex-1 flex flex-col gap-1">
                <div className={cn('h-1 rounded-full transition-all', filled ? 'gradient-bg' : 'bg-[hsl(var(--surface-2))]')} />
                <span className={cn('text-[9px] font-medium text-center', filled ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--foreground-muted))]')}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 px-4 py-5 space-y-6 overflow-y-auto">

          {/* Category */}
          <div>
            <label className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 block">Category</label>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {CATEGORIES.map(({ id, label, Icon, color, bg }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => set('category', id)}
                  className={cn(
                    'flex flex-col items-center gap-2 min-w-[72px] py-3 px-3 rounded-2xl border transition-all',
                    form.category === id
                      ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-600/10'
                      : 'bg-white border-[hsl(var(--border))]',
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', form.category === id ? bg : 'bg-[hsl(var(--surface-2))]')}>
                    <Icon className={cn('w-4 h-4', form.category === id ? color : 'text-[hsl(var(--foreground-muted))]')} />
                  </div>
                  <span className={cn('text-xs font-medium', form.category === id ? 'text-emerald-700' : 'text-[hsl(var(--foreground-muted))]')}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={placeholder}
              rows={4}
              maxLength={500}
              className="input-base resize-none leading-relaxed"
              required
            />
            <p className="text-[11px] text-[hsl(var(--foreground-muted))] text-right mt-1">{form.description.length}/500</p>
          </div>

          {/* Mode */}
          <div>
            <label className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2 block">Pricing Mode</label>
            <div className="flex gap-3">
              {(['fixed', 'bidding'] as OrderMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set('mode', m)}
                  className={cn(
                    'flex-1 py-3 rounded-2xl text-sm font-semibold border transition-all',
                    form.mode === m
                      ? 'gradient-bg text-white border-transparent shadow-lg shadow-emerald-600/20'
                      : 'bg-white text-[hsl(var(--foreground-muted))] border-[hsl(var(--border))]',
                  )}
                >
                  {m === 'fixed' ? 'Fixed Price' : 'Open Bidding'}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-[hsl(var(--primary))]" />
              Budget
              <span className="text-[hsl(var(--foreground-muted))] font-normal text-xs">(optional)</span>
            </label>
            {/* Quick preset chips */}
            <div className="flex gap-2 mb-2 flex-wrap">
              {['50', '100', '200', '500'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => set('budget', form.budget === amt ? '' : amt)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all',
                    form.budget === amt
                      ? 'gradient-bg text-white border-transparent shadow-sm shadow-emerald-600/20'
                      : 'bg-white text-[hsl(var(--foreground-muted))] border-[hsl(var(--border))]',
                  )}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--foreground-muted))] font-medium">Rs.</span>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => set('budget', e.target.value)}
                placeholder="0"
                min="0"
                className="input-base pl-10"
              />
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2 block">Urgency</label>
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
                        ? 'bg-orange-500/15 border-orange-500/50 text-orange-600'
                        : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700'
                      : 'bg-white text-[hsl(var(--foreground-muted))] border-[hsl(var(--border))]',
                  )}
                >
                  {u === 'asap' && <Zap className="w-4 h-4" />}
                  {u === 'asap' ? 'ASAP' : 'Normal'}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[hsl(var(--primary))]" />
              Pickup / Delivery
            </label>
            {coordinates ? (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/25">
                <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-green-700 font-medium truncate">{address || 'Location captured'}</p>
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
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-[hsl(var(--border))] text-[hsl(var(--foreground-muted))] hover:border-emerald-400/50 hover:text-[hsl(var(--primary))] text-sm transition-all disabled:opacity-50"
              >
                {locLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                {locLoading ? 'Getting location...' : 'Use my current location'}
              </button>
            )}
          </div>

        </div>

        {/* Sticky submit */}
        <div className="sticky bottom-[var(--bottom-nav-height)] bg-[hsl(var(--background))]/95 backdrop-blur-xl px-4 py-3 border-t border-[hsl(var(--border))]">
          <button
            type="submit"
            disabled={isSubmitting || !form.description.trim()}
            className="w-full py-4 rounded-2xl gradient-bg text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Posting...</>
            ) : (
              'Post Request'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateRequestPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--primary))]" />
      </div>
    }>
      <CreateRequestContent />
    </Suspense>
  );
}
