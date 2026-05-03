'use client';

import { OrderStatus, STATUS_META } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  statusHistory: { status: string; timestamp: string; note?: string }[];
  currentStatus: OrderStatus;
}

const TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'CREATED', label: 'Created' },
  { status: 'BROADCASTED', label: 'Looking for provider' },
  { status: 'ACCEPTED', label: 'Provider assigned' },
  { status: 'IN_PROGRESS', label: 'In progress' },
  { status: 'DELIVERED', label: 'Delivered' },
  { status: 'COMPLETED', label: 'Completed' },
];

const STATUS_ORDER = ['CREATED', 'BROADCASTED', 'ACCEPTED', 'BID_SELECTED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'];

export default function OrderTimeline({ statusHistory, currentStatus }: Props) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';

  const getHistoryEntry = (status: string) =>
    statusHistory.find((h) => h.status === status);

  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="font-semibold text-sm mb-4">Order Timeline</h3>

      {isCancelled ? (
        <div className="flex items-center gap-3 py-3">
          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-red-400 text-sm">✕</span>
          </div>
          <div>
            <p className="font-medium text-sm text-red-400">Cancelled</p>
            {statusHistory.find((h) => h.status === 'CANCELLED')?.note && (
              <p className="text-xs text-muted-foreground">
                {statusHistory.find((h) => h.status === 'CANCELLED')?.note}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {TIMELINE_STEPS.map((step, idx) => {
            const stepIndex = STATUS_ORDER.indexOf(step.status);
            const isCompleted = currentIndex > stepIndex || currentStatus === step.status;
            const isCurrent = currentStatus === step.status || (currentStatus === 'BID_SELECTED' && step.status === 'ACCEPTED');
            const historyEntry = getHistoryEntry(step.status) || getHistoryEntry('BID_SELECTED');

            return (
              <div key={step.status} className="flex gap-3">
                {/* Icon + line */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors shrink-0',
                    isCompleted
                      ? 'bg-primary/10 border-primary'
                      : 'bg-secondary border-border'
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div className={cn(
                      'w-0.5 h-6 mt-1 transition-colors',
                      isCompleted ? 'bg-primary/30' : 'bg-border'
                    )} />
                  )}
                </div>

                {/* Content */}
                <div className="pb-4 pt-0.5 min-w-0">
                  <p className={cn(
                    'text-sm font-medium leading-none',
                    isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {step.label}
                    {isCurrent && <span className="ml-2 text-xs text-primary/70">← now</span>}
                  </p>
                  {historyEntry && isCompleted && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(historyEntry.timestamp), 'MMM d, h:mm a')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
